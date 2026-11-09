// Dzieli skrypt SQL na pojedyncze polecenia, podobnie jak klient wiersza poleceń `mysql`:
// uwzględnia napisy, identyfikatory w `...`, komentarze (--, #, /* */) oraz dyrektywę DELIMITER.

const LEADING_COMMENTS = /^(\s+|--(\s[^\n]*)?(\n|$)|#[^\n]*(\n|$)|\/\*[\s\S]*?\*\/)+/

export const stripLeadingComments = (sql) => sql.replace(LEADING_COMMENTS, '')

export function leadingKeyword(sql) {
  const match = stripLeadingComments(sql).match(/^[A-Za-z]+/)
  return match ? match[0].toUpperCase() : ''
}

function scanQuoted(s, start, quote) {
  let i = start + 1
  while (i < s.length) {
    const c = s[i]
    if (c === '\\' && quote !== '`') {
      i += 2
      continue
    }
    if (c === quote) {
      if (s[i + 1] === quote) {
        i += 2
        continue
      }
      return i + 1
    }
    i++
  }
  return s.length
}

export function splitStatements(script) {
  const statements = []
  let delimiter = ';'
  let current = ''
  let atLineStart = true
  let i = 0

  const flush = () => {
    const text = current.trim()
    if (stripLeadingComments(text).trim()) statements.push(text)
    current = ''
  }

  while (i < script.length) {
    if (atLineStart && !stripLeadingComments(current).trim()) {
      const m = script.slice(i).match(/^[ \t]*DELIMITER[ \t]+(\S+)[^\n]*(\n|$)/i)
      if (m) {
        delimiter = m[1]
        current = ''
        i += m[0].length
        continue
      }
    }

    const ch = script[i]
    atLineStart = false

    if (ch === "'" || ch === '"' || ch === '`') {
      const end = scanQuoted(script, i, ch)
      current += script.slice(i, end)
      i = end
    } else if (ch === '#' || (ch === '-' && script[i + 1] === '-' && /\s/.test(script[i + 2] ?? ' '))) {
      const nl = script.indexOf('\n', i)
      const end = nl === -1 ? script.length : nl
      current += script.slice(i, end)
      i = end
    } else if (ch === '/' && script[i + 1] === '*') {
      const close = script.indexOf('*/', i + 2)
      const end = close === -1 ? script.length : close + 2
      current += script.slice(i, end)
      i = end
    } else if (script.startsWith(delimiter, i)) {
      flush()
      i += delimiter.length
    } else {
      current += ch
      atLineStart = ch === '\n'
      i++
    }
  }
  flush()
  return statements
}
