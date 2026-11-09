import { useCallback, useEffect, useState } from 'react'

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ?? fallback
  } catch {
    return fallback
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // np. tryb prywatny — trudno, działamy bez zapisu
  }
}

export function usePersistentState(key, fallback) {
  const [value, setValue] = useState(() => readStorage(key, fallback))
  useEffect(() => writeStorage(key, value), [key, value])
  return [value, setValue]
}

export function usePersistentJson(key, fallback) {
  const [value, setValue] = useState(() => {
    try {
      return JSON.parse(readStorage(key, '')) ?? fallback
    } catch {
      return fallback
    }
  })
  useEffect(() => writeStorage(key, JSON.stringify(value)), [key, value])
  return [value, setValue]
}

export function useTheme() {
  const [theme, setTheme] = useState(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    writeStorage('sqlpg:theme', theme)
  }, [theme])

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])
  return [theme, toggle]
}

/** Polska odmiana liczebników: 1 wiersz, 2 wiersze, 5 wierszy. */
export function plural(n, one, few, many) {
  if (n === 1) return one
  const d = n % 10
  const h = n % 100
  if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return few
  return many
}

export const formatMs = (ms) => (ms < 1 ? '<1 ms' : `${ms.toFixed(1)} ms`)
