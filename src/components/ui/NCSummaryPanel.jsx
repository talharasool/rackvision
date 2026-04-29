import React from 'react';
import { useTranslation } from 'react-i18next';
import { SCOPE_CATEGORIES } from '../../data/ncTypes';
import { getNCTypeById } from '../../utils/ncHelpers';

/**
 * Larger panel showing NC summary with severity breakdown, scope categories,
 * and top element types.
 *
 * Props:
 *   ncs   - array of NC objects
 *   title - panel heading (default: 'NC Summary')
 */
export default function NCSummaryPanel({ ncs = [], title }) {
  const { t } = useTranslation();
  const panelTitle = title || t('nc.nc_summary_default_title');

  if (ncs.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">{panelTitle}</h3>
        <p className="text-xs text-slate-500">{t('common.no_non_conformities_recorded')}</p>
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
    { key: 'red', label: t('common.severity_red'), dotClass: 'bg-red-500', textClass: 'text-red-400', count: counts.red },
    { key: 'yellow', label: t('common.severity_yellow'), dotClass: 'bg-yellow-500', textClass: 'text-yellow-400', count: counts.yellow },
    { key: 'green', label: t('common.severity_green'), dotClass: 'bg-green-500', textClass: 'text-green-400', count: counts.green },
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

  // Group by scope category
  const scopeCounts = { missing: 0, to_be_corrected: 0, to_be_repositioned: 0, other: 0 };
  ncs.forEach((nc) => {
    const ncType = getNCTypeById(nc.ncTypeId);
    const cat = ncType?.scopeCategory || 'other';
    scopeCounts[cat] = (scopeCounts[cat] || 0) + 1;
  });

  const segments = severityRows.filter((s) => s.count > 0);

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300">{panelTitle}</h3>
        <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
          {t('nc.nc_panel_total_badge', { n: total })}
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

      {/* Scope category pills */}
      <div>
        <h4 className="text-xs font-medium text-slate-400 mb-2">{t('common.by_scope')}</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(SCOPE_CATEGORIES).map(([key, cat]) => {
            const count = scopeCounts[key] || 0;
            if (count === 0) return null;
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ backgroundColor: cat.color + '20', color: cat.color }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                {cat.label}: {count}
              </span>
            );
          })}
        </div>
      </div>

      {/* Top element types */}
      {topElements.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-slate-400 mb-2">{t('common.top_element_types')}</h4>
          <div className="space-y-1">
            {topElements.map(([elementType, count]) => (
              <div
                key={elementType}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-slate-300 capitalize">{elementType}</span>
                <span className="text-slate-400">
                  {t('nc.nc_count', { n: count })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
