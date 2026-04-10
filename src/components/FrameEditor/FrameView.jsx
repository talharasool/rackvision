import React, { useMemo, useState } from 'react';
import SVGPieMarker from '../ui/SVGPieMarker';
import { groupNCsByElement } from '../../utils/ncGrouping';

const UPRIGHT_COLOR = '#64748b';
const UPRIGHT_HOVER = '#94a3b8';
const BRACE_COLOR = '#6b7280';
const BRACE_HOVER = '#9ca3af';
const DIAG_COLOR = '#4b5563';
const DIAG_HOVER = '#9ca3af';
const HORIZ_COLOR = '#6b7280';
const HORIZ_HOVER = '#9ca3af';
const BASEPLATE_COLOR = '#334155';
const BASEPLATE_HOVER = '#475569';
const FLOOR_COLOR = '#475569';
const LABEL_COLOR = '#94a3b8';
const DIM_COLOR = '#64748b';
const NC_COLORS = { green: '#22c55e', yellow: '#eab308', red: '#ef4444' };

const SVG_PADDING = { top: 40, right: 80, bottom: 50, left: 70 };
const SVG_WIDTH = 420;
const SVG_HEIGHT = 480;

export default function FrameView({
  rack,
  frame,
  frameIndex,
  ncs = [],
  onElementClick,
}) {
  const [hoveredElement, setHoveredElement] = useState(null);

  const layout = useMemo(() => {
    if (!rack && !frame) return null;

    const frameHeight = frame?.height || rack?.frameHeight || 6000;
    const frameDepth = frame?.depth || rack?.frameDepth || 1000;
    const uprightWidth = frame?.uprightWidth || rack?.uprightWidth || 100;

    // Drawing area
    const drawW = SVG_WIDTH - SVG_PADDING.left - SVG_PADDING.right;
    const drawH = SVG_HEIGHT - SVG_PADDING.top - SVG_PADDING.bottom;

    // Scale mm -> px
    const scaleX = drawW / (frameDepth + uprightWidth * 2);
    const scaleY = drawH / frameHeight;

    const uprightPxW = Math.max(uprightWidth * scaleX, 14);
    const basePlateH = 10;
    const basePlateW = uprightPxW + 10;
    const boltR = 2.5;

    // Upright positions (side view: left upright = front leg, right upright = rear leg)
    const leftUprightX = SVG_PADDING.left;
    const rightUprightX = SVG_PADDING.left + drawW - uprightPxW;
    const uprightPxH = drawH;
    const uprightTopY = SVG_PADDING.top;

    // Floor Y
    const floorY = SVG_PADDING.top + drawH;

    // Diagonal braces: X-pattern every ~1500mm
    const braceInterval = 1500; // mm
    const numBraceSections = Math.max(1, Math.round(frameHeight / braceInterval));
    const sectionPxH = uprightPxH / numBraceSections;

    const diagonals = [];
    for (let i = 0; i < numBraceSections; i++) {
      const topY = uprightTopY + i * sectionPxH;
      const bottomY = topY + sectionPxH;
      const leftInner = leftUprightX + uprightPxW;
      const rightInner = rightUprightX;

      // X-pattern: two diagonals per section
      diagonals.push({
        id: `diagonal-${i * 2 + 1}`,
        label: `Diagonal ${i * 2 + 1}`,
        x1: leftInner,
        y1: topY,
        x2: rightInner,
        y2: bottomY,
        section: i,
      });
      diagonals.push({
        id: `diagonal-${i * 2 + 2}`,
        label: `Diagonal ${i * 2 + 2}`,
        x1: rightInner,
        y1: topY,
        x2: leftInner,
        y2: bottomY,
        section: i,
      });
    }

    // Horizontal braces: at each brace section boundary
    const horizontals = [];
    for (let i = 0; i <= numBraceSections; i++) {
      const y = uprightTopY + i * sectionPxH;
      horizontals.push({
        id: `horizontal-${i + 1}`,
        label: `Horizontal ${i + 1}`,
        x1: leftUprightX + uprightPxW,
        y1: y,
        x2: rightUprightX,
        y2: y,
      });
    }

    return {
      frameHeight,
      frameDepth,
      uprightWidth,
      scaleX,
      scaleY,
      uprightPxW,
      basePlateH,
      basePlateW,
      boltR,
      leftUprightX,
      rightUprightX,
      uprightPxH,
      uprightTopY,
      floorY,
      diagonals,
      horizontals,
      drawW,
      drawH,
      numBraceSections,
      sectionPxH,
    };
  }, [rack, frame]);

  if (!layout) {
    return (
      <div className="text-slate-500 text-sm text-center py-8">
        No frame data available
      </div>
    );
  }

  const {
    frameHeight,
    frameDepth,
    uprightWidth,
    uprightPxW,
    basePlateH,
    basePlateW,
    boltR,
    leftUprightX,
    rightUprightX,
    uprightPxH,
    uprightTopY,
    floorY,
    diagonals,
    horizontals,
    drawW,
  } = layout;

  const handleClick = (elementType, elementId) => {
    onElementClick?.(elementType, elementId);
  };

  // Group NCs by element for dot placement
  const ncsByElement = {};
  ncs.forEach((nc) => {
    const key = `${nc.elementType}-${nc.elementId}`;
    if (!ncsByElement[key]) ncsByElement[key] = [];
    ncsByElement[key].push(nc);
  });

  return (
    <svg
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      className="w-full h-full max-w-[420px] max-h-[480px]"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Arrow marker defs */}
      <defs>
        <marker
          id="fvArrowLeft"
          viewBox="0 0 6 6"
          refX={0}
          refY={3}
          markerWidth={5}
          markerHeight={5}
          orient="auto"
        >
          <path d="M6,0 L0,3 L6,6" fill={DIM_COLOR} />
        </marker>
        <marker
          id="fvArrowRight"
          viewBox="0 0 6 6"
          refX={6}
          refY={3}
          markerWidth={5}
          markerHeight={5}
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6" fill={DIM_COLOR} />
        </marker>
        <marker
          id="fvArrowUp"
          viewBox="0 0 6 6"
          refX={3}
          refY={0}
          markerWidth={5}
          markerHeight={5}
          orient="auto"
        >
          <path d="M0,6 L3,0 L6,6" fill={DIM_COLOR} />
        </marker>
        <marker
          id="fvArrowDown"
          viewBox="0 0 6 6"
          refX={3}
          refY={6}
          markerWidth={5}
          markerHeight={5}
          orient="auto"
        >
          <path d="M0,0 L3,6 L6,0" fill={DIM_COLOR} />
        </marker>
      </defs>

      {/* Floor line */}
      <line
        x1={SVG_PADDING.left - 10}
        y1={floorY}
        x2={SVG_WIDTH - SVG_PADDING.right + 10}
        y2={floorY}
        stroke={FLOOR_COLOR}
        strokeWidth={1.5}
        strokeDasharray="6 4"
      />

      {/* Base plates */}
      {[leftUprightX, rightUprightX].map((ux, idx) => {
        const bpId = idx === 0 ? 'baseplate-left' : 'baseplate-right';
        const isHovered = hoveredElement === bpId;
        return (
          <g key={bpId}>
            {/* Base plate rectangle */}
            <rect
              x={ux - (basePlateW - uprightPxW) / 2}
              y={floorY - basePlateH}
              width={basePlateW}
              height={basePlateH}
              fill={isHovered ? BASEPLATE_HOVER : BASEPLATE_COLOR}
              stroke={isHovered ? '#cbd5e1' : FLOOR_COLOR}
              strokeWidth={isHovered ? 1.5 : 0.5}
              rx={1}
              className="cursor-pointer transition-colors duration-150"
              onMouseEnter={() => setHoveredElement(bpId)}
              onMouseLeave={() => setHoveredElement(null)}
              onClick={() => handleClick('basePlate', bpId)}
            />
            {/* Anchor bolt circles */}
            <circle
              cx={ux - (basePlateW - uprightPxW) / 2 + 4}
              cy={floorY - basePlateH / 2}
              r={boltR}
              fill="none"
              stroke={isHovered ? '#cbd5e1' : '#64748b'}
              strokeWidth={0.75}
              className="pointer-events-none"
            />
            <circle
              cx={ux + uprightPxW + (basePlateW - uprightPxW) / 2 - 4}
              cy={floorY - basePlateH / 2}
              r={boltR}
              fill="none"
              stroke={isHovered ? '#cbd5e1' : '#64748b'}
              strokeWidth={0.75}
              className="pointer-events-none"
            />
          </g>
        );
      })}

      {/* Diagonal braces (X-pattern) */}
      {diagonals.map((diag) => {
        const isHovered = hoveredElement === diag.id;
        return (
          <line
            key={diag.id}
            x1={diag.x1}
            y1={diag.y1}
            x2={diag.x2}
            y2={diag.y2}
            stroke={isHovered ? DIAG_HOVER : DIAG_COLOR}
            strokeWidth={isHovered ? 2.5 : 1.5}
            className="cursor-pointer transition-colors duration-150"
            onMouseEnter={() => setHoveredElement(diag.id)}
            onMouseLeave={() => setHoveredElement(null)}
            onClick={() => handleClick('diagonal', diag.id)}
          />
        );
      })}

      {/* Horizontal braces */}
      {horizontals.map((h) => {
        const isHovered = hoveredElement === h.id;
        return (
          <line
            key={h.id}
            x1={h.x1}
            y1={h.y1}
            x2={h.x2}
            y2={h.y2}
            stroke={isHovered ? HORIZ_HOVER : HORIZ_COLOR}
            strokeWidth={isHovered ? 2.5 : 1.5}
            strokeDasharray="4 3"
            className="cursor-pointer transition-colors duration-150"
            onMouseEnter={() => setHoveredElement(h.id)}
            onMouseLeave={() => setHoveredElement(null)}
            onClick={() => handleClick('horizontal', h.id)}
          />
        );
      })}

      {/* Left upright */}
      <rect
        x={leftUprightX}
        y={uprightTopY}
        width={uprightPxW}
        height={uprightPxH}
        fill={hoveredElement === 'left-upright' ? UPRIGHT_HOVER : UPRIGHT_COLOR}
        stroke={hoveredElement === 'left-upright' ? '#cbd5e1' : '#475569'}
        strokeWidth={hoveredElement === 'left-upright' ? 1.5 : 0.5}
        rx={2}
        className="cursor-pointer transition-colors duration-150"
        onMouseEnter={() => setHoveredElement('left-upright')}
        onMouseLeave={() => setHoveredElement(null)}
        onClick={() => handleClick('upright', 'left-upright')}
      />

      {/* Right upright */}
      <rect
        x={rightUprightX}
        y={uprightTopY}
        width={uprightPxW}
        height={uprightPxH}
        fill={hoveredElement === 'right-upright' ? UPRIGHT_HOVER : UPRIGHT_COLOR}
        stroke={hoveredElement === 'right-upright' ? '#cbd5e1' : '#475569'}
        strokeWidth={hoveredElement === 'right-upright' ? 1.5 : 0.5}
        rx={2}
        className="cursor-pointer transition-colors duration-150"
        onMouseEnter={() => setHoveredElement('right-upright')}
        onMouseLeave={() => setHoveredElement(null)}
        onClick={() => handleClick('upright', 'right-upright')}
      />

      {/* Upright labels — side view: left = FRONT, right = REAR */}
      <text
        x={leftUprightX + uprightPxW / 2}
        y={uprightTopY - 2}
        textAnchor="middle"
        fill={LABEL_COLOR}
        fontSize={8}
        fontWeight="700"
        className="pointer-events-none select-none"
      >
        FRONT
      </text>
      <text
        x={rightUprightX + uprightPxW / 2}
        y={uprightTopY - 2}
        textAnchor="middle"
        fill={LABEL_COLOR}
        fontSize={8}
        fontWeight="700"
        className="pointer-events-none select-none"
      >
        REAR
      </text>

      {/* NC markers - grouped by element as pie charts (dev only) */}
      {import.meta.env.DEV && Object.values(groupNCsByElement(ncs)).map((group) => {
        let cx, cy;
        const nc = group.ncs[0];

        if (nc.elementType === 'upright') {
          if (nc.elementId === 'left-upright' || nc.elementId?.includes('front')) {
            cx = leftUprightX + uprightPxW / 2;
            cy = uprightTopY + 35;
          } else {
            cx = rightUprightX + uprightPxW / 2;
            cy = uprightTopY + 35;
          }
        } else if (nc.elementType === 'diagonal') {
          const diagIdx = parseInt(nc.elementId?.replace(/\D/g, '') || '1', 10) - 1;
          const diag = diagonals[diagIdx];
          if (diag) {
            cx = (diag.x1 + diag.x2) / 2;
            cy = (diag.y1 + diag.y2) / 2 - 8;
          } else {
            cx = SVG_PADDING.left + drawW / 2;
            cy = SVG_PADDING.top + 20;
          }
        } else if (nc.elementType === 'horizontal' || nc.elementType === 'crossMember') {
          const hIdx = parseInt(nc.elementId?.replace(/\D/g, '') || '1', 10) - 1;
          const h = horizontals[hIdx];
          if (h) {
            cx = (h.x1 + h.x2) / 2;
            cy = h.y1 - 8;
          } else {
            cx = SVG_PADDING.left + drawW / 2;
            cy = SVG_PADDING.top + 20;
          }
        } else if (nc.elementType === 'basePlate') {
          if (nc.elementId === 'baseplate-left') {
            cx = leftUprightX + uprightPxW / 2;
            cy = floorY - basePlateH - 8;
          } else {
            cx = rightUprightX + uprightPxW / 2;
            cy = floorY - basePlateH - 8;
          }
        } else {
          // Other frame elements (footplate, frontImpactGuard, cornerImpactGuard, etc.)
          cx = SVG_PADDING.left + drawW / 2;
          cy = SVG_PADDING.top + 20;
        }

        return (
          <SVGPieMarker
            key={group.key}
            ncs={group.ncs}
            cx={cx}
            cy={cy}
            r={group.ncs.length > 1 ? 12 : 7}
          />
        );
      })}

      {/* Dimension: Frame height on left */}
      <g>
        <line
          x1={SVG_PADDING.left - 28}
          y1={uprightTopY}
          x2={SVG_PADDING.left - 28}
          y2={floorY}
          stroke={DIM_COLOR}
          strokeWidth={0.75}
          markerStart="url(#fvArrowUp)"
          markerEnd="url(#fvArrowDown)"
        />
        <text
          x={SVG_PADDING.left - 32}
          y={(uprightTopY + floorY) / 2}
          textAnchor="middle"
          fill={LABEL_COLOR}
          fontSize={9}
          fontWeight="500"
          transform={`rotate(-90, ${SVG_PADDING.left - 32}, ${(uprightTopY + floorY) / 2})`}
        >
          {frameHeight} mm
        </text>
      </g>

      {/* Dimension: Frame depth at bottom */}
      <g>
        <line
          x1={leftUprightX}
          y1={floorY + 20}
          x2={rightUprightX + uprightPxW}
          y2={floorY + 20}
          stroke={DIM_COLOR}
          strokeWidth={0.75}
          markerStart="url(#fvArrowLeft)"
          markerEnd="url(#fvArrowRight)"
        />
        <text
          x={(leftUprightX + rightUprightX + uprightPxW) / 2}
          y={floorY + 34}
          textAnchor="middle"
          fill={LABEL_COLOR}
          fontSize={10}
          fontWeight="500"
        >
          {frameDepth} mm
        </text>
      </g>

      {/* Dimension: Upright width labels */}
      <g>
        {/* Left upright width */}
        <line
          x1={leftUprightX}
          y1={SVG_PADDING.top - 14}
          x2={leftUprightX + uprightPxW}
          y2={SVG_PADDING.top - 14}
          stroke={DIM_COLOR}
          strokeWidth={0.5}
        />
        <line
          x1={leftUprightX}
          y1={SVG_PADDING.top - 10}
          x2={leftUprightX}
          y2={SVG_PADDING.top - 18}
          stroke={DIM_COLOR}
          strokeWidth={0.5}
        />
        <line
          x1={leftUprightX + uprightPxW}
          y1={SVG_PADDING.top - 10}
          x2={leftUprightX + uprightPxW}
          y2={SVG_PADDING.top - 18}
          stroke={DIM_COLOR}
          strokeWidth={0.5}
        />
        <text
          x={leftUprightX + uprightPxW / 2}
          y={SVG_PADDING.top - 20}
          textAnchor="middle"
          fill={LABEL_COLOR}
          fontSize={8}
          fontWeight="500"
        >
          {uprightWidth}
        </text>

        {/* Right upright width */}
        <line
          x1={rightUprightX}
          y1={SVG_PADDING.top - 14}
          x2={rightUprightX + uprightPxW}
          y2={SVG_PADDING.top - 14}
          stroke={DIM_COLOR}
          strokeWidth={0.5}
        />
        <line
          x1={rightUprightX}
          y1={SVG_PADDING.top - 10}
          x2={rightUprightX}
          y2={SVG_PADDING.top - 18}
          stroke={DIM_COLOR}
          strokeWidth={0.5}
        />
        <line
          x1={rightUprightX + uprightPxW}
          y1={SVG_PADDING.top - 10}
          x2={rightUprightX + uprightPxW}
          y2={SVG_PADDING.top - 18}
          stroke={DIM_COLOR}
          strokeWidth={0.5}
        />
        <text
          x={rightUprightX + uprightPxW / 2}
          y={SVG_PADDING.top - 20}
          textAnchor="middle"
          fill={LABEL_COLOR}
          fontSize={8}
          fontWeight="500"
        >
          {uprightWidth}
        </text>
      </g>

      {/* Frame label */}
      <text
        x={SVG_WIDTH - SVG_PADDING.right + 12}
        y={uprightTopY + 14}
        textAnchor="start"
        fill={LABEL_COLOR}
        fontSize={10}
        fontWeight="600"
      >
        Frame {(frameIndex ?? 0) + 1}
      </text>
      <text
        x={SVG_WIDTH - SVG_PADDING.right + 12}
        y={uprightTopY + 28}
        textAnchor="start"
        fill="#64748b"
        fontSize={8}
      >
        Front Elevation
      </text>
    </svg>
  );
}
