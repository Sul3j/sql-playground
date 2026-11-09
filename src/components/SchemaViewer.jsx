import { useState } from 'react'
import { ChevronRight, Database, Eye, KeyRound, Link2, Table2, View } from 'lucide-react'

function ColumnRow({ column }) {
  return (
    <li className="group flex items-start gap-2 py-1 pl-7 pr-2 text-[13px]">
      <span className="mt-0.5 flex w-4 shrink-0 justify-center">
        {column.pk ? (
          <KeyRound className="h-3.5 w-3.5 text-amber-500" aria-label="Klucz główny" />
        ) : column.fk ? (
          <Link2 className="h-3.5 w-3.5 text-sky-500" aria-label="Klucz obcy" />
        ) : (
          <span className="mt-1.5 h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={`truncate font-mono ${column.pk ? 'font-semibold text-zinc-900 dark:text-zinc-100' : ''}`}
          >
            {column.name}
          </span>
          <span className="shrink-0 font-mono text-[11px] text-zinc-400">
            {column.type}
            {column.autoIncrement && <span title="AUTO_INCREMENT"> · AI</span>}
            {column.unique && <span title="UNIQUE"> · UQ</span>}
            {column.notNull && !column.pk && <span title="NOT NULL"> · NN</span>}
          </span>
        </div>
        {column.fk && (
          <div className="truncate font-mono text-[11px] text-sky-600 dark:text-sky-400">
            → {column.fk.table}.{column.fk.column}
          </div>
        )}
      </div>
    </li>
  )
}

function TableItem({ table, onPreview, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  const Icon = table.type === 'view' ? View : Table2

  return (
    <li>
      <div className="group flex items-center rounded-lg pr-1 hover:bg-zinc-100 dark:hover:bg-zinc-800/70">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 pl-1 text-left text-sm"
          aria-expanded={open}
        >
          <ChevronRight
            className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-90' : ''}`}
          />
          <Icon className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="truncate font-medium">{table.name}</span>
          {table.rowCount !== null && (
            <span className="ml-auto shrink-0 rounded-full bg-zinc-100 px-1.5 text-[11px] tabular-nums text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {table.rowCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => onPreview(table.name)}
          className="ml-1 rounded-md p-1 text-zinc-400 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/40 dark:hover:text-emerald-300"
          title={`Pokaż zawartość: ${table.name}`}
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>
      {open && (
        <ul className="mb-1 border-l border-zinc-200 dark:border-zinc-800" style={{ marginLeft: '0.85rem' }}>
          {table.columns.map((c) => (
            <ColumnRow key={c.name} column={c} />
          ))}
        </ul>
      )}
    </li>
  )
}

export default function SchemaViewer({ schema, onPreview, version }) {
  return (
    <aside className="panel max-h-96 lg:max-h-none">
      <div className="panel-header">
        <Database className="h-4 w-4" />
        Struktura bazy
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {schema.length === 0 ? (
          <p className="p-3 text-sm text-zinc-500">Baza nie zawiera żadnych tabel.</p>
        ) : (
          <ul className="space-y-0.5">
            {schema.map((t, i) => (
              <TableItem key={t.name} table={t} onPreview={onPreview} defaultOpen={i < 2} />
            ))}
          </ul>
        )}
      </div>
      <div className="space-y-1 border-t border-zinc-200 px-4 py-2.5 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1">
            <KeyRound className="h-3 w-3 text-amber-500" /> klucz główny
          </span>
          <span className="inline-flex items-center gap-1">
            <Link2 className="h-3 w-3 text-sky-500" /> klucz obcy
          </span>
        </div>
        <div>AI = AUTO_INCREMENT · UQ = UNIQUE · NN = NOT NULL</div>
        {version && <div>Serwer: MySQL {version}</div>}
      </div>
    </aside>
  )
}
