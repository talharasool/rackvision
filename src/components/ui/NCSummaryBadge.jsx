import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Compact inline badge showing NC severity breakdown.
 *
 * Props:
 *   ncs      - array of NC objects (each must have a `severity` field)
 *   compact  - if true, shows only total with worst-severity color
 */
export default function NCSummaryBadge({ ncs = [], compact = false }) {
  const { t } = useTranslation();
  if (ncs.length === 0) return null;

  const counts = { red: 0, yellow: 0, green: 0 };
  ncs.forEach((nc) => {
    const s = nc.severity || 'green';
    if (counts[s] !== undefined) counts[s]++;
    else counts.green++;
  });

  const total = ncs.length;

  // Determine worst severity present
  const worstColor =
    counts.red > 0 ? 'red' : counts.yellow > 0 ? 'yellow' : 'green';

  const dotClass = {
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
  };

  const textClass = {
    red: 'text-red-400',
    yellow: 'text-yellow-400',
    green: 'text-green-400',
  };

  // --- Compact mode ---
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium">
        <span className={`w-2 h-2 rounded-full ${dotClass[worstColor]}`} />
        <span className={textClass[worstColor]}>{total}</span>
      </span>
    );
  }

  // --- Full mode ---
  const segments = [
    { key: 'red', count: counts.red },
    { key: 'yellow', count: counts.yellow },
    { key: 'green', count: counts.green },
  ].filter((s) => s.count > 0);

  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium">
      {/* Severity breakdown pills */}
      <span className="inline-flex items-center gap-1.5">
        {segments.map((seg) => (
          <span
            key={seg.key}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${dotClass[seg.key]}/15`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dotClass[seg.key]}`} />
            <span className={textClass[seg.key]}>{seg.count}</span>
          </span>
        ))}
      </span>

      {/* Stacked proportional bar */}
      <span className="inline-flex h-2 w-16 rounded-full overflow-hidden bg-slate-700">
        {segments.map((seg) => (
          <span
            key={seg.key}
            className={dotClass[seg.key]}
            style={{ width: `${(seg.count / total) * 100}%` }}
          />
        ))}
      </span>

      <span className="text-slate-400">{t('nc.nc_summary_badge_total', { n: total })}</span>
    </span>
  );
}
