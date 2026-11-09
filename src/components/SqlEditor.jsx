import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { sql, MySQL } from '@codemirror/lang-sql'
import { EditorView, keymap } from '@codemirror/view'
import { Prec } from '@codemirror/state'
import { Eraser, Loader2, Play } from 'lucide-react'

const SqlEditor = forwardRef(function SqlEditor(
  { value, onChange, onRun, schema, theme, disabled },
  ref,
) {
  const viewRef = useRef(null)
  const onRunRef = useRef(onRun)
  onRunRef.current = onRun
  const [hasSelection, setHasSelection] = useState(false)

  // Wykonuje zaznaczony fragment albo całą zawartość edytora
  const runCurrent = useCallback(() => {
    const view = viewRef.current
    if (!view) return true
    const sel = view.state.selection.main
    const text = sel.empty ? view.state.doc.toString() : view.state.sliceDoc(sel.from, sel.to)
    onRunRef.current(text)
    return true
  }, [])

  useImperativeHandle(ref, () => ({ focus: () => viewRef.current?.focus() }), [])

  // Autouzupełnianie nazw tabel i kolumn na podstawie aktualnej struktury bazy
  const completionSchema = useMemo(
    () => Object.fromEntries(schema.map((t) => [t.name, t.columns.map((c) => c.name)])),
    [schema],
  )

  const extensions = useMemo(
    () => [
      sql({ dialect: MySQL, schema: completionSchema, upperCaseKeywords: true }),
      Prec.highest(keymap.of([{ key: 'Mod-Enter', run: runCurrent }])),
      EditorView.lineWrapping,
    ],
    [completionSchema, runCurrent],
  )

  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform)

  return (
    <section className="panel h-72 lg:h-auto lg:flex-[0_0_42%]">
      <div className="panel-header justify-between normal-case tracking-normal">
        <span className="text-xs font-semibold uppercase tracking-wider">Edytor SQL</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              onChange('')
              viewRef.current?.focus()
            }}
            title="Wyczyść edytor"
          >
            <Eraser className="h-4 w-4" />
            <span className="hidden sm:inline">Wyczyść</span>
          </button>
          <button type="button" className="btn-primary" onClick={runCurrent} disabled={disabled}>
            {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {hasSelection ? 'Wykonaj zaznaczenie' : 'Wykonaj zapytanie'}
            <kbd className="ml-1 hidden rounded bg-emerald-700/60 px-1.5 py-0.5 font-mono text-[10px] sm:inline">
              {isMac ? '⌘' : 'Ctrl'}+Enter
            </kbd>
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <CodeMirror
          value={value}
          onChange={onChange}
          extensions={extensions}
          theme={theme === 'dark' ? 'dark' : 'light'}
          height="100%"
          autoFocus
          placeholder="Wpisz zapytanie SQL, np. SELECT * FROM klienci;"
          onCreateEditor={(view) => {
            viewRef.current = view
          }}
          onUpdate={(update) => {
            if (update.selectionSet) setHasSelection(!update.state.selection.main.empty)
          }}
          basicSetup={{ highlightActiveLine: true, foldGutter: false }}
        />
      </div>
    </section>
  )
})

export default SqlEditor
