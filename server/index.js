import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { executeScript, getSession, initDatabase, openSession, resetSession } from './db.js'

const PORT = Number(process.env.PORT || 3001)
const MAX_SCRIPT_LENGTH = 100_000
const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')

const app = express()
app.use(express.json({ limit: '200kb' }))

// Opakowanie, które przekazuje błędy async do obsługi błędów Expressa
const route = (fn) => (req, res, next) => fn(req, res).catch(next)

function requireSession(req, res) {
  const session = getSession(req.body?.sessionId)
  if (!session) res.status(404).json({ error: 'Sesja wygasła — tworzę nową bazę.' })
  return session
}

app.post('/api/session', route(async (req, res) => {
  res.json(await openSession(req.body?.sessionId))
}))

app.post('/api/query', route(async (req, res) => {
  const session = requireSession(req, res)
  if (!session) return
  const sql = req.body?.sql
  if (typeof sql !== 'string' || sql.length > MAX_SCRIPT_LENGTH) {
    return res.status(400).json({ error: 'Nieprawidłowe zapytanie.' })
  }
  res.json(await executeScript(session, sql))
}))

app.post('/api/reset', route(async (req, res) => {
  const session = requireSession(req, res)
  if (!session) return
  res.json(await resetSession(session))
}))

// W trybie produkcyjnym serwer udostępnia też zbudowany frontend (npm run build)
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get('*', (req, res) => res.sendFile(path.join(distDir, 'index.html')))
}

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: `Błąd serwera: ${err.message}` })
})

try {
  const version = await initDatabase()
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  MySQL ${version} połączony.`)
    console.log(`  API SQL Playground: http://localhost:${PORT}`)
    if (fs.existsSync(distDir)) {
      const lan = Object.values(os.networkInterfaces())
        .flat()
        .filter((a) => a && a.family === 'IPv4' && !a.internal)
        .map((a) => `http://${a.address}:${PORT}`)
      if (lan.length) console.log(`  Dla uczniów w sieci lokalnej: ${lan.join(', ')}`)
    }
    console.log()
  })
} catch (e) {
  console.error(`\nNie udało się połączyć z MySQL: ${e.message}`)
  console.error('Uruchom bazę poleceniem:  npm run db:start  (wymaga działającego Docker Desktop)\n')
  process.exit(1)
}
