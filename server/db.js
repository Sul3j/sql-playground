// Zarządzanie bazami uczniów: każda sesja dostaje własną bazę danych i własnego użytkownika MySQL
// z uprawnieniami wyłącznie do tej bazy (oraz prawem tworzenia własnych kont — patrz rewrite.js).
import crypto from 'node:crypto'
import fs from 'node:fs'
import mysql from 'mysql2/promise'
import { leadingKeyword, splitStatements, stripLeadingComments } from './sqlSplit.js'
import { classify, makeUnmapper, rewriteStatement, RewriteError } from './rewrite.js'

const config = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3307),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD ?? 'playground',
}

const SEED_SQL = fs.readFileSync(new URL('./seed.sql', import.meta.url), 'utf8')
const MAX_ROWS = 1000
const PREVIEW_ROWS = 200
const QUERY_TIMEOUT_MS = 5000
const SESSION_IDLE_MS = 3 * 60 * 60 * 1000
const MAX_SESSIONS = 150
const MAX_ACCOUNTS_PER_SESSION = 30

// Konta sesji: pg_<16 hex>; bazy sesji: pg_<16 hex>_db; konta tworzone przez uczniów: <nazwa>~<8 hex>
const SESSION_USER_RE = /^pg_[0-9a-f]{16}$/
const STUDENT_ACCOUNT_RE = /~[0-9a-f]{8}$/

const DML = new Set(['INSERT', 'UPDATE', 'DELETE', 'REPLACE'])
// Kody typów kolumn liczbowych w protokole MySQL (DECIMAL, TINY, SHORT, LONG, FLOAT, DOUBLE, LONGLONG, INT24, YEAR, NEWDECIMAL)
const NUMERIC_TYPES = new Set([0, 1, 2, 3, 4, 5, 8, 9, 13, 246])

const connectionOptions = {
  dateStrings: true,
  supportBigNumbers: true,
  bigNumberStrings: true,
  charset: 'utf8mb4_general_ci',
}

let admin = null
// Osobna pula bez multipleStatements — do poleceń ucznia wykonywanych z prawami administratora (SHOW GRANTS FOR)
let adminSingle = null
let serverVersion = ''
let baselineAccounts = new Set()
const sessions = new Map()

const accountKey = (u) => `${u.name}@${u.host}`

async function listAccounts() {
  const [rows] = await admin.query('SELECT User AS name, Host AS host FROM mysql.user')
  return rows
}

export async function initDatabase({ retries = 60 } = {}) {
  admin = mysql.createPool({ ...config, ...connectionOptions, multipleStatements: true, connectionLimit: 5 })
  adminSingle = mysql.createPool({ ...config, ...connectionOptions, multipleStatements: false, connectionLimit: 2 })
  for (let attempt = 1; ; attempt++) {
    try {
      const [[row]] = await admin.query('SELECT VERSION() AS v')
      serverVersion = row.v
      break
    } catch (e) {
      if (attempt >= retries) throw e
      if (attempt === 1) console.log(`Czekam na serwer MySQL (${config.host}:${config.port})…`)
      await new Promise((r) => setTimeout(r, 1000))
    }
  }
  await removeLeftovers()
  baselineAccounts = new Set((await listAccounts()).map(accountKey))
  setInterval(removeIdleSessions, 10 * 60 * 1000).unref()
  return serverVersion
}

// Hasła sesji trzymamy tylko w pamięci, więc po restarcie serwera stare bazy i konta są bezużyteczne
async function removeLeftovers() {
  const [dbs] = await admin.query(
    "SELECT SCHEMA_NAME AS name FROM information_schema.SCHEMATA WHERE SCHEMA_NAME LIKE 'pg\\_%'",
  )
  for (const { name } of dbs) await admin.query('DROP DATABASE IF EXISTS ??', [name])
  for (const u of await listAccounts()) {
    if (SESSION_USER_RE.test(u.name) || STUDENT_ACCOUNT_RE.test(u.name))
      await admin.query('DROP USER IF EXISTS ?@?', [u.name, u.host])
  }
}

async function createDatabase(db) {
  await admin.query('CREATE DATABASE ?? CHARACTER SET utf8mb4', [db])
  const conn = await admin.getConnection()
  try {
    await conn.query('USE ??', [db])
    await conn.query(SEED_SQL)
  } finally {
    conn.release()
  }
}

async function dropStudentAccounts(session) {
  for (const u of await listAccounts()) {
    if (u.name.endsWith(`~${session.tag}`)) await admin.query('DROP USER IF EXISTS ?@?', [u.name, u.host])
  }
}

async function createSession() {
  if (sessions.size >= MAX_SESSIONS) {
    const oldest = [...sessions.values()].sort((a, b) => a.lastUsed - b.lastUsed)[0]
    await destroySession(oldest)
  }
  let id
  do id = crypto.randomBytes(8).toString('hex')
  while ([...sessions.values()].some((s) => s.tag === id.slice(0, 8)))

  const user = `pg_${id}`
  const db = `pg_${id}_db`
  const password = crypto.randomBytes(18).toString('base64url')
  await admin.query("CREATE USER ?@'%' IDENTIFIED BY ? WITH MAX_USER_CONNECTIONS 3", [user, password])
  await admin.query("GRANT ALL PRIVILEGES ON ??.* TO ?@'%' WITH GRANT OPTION", [db, user])
  // Prawo CREATE USER pozwala ćwiczyć zarządzanie kontami; nazwy kont są izolowane w rewrite.js
  await admin.query("GRANT CREATE USER ON *.* TO ?@'%'", [user])
  await createDatabase(db)

  const tag = id.slice(0, 8)
  const session = {
    id,
    user,
    db,
    tag,
    password,
    unmap: makeUnmapper({ db, user, tag }),
    conn: null,
    queue: Promise.resolve(),
    lastUsed: Date.now(),
  }
  sessions.set(id, session)
  return session
}

async function destroySession(session) {
  sessions.delete(session.id)
  closeConnection(session)
  await admin.query('DROP DATABASE IF EXISTS ??', [session.db])
  await dropStudentAccounts(session)
  await admin.query("DROP USER IF EXISTS ?@'%'", [session.user])
}

async function removeIdleSessions() {
  const now = Date.now()
  for (const s of sessions.values()) {
    if (now - s.lastUsed > SESSION_IDLE_MS) await destroySession(s).catch(() => {})
  }
}

function closeConnection(session) {
  session.conn?.destroy()
  session.conn = null
}

async function getConnection(session) {
  if (session.conn) return session.conn
  const conn = await mysql.createConnection({
    ...connectionOptions,
    host: config.host,
    port: config.port,
    user: session.user,
    password: session.password,
    database: session.db,
  })
  conn.on('error', () => {
    if (session.conn === conn) session.conn = null
  })
  await conn.query(`SET SESSION max_execution_time = ${QUERY_TIMEOUT_MS}, innodb_lock_wait_timeout = 5`)
  session.conn = conn
  return conn
}

/** Jedno połączenie na sesję, więc polecenia ucznia wykonujemy po kolei. */
function exclusive(session, fn) {
  session.lastUsed = Date.now()
  const run = session.queue.then(fn, fn)
  session.queue = run.catch(() => {})
  return run
}

export function getSession(id) {
  return typeof id === 'string' ? sessions.get(id) : undefined
}

export async function openSession(id) {
  const session = getSession(id) ?? (await createSession())
  session.lastUsed = Date.now()
  return { sessionId: session.id, version: serverVersion, schema: await readSchema(session) }
}

export function resetSession(session) {
  return exclusive(session, async () => {
    closeConnection(session)
    await dropStudentAccounts(session)
    await admin.query('DROP DATABASE IF EXISTS ??', [session.db])
    await createDatabase(session.db)
    return { schema: await readSchema(session) }
  })
}

export async function readSchema(session) {
  const db = session.db
  const [tables] = await admin.query(
    'SELECT TABLE_NAME AS name, TABLE_TYPE AS type FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_TYPE, TABLE_NAME',
    [db],
  )
  const [columns] = await admin.query(
    `SELECT TABLE_NAME AS tableName, COLUMN_NAME AS name, COLUMN_TYPE AS type, IS_NULLABLE AS nullable,
            COLUMN_KEY AS columnKey, EXTRA AS extra
     FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME, ORDINAL_POSITION`,
    [db],
  )
  const [fks] = await admin.query(
    `SELECT TABLE_NAME AS tableName, COLUMN_NAME AS name, REFERENCED_TABLE_NAME AS refTable, REFERENCED_COLUMN_NAME AS refColumn
     FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL`,
    [db],
  )

  const counts = {}
  const baseTables = tables.filter((t) => t.type === 'BASE TABLE')
  if (baseTables.length) {
    const sql = baseTables.map(() => 'SELECT ? AS name, COUNT(*) AS n FROM ??.??').join(' UNION ALL ')
    const params = baseTables.flatMap((t) => [t.name, db, t.name])
    const [rows] = await admin.query(sql, params)
    for (const r of rows) counts[r.name] = Number(r.n)
  }

  return tables.map((t) => ({
    name: t.name,
    type: t.type === 'VIEW' ? 'view' : 'table',
    rowCount: counts[t.name] ?? null,
    columns: columns
      .filter((c) => c.tableName === t.name)
      .map((c) => {
        const fk = fks.find((f) => f.tableName === t.name && f.name === c.name)
        return {
          name: c.name,
          type: c.type,
          notNull: c.nullable === 'NO',
          pk: c.columnKey === 'PRI',
          unique: c.columnKey === 'UNI',
          autoIncrement: /auto_increment/i.test(c.extra),
          fk: fk ? { table: fk.refTable, column: fk.refColumn } : null,
        }
      }),
  }))
}

function cleanValue(v, unmap) {
  if (Buffer.isBuffer(v)) return `[BLOB ${v.length} B]`
  if (v !== null && typeof v === 'object') return JSON.stringify(v)
  return unmap(v)
}

function rowsItem(session, sql, keyword, rows, fields, ms) {
  return {
    kind: 'rows',
    sql,
    keyword,
    columns: fields.map((f) => session.unmap(f.name)),
    numeric: fields.map((f) => NUMERIC_TYPES.has(f.columnType ?? f.type)),
    rows: rows.slice(0, MAX_ROWS).map((r) => r.map((v) => cleanValue(v, session.unmap))),
    total: rows.length,
    ms,
  }
}

/** Tabela, której dotyczy INSERT / UPDATE / DELETE / REPLACE. */
function targetTable(sql) {
  const m = stripLeadingComments(sql).match(
    /^(?:(?:INSERT|REPLACE)(?:\s+(?:LOW_PRIORITY|DELAYED|HIGH_PRIORITY|IGNORE))*(?:\s+INTO)?|UPDATE(?:\s+(?:LOW_PRIORITY|IGNORE))*|DELETE(?:\s+(?:LOW_PRIORITY|QUICK|IGNORE))*\s+FROM)\s+((?:`[^`]+`|\w+)(?:\.(?:`[^`]+`|\w+))?)/i,
  )
  if (!m) return null
  return m[1].split('.').pop().replace(/`/g, '')
}

async function preview(session, conn, table) {
  try {
    const [rows, fields] = await conn.query({ sql: `SELECT * FROM ?? LIMIT ${PREVIEW_ROWS}`, rowsAsArray: true }, [table])
    const item = rowsItem(session, '', '', rows, fields, 0)
    return { columns: item.columns, numeric: item.numeric, rows: item.rows }
  } catch {
    return null
  }
}

/** Zabezpieczenie: każde konto utworzone przez ucznia musi mieć jego przyrostek — inne usuwamy. */
async function enforceAccountIsolation() {
  const foreign = (await listAccounts()).filter(
    (u) => !baselineAccounts.has(accountKey(u)) && !SESSION_USER_RE.test(u.name) && !STUDENT_ACCOUNT_RE.test(u.name),
  )
  for (const u of foreign) await admin.query('DROP USER IF EXISTS ?@?', [u.name, u.host])
  return foreign.length === 0
}

async function runStatement(session, sql) {
  const keyword = leadingKeyword(sql)
  const kind = classify(sql)
  const t0 = performance.now()
  const errorItem = (e) => ({
    kind: 'error',
    sql,
    keyword,
    errno: e.errno ?? null,
    sqlState: e.sqlState ?? null,
    message: session.unmap(e.sqlMessage || e.message),
  })

  if (kind === 'flush') {
    return [
      {
        kind: 'ok',
        sql,
        keyword,
        info: 'W MySQL 8 nie trzeba odświeżać uprawnień po GRANT / CREATE USER — działają od razu.',
        ms: 0,
      },
    ]
  }

  let rewritten
  try {
    rewritten = rewriteStatement(sql, { db: session.db, tag: session.tag })
  } catch (e) {
    if (e instanceof RewriteError) return [{ kind: 'error', sql, keyword, errno: null, message: e.message }]
    throw e
  }

  let conn
  try {
    if (kind === 'account' && /^CREATE\s+(USER|ROLE)/i.test(stripLeadingComments(sql))) {
      const own = (await listAccounts()).filter((u) => u.name.endsWith(`~${session.tag}`)).length
      if (own >= MAX_ACCOUNTS_PER_SESSION)
        return [errorItem({ message: `Utworzono już ${own} kont — usuń niepotrzebne poleceniem DROP USER albo zresetuj bazę.` })]
    }

    // SHOW GRANTS FOR wymaga dostępu do bazy systemowej — wykonujemy je jako administrator
    // (przepisana nazwa konta zawsze ma przyrostek ucznia, więc widzi tylko swoje konta)
    conn = kind === 'show-grants' ? adminSingle : await getConnection(session)
    const [result, fields] = await conn.query({ sql: rewritten.sql, rowsAsArray: true })
    const ms = performance.now() - t0
    if (kind === 'account' && !(await enforceAccountIsolation())) {
      return [errorItem({ message: 'Niedozwolona nazwa konta — konto zostało usunięte.' })]
    }
    // Twórca roli dostaje prawo jej przydzielania (tylko do własnych ról, a nie globalne ROLE_ADMIN)
    if (kind === 'account' && /^CREATE\s+ROLE/i.test(stripLeadingComments(sql))) {
      const roleRe = new RegExp(`'([^']*~${session.tag})'(?:@'([^']*)')?`, 'g')
      for (const [, role, host] of rewritten.sql.matchAll(roleRe)) {
        await adminSingle.query("GRANT ?@? TO ?@'%' WITH ADMIN OPTION", [role, host || '%', session.user])
      }
    }

    // CALL procedury może zwrócić kilka zbiorów wyników
    if (Array.isArray(fields) && Array.isArray(fields[0])) {
      return result
        .map((r, i) => (Array.isArray(r) && fields[i] ? rowsItem(session, sql, keyword, r, fields[i], ms) : null))
        .filter(Boolean)
    }
    if (Array.isArray(result)) return [{ ...rowsItem(session, sql, keyword, result, fields ?? [], ms), notes: rewritten.notes }]

    const item = {
      kind: DML.has(keyword) ? 'change' : 'ok',
      sql,
      keyword,
      affectedRows: result.affectedRows,
      insertId: keyword === 'INSERT' && result.insertId ? result.insertId : null,
      info: session.unmap(result.info || ''),
      notes: rewritten.notes,
      ms,
    }
    if (result.warningStatus > 0 && conn !== adminSingle) {
      const [warnings] = await conn.query('SHOW WARNINGS')
      item.warnings = warnings.map((w) => ({ level: w.Level, code: w.Code, message: session.unmap(w.Message) }))
    }
    if (item.kind === 'change') {
      item.table = targetTable(sql)
      item.preview = item.table ? await preview(session, conn, item.table) : null
    }
    return [item]
  } catch (e) {
    if (e.fatal && conn !== adminSingle) closeConnection(session)
    if (kind === 'account') await enforceAccountIsolation().catch(() => {})
    return [errorItem(e)]
  }
}

/** Wykonuje skrypt polecenie po poleceniu; zatrzymuje się na pierwszym błędzie (jak klient `mysql`). */
export function executeScript(session, script) {
  return exclusive(session, async () => {
    const started = performance.now()
    const items = []
    for (const sql of splitStatements(script)) {
      const result = await runStatement(session, sql)
      items.push(...result)
      if (result.some((r) => r.kind === 'error')) break
    }
    const ms = performance.now() - started
    return { items, ms, schema: await readSchema(session) }
  })
}
