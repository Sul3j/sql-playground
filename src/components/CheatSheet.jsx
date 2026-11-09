import { useMemo, useState } from 'react'
import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleX,
  GraduationCap,
  Loader2,
  PenLine,
  Play,
  Search,
} from 'lucide-react'
import { EXAMPLE_GROUPS } from '../data/examples'
import { isSelectTask, TASKS, TOPICS } from '../data/tasks'
import { usePersistentJson } from '../hooks'

function ExampleList({ onInsert, onRun }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(() => new Set([EXAMPLE_GROUPS[1].name]))
  const q = query.trim().toLowerCase()
  const groups = EXAMPLE_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((it) => !q || it.title.toLowerCase().includes(q) || it.sql.toLowerCase().includes(q)),
  })).filter((g) => g.items.length > 0)

  const toggle = (name) =>
    setOpen((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })

  return (
    <>
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj (np. JOIN, GRANT, DATEDIFF)…"
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-8 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800"
        />
      </div>
      {groups.map((group) => {
        const expanded = q !== '' || open.has(group.name)
        return (
          <div key={group.name} className="mb-1">
            <button
              type="button"
              onClick={() => toggle(group.name)}
              className="flex w-full items-center gap-1.5 rounded-lg px-1 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/70"
              aria-expanded={expanded}
            >
              <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
              <span className="flex-1">{group.name}</span>
              <span className="font-normal normal-case tracking-normal text-zinc-400">{group.items.length}</span>
            </button>
            {expanded && (
              <ul className="mb-2 space-y-0.5 pl-3">
                {group.items.map((it) => (
                  <li key={it.title} className="group flex items-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/70">
                    <button
                      type="button"
                      onClick={() => onInsert(it.sql)}
                      className="min-w-0 flex-1 px-2 py-1.5 text-left text-sm"
                      title={it.sql}
                    >
                      {it.title}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRun(it.sql)}
                      className="mr-1 rounded-md p-1 text-zinc-400 opacity-0 hover:bg-emerald-100 hover:text-emerald-700 focus:opacity-100 group-hover:opacity-100 dark:hover:bg-emerald-900/40 dark:hover:text-emerald-300"
                      title="Wstaw i wykonaj"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
      {groups.length === 0 && <p className="px-1 text-sm text-zinc-500">Brak pasujących przykładów.</p>}
    </>
  )
}

const LEVELS = {
  1: { label: 'łatwe', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
  2: { label: 'średnie', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
  3: { label: 'trudne', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300' },
}

function TaskCard({ task, number, solved, feedback, onStart, onCheck, onMarkDone, onInsert }) {
  const [revealed, setRevealed] = useState(false)
  const checkable = isSelectTask(task) || Boolean(task.verify)

  return (
    <li
      className={`rounded-lg border p-3 ${
        solved ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20' : 'border-zinc-200 dark:border-zinc-800'
      }`}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Zadanie {number}</span>
        <span className={`rounded px-1.5 text-[10px] font-semibold ${LEVELS[task.level].cls}`}>{LEVELS[task.level].label}</span>
        {solved && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> rozwiązane
          </span>
        )}
      </div>
      <p className="text-sm">{task.task}</p>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <button type="button" onClick={() => onStart(task, number)} className="btn-ghost border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700">
          <PenLine className="h-3.5 w-3.5" /> Rozwiąż
        </button>
        {checkable ? (
          <button
            type="button"
            onClick={() => onCheck(task)}
            disabled={feedback?.pending}
            className="btn bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-500"
          >
            {feedback?.pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Sprawdź
          </button>
        ) : (
          !solved && (
            <button type="button" onClick={() => onMarkDone(task)} className="btn-ghost border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700">
              <Check className="h-3.5 w-3.5" /> Oznacz jako zrobione
            </button>
          )
        )}
      </div>
      {!isSelectTask(task) && task.verify && !feedback && (
        <p className="mt-1.5 text-[11px] text-zinc-500">Najpierw wykonaj swoje polecenie (Ctrl+Enter), potem kliknij „Sprawdź”.</p>
      )}

      {feedback && !feedback.pending && (
        <p
          className={`mt-2 flex gap-1.5 rounded-md px-2 py-1.5 text-xs ${
            feedback.ok
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
          }`}
        >
          {feedback.ok ? <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0" /> : <CircleX className="mt-px h-3.5 w-3.5 shrink-0" />}
          {feedback.message}
        </p>
      )}

      {revealed ? (
        <div className="mt-2">
          <pre className="overflow-x-auto rounded-md bg-zinc-100 p-2 font-mono text-[11px] dark:bg-zinc-800">{task.solution}</pre>
          <button
            type="button"
            onClick={() => onInsert(task.solution)}
            className="mt-1.5 text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
          >
            Wstaw rozwiązanie do edytora
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400"
        >
          <ChevronRight className="h-3 w-3" />
          Pokaż rozwiązanie
        </button>
      )}
    </li>
  )
}

function TaskList({ onInsert, onCheck }) {
  const [topic, setTopic] = useState(TOPICS[0].id)
  const [solved, setSolved] = usePersistentJson('sqlpg:solved', {})
  const [feedback, setFeedback] = useState({})

  const numbered = useMemo(() => {
    const counters = {}
    return TASKS.map((task) => ({ task, number: (counters[task.topic] = (counters[task.topic] ?? 0) + 1) }))
  }, [])
  const visible = numbered.filter(({ task }) => task.topic === topic)
  const solvedCount = TASKS.filter((t) => solved[t.id]).length

  const check = async (task) => {
    setFeedback((f) => ({ ...f, [task.id]: { pending: true } }))
    const result = await onCheck(task)
    setFeedback((f) => ({ ...f, [task.id]: result }))
    if (result.ok) setSolved((s) => ({ ...s, [task.id]: true }))
  }

  const start = (task, number) => {
    const label = TOPICS.find((t) => t.id === task.topic).label
    onInsert(`-- ${label} — zadanie ${number}\n-- ${task.task}\n\n`)
  }

  return (
    <>
      <div className="mb-3">
        <div className="mb-1 flex justify-between text-xs text-zinc-500">
          <span>Postęp</span>
          <span className="tabular-nums">
            {solvedCount} / {TASKS.length}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(solvedCount / TASKS.length) * 100}%` }} />
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1">
        {TOPICS.map((tp) => {
          const all = TASKS.filter((t) => t.topic === tp.id)
          const done = all.filter((t) => solved[t.id]).length
          return (
            <button
              key={tp.id}
              type="button"
              onClick={() => setTopic(tp.id)}
              className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                topic === tp.id
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              {tp.label}{' '}
              <span className="tabular-nums text-zinc-400">
                {done}/{all.length}
              </span>
            </button>
          )
        })}
      </div>

      <ol className="space-y-3">
        {visible.map(({ task, number }) => (
          <TaskCard
            key={task.id}
            task={task}
            number={number}
            solved={Boolean(solved[task.id])}
            feedback={feedback[task.id]}
            onStart={start}
            onCheck={check}
            onMarkDone={(t) => setSolved((s) => ({ ...s, [t.id]: true }))}
            onInsert={onInsert}
          />
        ))}
      </ol>

      {solvedCount > 0 && (
        <button
          type="button"
          onClick={() => {
            setSolved({})
            setFeedback({})
          }}
          className="mt-4 text-xs text-zinc-400 hover:text-red-500"
        >
          Wyzeruj postęp
        </button>
      )}
    </>
  )
}

export default function CheatSheet({ onInsert, onRun, onCheck }) {
  const [tab, setTab] = useState('examples')
  const tabs = [
    { id: 'examples', label: 'Przykłady', icon: BookOpen },
    { id: 'tasks', label: 'Zadania', icon: GraduationCap },
  ]

  return (
    <aside className="panel max-h-[40rem] lg:max-h-none">
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              tab === id
                ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {/* Oba panele zostają zamontowane, żeby nie tracić stanu (wyszukiwanie, wyniki sprawdzania) */}
        <div hidden={tab !== 'examples'}>
          <ExampleList onInsert={onInsert} onRun={onRun} />
        </div>
        <div hidden={tab !== 'tasks'}>
          <TaskList onInsert={onInsert} onCheck={onCheck} />
        </div>
      </div>
    </aside>
  )
}
