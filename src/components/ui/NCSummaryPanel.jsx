import React from 'react';

/**
 * Larger panel showing NC summary with severity breakdown and top element types.
 *
 * Props:
 *   ncs   - array of NC objects
 *   title - panel heading (default: 'NC Summary')
 */
export default function NCSummaryPanel({ ncs = [], title = 'NC Summary' }) {
  if (ncs.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">{title}</h3>
        <p className="text-xs text-slate-500">No non-conformities recorded.</p>
      </div>
    );
  }

  const counts = { red: 0, yellow: 0, green: 0 };
  ncs.forEach((nc) => {
    const s = nc.severity || 'green';
    if (counts[s] !== undefined) counts[s]++;
    else counts.green++;
  });

  const total = ncs.length;

  const severityRows = [
    { key: 'red', label: 'Red', dotClass: 'bg-red-500', textClass: 'text-red-400', count: counts.red },
    { key: 'yellow', label: 'Yellow', dotClass: 'bg-yellow-500', textClass: 'text-yellow-400', count: counts.yellow },
    { key: 'green', label: 'Green', dotClass: 'bg-green-500', textClass: 'text-green-400', count: counts.green },
  ];

  // Group by elementType, sort by count descending, take top 5
  const elementMap = {};
  ncs.forEach((nc) => {
    const et = nc.elementType || 'Unknown';
    elementMap[et] = (elementMap[et] || 0) + 1;
  });
  const topElements = Object.entries(elementMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const segments = severityRows.filter((s) => s.count > 0);

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
        <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
          {total} NC{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Stacked severity bar */}
      <div className="h-3 w-full rounded-full overflow-hidden bg-slate-800 flex">
        {segments.map((seg) => (
          <div
            key={seg.key}
            className={seg.dotClass}
            style={{ width: `${(seg.count / total) * 100}%` }}
          />
        ))}
      </div>

      {/* Severity rows */}
      <div className="space-y-1.5">
        {severityRows.map((row) => {
          const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;
          return (
            <div key={row.key} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${row.dotClass}`} />
                <span className="text-slate-300">{row.label}</span>
              </span>
              <span className={row.textClass}>
                {row.count} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>

      {/* Top element types */}
      {topElements.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-slate-400 mb-2">Top Element Types</h4>
          <div className="space-y-1">
            {topElements.map(([elementType, count]) => (
              <div
                key={elementType}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-slate-300 capitalize">{elementType}</span>
                <span className="text-slate-400">
                  {count} NC{count !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
