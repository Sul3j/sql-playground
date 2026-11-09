// Przepisywanie poleceń ucznia tak, by działały w jego prywatnej piaskownicy:
//  - nazwa bazy "sklep" → prywatna baza ucznia (np. sklep.klienci, USE sklep, GRANT … ON sklep.*),
//  - konta tworzone przez ucznia ('anna'@'localhost') → konta z prywatnym przyrostkiem ('anna~1a2b3c4d'@'localhost'),
//    dzięki czemu kilku uczniów może mieć konto o tej samej nazwie i nie mogą sobie nawzajem szkodzić.
// Wyniki są tłumaczone z powrotem (unmap), więc uczeń widzi wszędzie "sklep" i "anna".
import { stripLeadingComments } from './sqlSplit.js'

export const PUBLIC_DB = 'sklep'
const MAX_ACCOUNT_NAME = 32

const ACCOUNT_STATEMENT =
  /^(CREATE\s+(USER|ROLE)|DROP\s+(USER|ROLE)|ALTER\s+USER|RENAME\s+USER|GRANT|REVOKE|SHOW\s+GRANTS|SET\s+(PASSWORD|DEFAULT\s+ROLE|ROLE))\b/i

export function classify(sql) {
  const s = stripLeadingComments(sql)
  if (/^FLUSH\s+PRIVILEGES\s*$/i.test(s)) return 'flush'
  if (/^SHOW\s+GRANTS\s+FOR\b/i.test(s)) return 'show-grants'
  if (ACCOUNT_STATEMENT.test(s)) return 'account'
  return 'query'
}

function tokenize(sql) {
  const tokens = []
  let i = 0
  while (i < sql.length) {
    const ch = sql[i]
    const start = i
    let type
    if (/\s/.test(ch)) {
      while (i < sql.length && /\s/.test(sql[i])) i++
      type = 'ws'
    } else if (ch === "'" || ch === '"' || ch === '`') {
      i++
      while (i < sql.length) {
        if (sql[i] === '\\' && ch !== '`') i += 2
        else if (sql[i] === ch && sql[i + 1] === ch) i += 2
        else if (sql[i] === ch) {
          i++
          break
        } else i++
      }
      type = ch === '`' ? 'quoted' : 'string'
    } else if (ch === '#' || (ch === '-' && sql[i + 1] === '-')) {
      while (i < sql.length && sql[i] !== '\n') i++
      type = 'comment'
    } else if (ch === '/' && sql[i + 1] === '*') {
      const close = sql.indexOf('*/', i + 2)
      i = close === -1 ? sql.length : close + 2
      type = 'comment'
    } else if (/[\w$]/.test(ch)) {
      while (i < sql.length && /[\w$]/.test(sql[i])) i++
      type = 'word'
    } else {
      i++
      type = 'punct'
    }
    tokens.push({ type, text: sql.slice(start, i) })
  }
  return tokens
}

const unquote = (t) =>
  t.type === 'word' ? t.text : t.text.slice(1, -1).split(t.text[0] + t.text[0]).join(t.text[0])
const isName = (t) => t && (t.type === 'word' || t.type === 'string' || t.type === 'quoted')
const upper = (t) => (t?.type === 'word' ? t.text.toUpperCase() : null)
const quoteIdent = (name) => `\`${name.replace(/`/g, '``')}\``

class RewriteError extends Error {}

/**
 * @returns {{ sql: string, notes: string[] }} przepisane polecenie (lub rzuca RewriteError z komunikatem dla ucznia)
 */
export function rewriteStatement(sql, { db, tag }) {
  const kind = classify(sql)
  const tokens = tokenize(sql)
  const sig = tokens.map((t, i) => i).filter((i) => tokens[i].type !== 'ws' && tokens[i].type !== 'comment')
  const notes = []
  const at = (k) => tokens[sig[k]]

  // 1. Nazwa bazy "sklep" → prywatna baza ucznia
  const isPublicDb = (t) => isName(t) && t.type !== 'string' && unquote(t).toLowerCase() === PUBLIC_DB
  const firstWord = upper(at(0))
  for (let k = 0; k < sig.length; k++) {
    const t = at(k)
    if (!isPublicDb(t)) continue
    const next = at(k + 1)
    const prev = upper(at(k - 1))
    const qualified = next?.type === 'punct' && next.text === '.'
    const usedAsDb = (firstWord === 'USE' && k === 1) || (firstWord === 'SHOW' && (prev === 'FROM' || prev === 'IN'))
    if (qualified || usedAsDb) tokens[sig[k]] = { type: 'quoted', text: quoteIdent(db) }
  }

  if (kind !== 'account' && kind !== 'show-grants') return { sql: tokens.map((t) => t.text).join(''), notes }

  // 2. Polecenia dotyczące kont — najpierw zabezpieczenia
  const reject = (msg) => {
    throw new RewriteError(msg)
  }
  if (tokens.some((t) => t.type === 'comment')) reject('Usuń komentarze z polecenia dotyczącego użytkowników i uprawnień.')
  if (sql.includes('\\')) reject('Polecenia dotyczące użytkowników nie mogą zawierać znaku \\.')
  if (/pg_|~/i.test(sql)) reject('Niedozwolona nazwa konta lub bazy w tym poleceniu.')
  if (/\b(CURRENT_USER|SESSION_USER)\b|\bUSER\s*\(/i.test(sql))
    reject('W tym środowisku nie można zmieniać własnego konta ucznia — utwórz nowego użytkownika poleceniem CREATE USER.')
  if (/^SET\s+PASSWORD\s*(=|TO\b)/i.test(stripLeadingComments(sql)))
    reject('Podaj, czyje hasło zmieniasz: SET PASSWORD FOR \'nazwa\'@\'localhost\' = \'hasło\';')
  for (let k = 0; k + 1 < sig.length; k++) {
    if (at(k).type === 'string' && at(k + 1).type === 'string') reject('Nieprawidłowa nazwa konta.')
  }

  // GRANT/REVOKE … ON *.* → ograniczamy do bazy ucznia
  if (firstWord === 'GRANT' || firstWord === 'REVOKE') {
    for (let k = 0; k + 2 < sig.length; k++) {
      if (upper(at(k)) === 'ON' && at(k + 1).text === '*' && at(k + 2).text === '.' && at(k + 3)?.text === '*') {
        tokens[sig[k + 1]] = { type: 'quoted', text: quoteIdent(db) }
        notes.push(
          `Uprawnienia „*.*” (wszystkie bazy) zostały w tym środowisku ograniczone do bazy ${PUBLIC_DB}. Na prawdziwym serwerze dotyczyłyby wszystkich baz.`,
        )
      }
    }
  }

  // 3. Przepisanie nazw kont i ról
  const isGrant = firstWord === 'GRANT' || firstWord === 'REVOKE'
  const isRoleGrant = isGrant && !sig.some((i) => upper(tokens[i]) === 'ON')
  // W GRANT/REVOKE konta pojawiają się tylko po TO/FROM (np. "GRANT CREATE USER ON …" to nazwa uprawnienia)
  const accountKeywords = isGrant ? ['TO', 'FROM'] : ['USER', 'ROLE', 'TO', 'FOR', 'USING']
  let expect = isRoleGrant
  let inAccounts = isRoleGrant
  const renamed = new Set()

  for (let k = isGrant ? 1 : 0; k < sig.length; k++) {
    const t = at(k)
    const word = upper(t)
    if (expect) {
      if (word === 'IF' || word === 'NOT' || word === 'EXISTS') continue
      if (isName(t) && !['TO', 'FROM', 'ALL', 'NONE', 'DEFAULT'].includes(word)) {
        const name = unquote(t)
        const mapped = `${name}~${tag}`
        if (mapped.length > MAX_ACCOUNT_NAME)
          reject(`Nazwa użytkownika „${name}” jest za długa — w tym środowisku może mieć maksymalnie ${MAX_ACCOUNT_NAME - tag.length - 1} znaków.`)
        tokens[sig[k]] = { type: 'string', text: `'${mapped.replace(/'/g, "''")}'` }
        renamed.add(sig[k])
        // pomijamy opcjonalny @host
        if (at(k + 1)?.text === '@' && isName(at(k + 2))) k += 2
        expect = false
        continue
      }
      expect = false
    }
    if (inAccounts && t.text === ',') {
      expect = true
      continue
    }
    if (accountKeywords.includes(word)) {
      expect = true
      inAccounts = true
    }
  }

  // Każda nazwa w postaci nazwa@host musi zostać przepisana — inaczej odrzucamy polecenie
  for (let k = 0; k + 1 < sig.length; k++) {
    if (isName(at(k)) && at(k + 1).text === '@' && !renamed.has(sig[k]))
      reject('Nie udało się rozpoznać nazwy konta w tym poleceniu. Użyj formy: \'nazwa\'@\'localhost\'.')
  }

  return { sql: tokens.map((t) => t.text).join(''), notes }
}

export { RewriteError }

/** Tłumaczy wewnętrzne nazwy z powrotem na te, które zna uczeń. */
export function makeUnmapper({ db, user, tag }) {
  const patterns = [
    [new RegExp(db, 'gi'), PUBLIC_DB],
    [new RegExp(user, 'gi'), 'uczen'],
    [new RegExp(`~${tag}`, 'g'), ''],
  ]
  return (value) => {
    if (typeof value !== 'string') return value
    let out = value
    for (const [re, replacement] of patterns) out = out.replace(re, replacement)
    return out
  }
}
