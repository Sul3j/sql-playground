import { AlertTriangle, CheckCircle2, Info, Lightbulb, PencilLine, Rows3, SquareTerminal, TriangleAlert } from 'lucide-react'
import DataTable from './DataTable'
import { errorHint, formatError } from '../db/errorHints'
import { formatMs, plural } from '../hooks'

const rowsLabel = (n) => `${n} ${plural(n, 'wiersz', 'wiersze', 'wierszy')}`

function SqlSnippet({ sql }) {
  return (
    <pre className="max-h-24 overflow-auto whitespace-pre-wrap break-words rounded-md bg-zinc-100 px-3 py-2 font-mono text-xs text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-300">
      {sql}
    </pre>
  )
}

function Badge({ children, tone = 'emerald' }) {
  const tones = {
    emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
    sky: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300',
    zinc: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  }
  return (
    <span className={`rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  )
}

function Warnings({ warnings }) {
  if (!warnings?.length) return null
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm dark:border-amber-900/60 dark:bg-amber-950/30">
      <div className="mb-1 flex items-center gap-2 font-medium text-amber-800 dark:text-amber-300">
        <TriangleAlert className="h-4 w-4" />
        Ostrzeżenia MySQL ({warnings.length})
      </div>
      <ul className="space-y-0.5 font-mono text-xs text-amber-900 dark:text-amber-200">
        {warnings.map((w, i) => (
          <li key={i}>
            {w.level} {w.code}: {w.message}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Notes({ notes }) {
  if (!notes?.length) return null
  return notes.map((note, i) => (
    <p
      key={i}
      className="flex gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      {note}
    </p>
  ))
}

function ResultItem({ item, showSql }) {
  if (item.kind === 'error') {
    const hint = errorHint(item.errno)
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/30">
        <div className="flex items-center gap-2 font-semibold text-red-700 dark:text-red-300">
          <AlertTriangle className="h-5 w-5" />
          {item.network ? 'Brak połączenia' : 'Błąd wykonania zapytania'}
        </div>
        <p className="mt-2 break-words font-mono text-sm text-red-800 dark:text-red-200">{formatError(item)}</p>
        {item.network && (
          <p className="mt-2 text-sm text-red-900/80 dark:text-red-200/80">
            Sprawdź, czy działa serwer aplikacji (<code>npm run dev</code>) i baza MySQL (<code>npm run db:start</code>).
          </p>
        )}
        {hint && (
          <p className="mt-3 flex gap-2 text-sm text-red-900/80 dark:text-red-200/80">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            {hint}
          </p>
        )}
        {item.sql && (
          <div className="mt-3">
            <div className="mb-1 text-xs font-medium text-red-700/80 dark:text-red-300/80">W poleceniu:</div>
            <SqlSnippet sql={item.sql} />
          </div>
        )}
      </div>
    )
  }

  if (item.kind === 'rows') {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Rows3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <Badge>{item.keyword || 'SQL'}</Badge>
          <span className="font-medium">{rowsLabel(item.total)}</span>
          <span className="text-zinc-400">· {formatMs(item.ms)}</span>
        </div>
        {showSql && <SqlSnippet sql={item.sql} />}
        <Notes notes={item.notes} />
        <DataTable columns={item.columns} numeric={item.numeric} rows={item.rows} total={item.total} />
      </div>
    )
  }

  if (item.kind === 'change') {
    const verb = { INSERT: 'Dodano', REPLACE: 'Zapisano', UPDATE: 'Zmieniono', DELETE: 'Usunięto' }[item.keyword]
    return (
      <div className="space-y-2">
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm dark:border-sky-900/60 dark:bg-sky-950/30">
          <div className="flex flex-wrap items-center gap-2">
            <PencilLine className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <Badge tone="sky">{item.keyword}</Badge>
            <span>
              {verb} <strong>{rowsLabel(item.affectedRows)}</strong>
              {item.table && (
                <>
                  {' '}w tabeli <strong className="font-mono">{item.table}</strong>
                </>
              )}
              .
            </span>
            {item.insertId && (
              <span>
                Nowe id: <strong className="font-mono">{item.insertId}</strong>
              </span>
            )}
            <span className="text-zinc-400">· {formatMs(item.ms)}</span>
          </div>
          <div className="mt-1 pl-6 font-mono text-xs text-zinc-500 dark:text-zinc-400">
            Query OK, {item.affectedRows} {item.affectedRows === 1 ? 'row' : 'rows'} affected
            {item.info && ` · ${item.info.trim()}`}
          </div>
        </div>
        <Warnings warnings={item.warnings} />
        {showSql && <SqlSnippet sql={item.sql} />}
        {item.preview && (
          <>
            <div className="pt-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Aktualna zawartość tabeli {item.table}
            </div>
            <DataTable columns={item.preview.columns} numeric={item.preview.numeric} rows={item.preview.rows} />
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm dark:border-emerald-900/60 dark:bg-emerald-950/30">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <Badge tone="zinc">{item.keyword || 'SQL'}</Badge>
        <span>Polecenie wykonane pomyślnie.</span>
        {item.info && <span className="text-xs text-zinc-500">{item.info.trim()}</span>}
        <span className="text-zinc-400">· {formatMs(item.ms)}</span>
      </div>
      <Notes notes={item.notes} />
      <Warnings warnings={item.warnings} />
      {showSql && <SqlSnippet sql={item.sql} />}
    </div>
  )
}

export default function ResultsPanel({ result }) {
  const items = result?.items ?? []
  const multiple = items.length > 1
  const hasError = items.some((i) => i.kind === 'error')

  return (
    <section className="panel min-h-[20rem] flex-1">
      <div className="panel-header">
        <SquareTerminal className="h-4 w-4" />
        {result?.preview ? `Podgląd tabeli: ${result.preview}` : 'Wyniki'}
        {result && items.length > 0 && (
          <span className="ml-auto font-normal normal-case tracking-normal text-zinc-400">
            {items.length} {plural(items.length, 'polecenie', 'polecenia', 'poleceń')} ·{' '}
            {formatMs(result.ms)}
            {hasError && <span className="ml-2 text-red-500">· przerwano na błędzie</span>}
          </span>
        )}
      </div>
      <div className="min-h-0 flex-1 space-y-6 overflow-auto p-4">
        {!result ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center text-sm text-zinc-500">
            <SquareTerminal className="h-10 w-10 text-zinc-300 dark:text-zinc-700" />
            <p>Tutaj pojawią się wyniki zapytania.</p>
            <p className="text-xs text-zinc-400">
              Napisz zapytanie i naciśnij <kbd className="rounded border px-1 font-mono dark:border-zinc-700">Ctrl</kbd>+
              <kbd className="rounded border px-1 font-mono dark:border-zinc-700">Enter</kbd> albo kliknij przykład z
              prawego panelu.
            </p>
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-zinc-500">Brak poleceń do wykonania — edytor zawiera tylko komentarze lub jest pusty.</p>
        ) : (
          items.map((item, i) => <ResultItem key={i} item={item} showSql={multiple} />)
        )}
      </div>
    </section>
  )
}
