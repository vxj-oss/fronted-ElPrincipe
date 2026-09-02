import React from 'react';

export default function Table({
  columns = [],
  data = [],
  rowKey = 'id',
  emptyMessage = 'Sin registros.',
  onRowClick,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-surface-border dark:border-slate-800">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-neutral-muted dark:text-slate-400"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-6 text-center text-neutral-light dark:text-slate-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={row[rowKey]}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-slate-100 dark:border-slate-800/60 ${
                  onRowClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40' : ''
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-2.5 text-neutral-text dark:text-slate-100">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
