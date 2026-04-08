import React, { useMemo } from 'react';

/**
 * Compact NC summary card showing counts by severity and a proportional bar.
 * Props: { ncs } - array of non-conformity objects (each has a `severity` field)
 */
export default function NCSummary({ ncs = [] }) {
  const counts = useMemo(() => {
    const c = { red: 0, yellow: 0, green: 0 };
    ncs.forEach((nc) => {
      const s = nc.severity || 'green';
      if (c[s] !== undefined) {
        c[s] += 1;
      } else {
        c.green += 1;
      }
    });
    return c;
  }, [ncs]);

  const total = ncs.length;

  if (total === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>0 NCs</span>
      </div>
    );
  }

  const redPct = (counts.red / total) * 100;
  const yellowPct = (counts.yellow / total) * 100;
  const greenPct = (counts.green / total) * 100;

  return (
    <div className="space-y-1.5">
      {/* Total + breakdown */}
      <div className="flex items-center gap-3 text-xs">
        <span className="text-slate-300 font-medium">{total} NC{total !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-2">
          {counts.red > 0 && (
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-slate-400">{counts.red}</span>
            </span>
          )}
          {counts.yellow > 0 && (
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-slate-400">{counts.yellow}</span>
            </span>
          )}
          {counts.green > 0 && (
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-slate-400">{counts.green}</span>
            </span>
          )}
        </div>
      </div>

      {/* Proportional severity bar */}
      <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-700">
        {counts.red > 0 && (
          <div
            className="bg-red-500 transition-all"
            style={{ width: `${redPct}%` }}
          />
        )}
        {counts.yellow > 0 && (
          <div
            className="bg-yellow-500 transition-all"
            style={{ width: `${yellowPct}%` }}
          />
        )}
        {counts.green > 0 && (
          <div
            className="bg-green-500 transition-all"
            style={{ width: `${greenPct}%` }}
          />
        )}
      </div>
    </div>
  );
}
