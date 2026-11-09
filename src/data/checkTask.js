// Sprawdzanie rozwiązań zadań (zobacz opis w tasks.js).

const lastRows = (items) => [...items].reverse().find((i) => i.kind === 'rows')

// Liczby porównujemy jako liczby (1699 = 1699.00), resztę jako tekst
function normalize(value) {
  if (value === null || value === undefined) return null
  const s = String(value).trim()
  if (s !== '' && !Number.isNaN(Number(s))) return Math.round(Number(s) * 1e6) / 1e6
  return s
}
const rowKey = (row) => JSON.stringify(row.map(normalize))

/** Porównuje wynik zapytania ucznia z wynikiem rozwiązania wzorcowego. */
export function compareResults(solution, expectedItems, actualItems) {
  const expected = lastRows(expectedItems)
  const actual = lastRows(actualItems)
  const actualError = actualItems.find((i) => i.kind === 'error')

  if (!expected) return { ok: false, message: 'Nie udało się wykonać rozwiązania wzorcowego — zresetuj bazę i spróbuj ponownie.' }
  if (actualError) return { ok: false, message: 'Twoje zapytanie zakończyło się błędem — popraw je i sprawdź ponownie.' }
  if (!actual) return { ok: false, message: 'Twoje zapytanie nie zwróciło żadnej tabeli wyników. Użyj SELECT.' }

  if (actual.columns.length !== expected.columns.length) {
    return {
      ok: false,
      message: `Liczba kolumn się nie zgadza: oczekiwano ${expected.columns.length} (${expected.columns.join(', ')}), a Twoje zapytanie zwraca ${actual.columns.length}.`,
    }
  }
  if (actual.total !== expected.total) {
    return { ok: false, message: `Liczba wierszy się nie zgadza: oczekiwano ${expected.total}, otrzymano ${actual.total}. Sprawdź warunki WHERE / HAVING.` }
  }

  const expectedKeys = expected.rows.map(rowKey)
  const actualKeys = actual.rows.map(rowKey)
  const sortedEqual = [...expectedKeys].sort().join('\n') === [...actualKeys].sort().join('\n')
  if (!sortedEqual) {
    return { ok: false, message: 'Liczba wierszy jest dobra, ale wartości się różnią. Sprawdź wybrane kolumny, obliczenia i zaokrąglenia.' }
  }
  if (/\bORDER\s+BY\b/i.test(solution) && expectedKeys.join('\n') !== actualKeys.join('\n')) {
    return { ok: false, message: 'Dane są poprawne, ale kolejność wierszy jest inna. Sprawdź ORDER BY (ASC / DESC).' }
  }

  const expectedNames = expected.columns.map((c) => c.toLowerCase())
  const actualNames = actual.columns.map((c) => c.toLowerCase())
  if (expectedNames.join() !== actualNames.join()) {
    return {
      ok: false,
      message: `Dane są poprawne, ale nazwy kolumn się różnią: oczekiwano (${expected.columns.join(', ')}), otrzymano (${actual.columns.join(', ')}). Użyj aliasów AS.`,
    }
  }
  return { ok: true, message: 'Brawo! Wynik jest poprawny.' }
}

/** Ocena zadania typu INSERT / UPDATE / DDL / GRANT na podstawie zapytania sprawdzającego. */
export function evaluateVerify(verify, items) {
  const error = items.find((i) => i.kind === 'error')
  if (verify.expectError) {
    return error
      ? { ok: true, message: 'Brawo! Zadanie wykonane poprawnie.' }
      : { ok: false, message: 'Jeszcze nie — obiekt nadal istnieje. Wykonaj swoje polecenie i sprawdź ponownie.' }
  }
  if (error) {
    return {
      ok: false,
      message: `Jeszcze nie — sprawdzenie zgłosiło błąd: ${error.message}. Najpierw wykonaj swoje polecenie (Ctrl+Enter), potem kliknij „Sprawdź”.`,
    }
  }
  const result = lastRows(items)
  let ok = false
  if (verify.expect === 'true') {
    ok = String(result?.rows[0]?.[0]) === '1'
  } else {
    const text = (result?.rows ?? []).map((r) => r.join(' ')).join('\n')
    ok =
      (verify.contains ?? []).every((p) => new RegExp(p, 'i').test(text)) &&
      !(verify.excludes ?? []).some((p) => new RegExp(p, 'i').test(text))
  }
  return ok
    ? { ok: true, message: 'Brawo! Zadanie wykonane poprawnie.' }
    : {
        ok: false,
        message:
          'Jeszcze nie — stan bazy nie zgadza się z treścią zadania. Wykonaj swoje polecenie (Ctrl+Enter) i sprawdź ponownie. Jeśli coś poszło nie tak, zresetuj bazę.',
      }
}
