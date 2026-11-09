import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import Header from './components/Header'
import SqlEditor from './components/SqlEditor'
import SchemaViewer from './components/SchemaViewer'
import ResultsPanel from './components/ResultsPanel'
import CheatSheet from './components/CheatSheet'
import { useDatabase } from './db/useDatabase'
import { DEFAULT_QUERY } from './data/examples'
import { isSelectTask } from './data/tasks'
import { compareResults, evaluateVerify } from './data/checkTask'
import { usePersistentState, useTheme } from './hooks'

export default function App() {
  const { status, loadError, schema, version, busy, execute, querySilently, previewTable, reset } = useDatabase()
  const [theme, toggleTheme] = useTheme()
  const [code, setCode] = usePersistentState('sqlpg:code', DEFAULT_QUERY)
  const [result, setResult] = useState(null)
  const [notice, setNotice] = useState(null)
  const editorRef = useRef(null)

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 2500)
    return () => clearTimeout(t)
  }, [notice])

  const run = useCallback(
    async (sqlText) => {
      if (status !== 'ready' || busy) return
      setResult(await execute(sqlText))
    },
    [status, busy, execute],
  )

  const insert = useCallback(
    (sqlText) => {
      setCode(sqlText)
      editorRef.current?.focus()
    },
    [setCode],
  )

  const insertAndRun = useCallback(
    (sqlText) => {
      setCode(sqlText)
      run(sqlText)
    },
    [setCode, run],
  )

  // SELECT: wykonujemy zapytanie z edytora i porównujemy z rozwiązaniem wzorcowym.
  // Pozostałe zadania: sprawdzamy stan bazy po poleceniu, które uczeń już wykonał.
  const checkTask = useCallback(
    async (task) => {
      if (isSelectTask(task)) {
        const mine = await execute(code)
        setResult(mine)
        const expected = await querySilently(task.solution)
        return compareResults(task.solution, expected, mine.items)
      }
      return evaluateVerify(task.verify, await querySilently(task.verify.sql))
    },
    [code, execute, querySilently],
  )

  const handleReset = useCallback(async () => {
    try {
      await reset()
      setResult(null)
      setNotice('Baza przywrócona do stanu początkowego')
    } catch (e) {
      setNotice(`Nie udało się zresetować bazy: ${e.message}`)
    }
  }, [reset])

  return (
    <div className="flex h-full flex-col">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onReset={handleReset}
        status={status}
        busy={busy}
        notice={notice}
      />

      {status === 'error' ? (
        <div className="m-6 flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div className="space-y-2">
            <p className="font-semibold">Nie udało się połączyć z serwerem MySQL.</p>
            <p className="font-mono text-sm">{loadError}</p>
            <p className="text-sm">
              Uruchom Docker Desktop, a potem w folderze projektu wykonaj <code>npm run db:start</code> i{' '}
              <code>npm run dev</code>. Następnie odśwież stronę.
            </p>
          </div>
        </div>
      ) : status === 'loading' ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-zinc-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Łączenie z serwerem MySQL i przygotowywanie bazy…
        </div>
      ) : (
        <main className="grid flex-1 gap-3 p-3 lg:min-h-0 lg:grid-cols-[250px_minmax(0,1fr)_320px] xl:grid-cols-[270px_minmax(0,1fr)_380px]">
          <SchemaViewer
            schema={schema}
            version={version}
            onPreview={async (name) => setResult(await previewTable(name))}
          />
          <div className="flex min-w-0 flex-col gap-3 lg:min-h-0">
            <SqlEditor
              ref={editorRef}
              value={code}
              onChange={setCode}
              onRun={run}
              schema={schema}
              theme={theme}
              disabled={busy}
            />
            <ResultsPanel result={result} />
          </div>
          <CheatSheet onInsert={insert} onRun={insertAndRun} onCheck={checkTask} />
        </main>
      )}
    </div>
  )
}
