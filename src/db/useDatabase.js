import { useCallback, useEffect, useRef, useState } from 'react'

const SESSION_KEY = 'sqlpg:session'

function readSessionId() {
  try {
    return localStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

function saveSessionId(id) {
  try {
    localStorage.setItem(SESSION_KEY, id)
  } catch {
    // brak localStorage — po odświeżeniu uczeń dostanie nową bazę
  }
}

async function api(path, body) {
  let res
  try {
    res = await fetch(`/api/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('Brak połączenia z serwerem SQL Playground.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const error = new Error(data.error || `Serwer zwrócił błąd HTTP ${res.status}.`)
    error.status = res.status
    throw error
  }
  return data
}

/** Identyfikator tabeli w czytelnej postaci: bez backticków, jeśli nie są potrzebne. */
const displayIdent = (name) => (/^[A-Za-z_]\w*$/.test(name) ? name : `\`${name.replace(/`/g, '``')}\``)

export function useDatabase() {
  const sessionRef = useRef(readSessionId())
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [loadError, setLoadError] = useState(null)
  const [schema, setSchema] = useState([])
  const [version, setVersion] = useState('')
  const [busy, setBusy] = useState(false)

  const openSession = useCallback(async () => {
    const data = await api('session', { sessionId: sessionRef.current })
    sessionRef.current = data.sessionId
    saveSessionId(data.sessionId)
    setSchema(data.schema)
    setVersion(data.version)
  }, [])

  useEffect(() => {
    openSession()
      .then(() => setStatus('ready'))
      .catch((e) => {
        setLoadError(e.message)
        setStatus('error')
      })
  }, [openSession])

  // Gdy sesja wygasła (np. po restarcie serwera), zakładamy nową i ponawiamy żądanie
  const call = useCallback(
    async (path, body) => {
      try {
        return await api(path, { ...body, sessionId: sessionRef.current })
      } catch (e) {
        if (e.status !== 404) throw e
        await openSession()
        return api(path, { ...body, sessionId: sessionRef.current })
      }
    },
    [openSession],
  )

  const execute = useCallback(
    async (sql) => {
      setBusy(true)
      const started = performance.now()
      try {
        const data = await call('query', { sql })
        setSchema(data.schema)
        return { sql, items: data.items, ms: data.ms }
      } catch (e) {
        return { sql, items: [{ kind: 'error', sql: '', message: e.message, network: true }], ms: performance.now() - started }
      } finally {
        setBusy(false)
      }
    },
    [call],
  )

  // Zapytanie „w tle” (np. sprawdzanie zadania) — nie zmienia panelu wyników
  const querySilently = useCallback(
    async (sql) => {
      try {
        const data = await call('query', { sql })
        return data.items
      } catch (e) {
        return [{ kind: 'error', sql: '', message: e.message, network: true }]
      }
    },
    [call],
  )

  const previewTable = useCallback(
    async (name) => ({ ...(await execute(`SELECT * FROM ${displayIdent(name)};`)), preview: name }),
    [execute],
  )

  const reset = useCallback(async () => {
    setBusy(true)
    try {
      const data = await call('reset', {})
      setSchema(data.schema)
    } finally {
      setBusy(false)
    }
  }, [call])

  return { status, loadError, schema, version, busy, execute, querySilently, previewTable, reset }
}
