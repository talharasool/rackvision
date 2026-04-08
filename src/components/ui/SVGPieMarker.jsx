import React from 'react';

const SEVERITY_COLORS = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
};

/**
 * SVG Pie-chart marker that shows severity distribution of grouped NCs.
 * For use inside <svg> elements (BayFrontView, FrameView).
 *
 * @param {Array} ncs - Array of NC objects with `severity` field
 * @param {number} cx - Center X position
 * @param {number} cy - Center Y position
 * @param {number} r - Radius (default 7)
 */
export default function SVGPieMarker({ ncs = [], cx, cy, r = 10 }) {
  if (!ncs || ncs.length === 0) return null;

  // Single NC - just a circle
  if (ncs.length === 1) {
    const color = SEVERITY_COLORS[ncs[0].severity] || SEVERITY_COLORS.green;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={color}
        stroke="#0f172a"
        strokeWidth={1.5}
        className="pointer-events-none"
      />
    );
  }

  // Multiple NCs - pie chart
  const total = ncs.length;
  const slices = ncs.map((nc, i) => {
    const startAngle = (i / total) * 2 * Math.PI - Math.PI / 2;
    const endAngle = ((i + 1) / total) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    const color = SEVERITY_COLORS[nc.severity] || SEVERITY_COLORS.green;

    const d = [
      `M ${cx} ${cy}`,
      `L ${x1} ${y1}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
      'Z',
    ].join(' ');

    return (
      <path
        key={nc.id || i}
        d={d}
        fill={color}
        stroke="#0f172a"
        strokeWidth={0.5}
        className="pointer-events-none"
      />
    );
  });

  return (
    <g className="pointer-events-none">
      {/* Background circle for clean edge */}
      <circle cx={cx} cy={cy} r={r} fill="#0f172a" strokeWidth={0} />
      {slices}
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#0f172a" strokeWidth={1.5} />
      {/* Count label */}
      <text
        x={cx}
        y={cy + 3}
        textAnchor="middle"
        fill="#ffffff"
        fontSize={Math.max(6, r * 0.8)}
        fontWeight="bold"
        className="pointer-events-none select-none"
      >
        {total}
      </text>
    </g>
  );
}
