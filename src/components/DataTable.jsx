function Cell({ value }) {
  if (value === null || value === undefined)
    return <span className="italic text-zinc-400 dark:text-zinc-500">NULL</span>
  return String(value)
}

export default function DataTable({ columns, numeric = [], rows, total = rows.length }) {
  return (
    <div>
      <div className="max-h-[28rem] overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full border-collapse text-left font-mono text-[13px]">
          <thead className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-800">
            <tr>
              <th className="w-10 border-b border-zinc-200 px-3 py-2 text-right text-[11px] font-medium text-zinc-400 dark:border-zinc-700">
                #
              </th>
              {columns.map((c, i) => (
                <th
                  key={i}
                  className={`whitespace-nowrap border-b border-zinc-200 px-3 py-2 font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200 ${
                    numeric[i] ? 'text-right' : ''
                  }`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr
                key={r}
                className="odd:bg-white even:bg-zinc-50/60 hover:bg-emerald-50 dark:odd:bg-zinc-900 dark:even:bg-zinc-900/40 dark:hover:bg-emerald-950/40"
              >
                <td className="border-b border-zinc-100 px-3 py-1.5 text-right text-[11px] text-zinc-400 dark:border-zinc-800">
                  {r + 1}
                </td>
                {row.map((v, c) => (
                  <td
                    key={c}
                    className={`max-w-md whitespace-pre-wrap border-b border-zinc-100 px-3 py-1.5 align-top dark:border-zinc-800 ${
                      numeric[c] ? 'whitespace-nowrap text-right tabular-nums text-sky-700 dark:text-sky-300' : ''
                    }`}
                  >
                    <Cell value={v} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="px-4 py-3 text-sm text-zinc-500">Empty set — zapytanie nie zwróciło żadnych wierszy.</p>
        )}
      </div>
      {total > rows.length && (
        <p className="mt-2 text-xs text-zinc-500">
          Wyświetlono pierwsze {rows.length} z {total} wierszy. Użyj LIMIT, aby zawęzić wynik.
        </p>
      )}
    </div>
  )
}
