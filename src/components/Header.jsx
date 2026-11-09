import { useEffect, useState } from 'react'
import { Database, Moon, RotateCcw, Sun } from 'lucide-react'

function ResetButton({ onReset, disabled }) {
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!confirming) return
    const t = setTimeout(() => setConfirming(false), 3000)
    return () => clearTimeout(t)
  }, [confirming])

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (confirming) {
          setConfirming(false)
          onReset()
        } else {
          setConfirming(true)
        }
      }}
      className={`btn border ${
        confirming
          ? 'border-red-500 bg-red-600 text-white hover:bg-red-500'
          : 'border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800'
      }`}
      title="Przywróć bazę do stanu początkowego"
    >
      <RotateCcw className="h-4 w-4" />
      {confirming ? 'Na pewno? Kliknij ponownie' : 'Resetuj bazę danych'}
    </button>
  )
}

export default function Header({ theme, onToggleTheme, onReset, status, busy, notice }) {
  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2.5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-600 text-white shadow-sm">
          <Database className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <h1 className="font-semibold">SQL Playground</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Ucz się MySQL na prawdziwym serwerze — każdy ma własną bazę</p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {notice && (
          <span className="hidden rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 sm:inline dark:bg-emerald-900/50 dark:text-emerald-300">
            {notice}
          </span>
        )}
        <span
          className={`hidden items-center gap-1.5 text-xs md:inline-flex ${
            status === 'ready' ? 'text-emerald-600 dark:text-emerald-400' : status === 'error' ? 'text-red-500' : 'text-zinc-500'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              status === 'ready' ? 'bg-emerald-500' : status === 'error' ? 'bg-red-500' : 'animate-pulse bg-zinc-400'
            }`}
          />
          {status === 'ready' ? 'Połączono z MySQL' : status === 'error' ? 'Brak połączenia' : 'Łączenie…'}
        </span>
        <ResetButton onReset={onReset} disabled={status !== 'ready' || busy} />
        <button
          type="button"
          onClick={onToggleTheme}
          className="btn-ghost border border-zinc-200 px-2 dark:border-zinc-700"
          title={theme === 'dark' ? 'Włącz jasny motyw' : 'Włącz ciemny motyw'}
          aria-label="Przełącz motyw"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  )
}
