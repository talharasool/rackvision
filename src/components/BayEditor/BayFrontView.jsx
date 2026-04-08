import React, { useMemo, useState } from 'react';
import useBeamDatabaseStore from '../../stores/beamDatabaseStore';
import SVGPieMarker from '../ui/SVGPieMarker';
import { groupNCsByElement } from '../../utils/ncGrouping';

const UPRIGHT_COLOR = '#64748b';
const UPRIGHT_HOVER = '#94a3b8';
const BEAM_COLORS = {
  'Box Beam':    { fill: '#3b82f6', hover: '#60a5fa', stroke: '#2563eb' },
  'Step Beam':   { fill: '#8b5cf6', hover: '#a78bfa', stroke: '#7c3aed' },
  'Structural':  { fill: '#f59e0b', hover: '#fbbf24', stroke: '#d97706' },
  'Custom':      { fill: '#06b6d4', hover: '#22d3ee', stroke: '#0891b2' },
  'standard-double-c': { fill: '#3b82f6', hover: '#60a5fa', stroke: '#2563eb' },
  'step-beam':   { fill: '#8b5cf6', hover: '#a78bfa', stroke: '#7c3aed' },
  'other':       { fill: '#06b6d4', hover: '#22d3ee', stroke: '#0891b2' },
  default:       { fill: '#3b82f6', hover: '#60a5fa', stroke: '#2563eb' },
};
const FLOOR_COLOR = '#475569';
const BASEPLATE_COLOR = '#334155';
const LABEL_COLOR = '#94a3b8';
const DIM_COLOR = '#64748b';
const NC_COLORS = { green: '#22c55e', yellow: '#eab308', red: '#ef4444' };

const SVG_PADDING = { top: 40, right: 80, bottom: 60, left: 60 };
const SVG_WIDTH = 500;
const SVG_HEIGHT = 460;

export default function BayFrontView({
  rack,
  bay,
  bayIndex,
  ncs = [],
  onElementClick,
}) {
  const [hoveredElement, setHoveredElement] = useState(null);
  const getBeamById = useBeamDatabaseStore((s) => s.getBeamById);

  const layout = useMemo(() => {
    if (!rack) return null;

    const frameHeight = rack.frameHeight || 6000;
    const bayLength = rack.bayLength || 2700;
    const uprightWidth = rack.uprightWidth || 100;
    const levels = rack.levels || 3;
    const firstElevation = rack.firstElevation || 0;
    const levelSpacing = rack.levelSpacing || 1500;
    const individualHeights = rack.individualHeights || [];
    const useIndividual =
      rack.useIndividualHeights && individualHeights.length === levels;

    // Compute the highest beam elevation to ensure all levels fit
    let maxElevation = frameHeight;
    for (let i = 0; i < levels; i++) {
      const elev = useIndividual
        ? individualHeights[i]
        : firstElevation + levelSpacing * i;
      if (elev > maxElevation) maxElevation = elev;
    }
    // Add 10% padding above the highest element so beams aren't at the very edge
    const effectiveHeight = maxElevation * 1.08;

    // Drawing area dimensions
    const drawW = SVG_WIDTH - SVG_PADDING.left - SVG_PADDING.right;
    const drawH = SVG_HEIGHT - SVG_PADDING.top - SVG_PADDING.bottom;

    // Scale: mm -> px (use effectiveHeight to fit all beams)
    const scaleX = drawW / (bayLength + uprightWidth * 2);
    const scaleY = drawH / effectiveHeight;

    const uprightPxW = Math.max(uprightWidth * scaleX, 12);
    const beamH = 10;
    const basePlateH = 8;
    const basePlateW = uprightPxW + 6;

    // Upright positions
    const leftUprightX = SVG_PADDING.left;
    const rightUprightX = SVG_PADDING.left + drawW - uprightPxW;
    // Uprights cover the frame height, scaled to the effective height
    const uprightPxH = frameHeight * scaleY;
    const uprightTopY = SVG_PADDING.top + drawH - uprightPxH;

    // Floor Y
    const floorY = SVG_PADDING.top + drawH;

    // Level beam positions (bottom-up: floor is 0mm)
    const beamPositions = [];
    for (let i = 0; i < levels; i++) {
      const elevationMm = useIndividual
        ? individualHeights[i]
        : firstElevation + levelSpacing * i;
      const yPx = floorY - elevationMm * scaleY;
      beamPositions.push({
        level: i + 1,
        elevationMm,
        y: yPx,
        x: leftUprightX + uprightPxW,
        width: rightUprightX - (leftUprightX + uprightPxW),
      });
    }

    return {
      frameHeight,
      bayLength,
      uprightWidth,
      levels,
      scaleX,
      scaleY,
      uprightPxW,
      beamH,
      basePlateH,
      basePlateW,
      leftUprightX,
      rightUprightX,
      uprightPxH,
      uprightTopY,
      floorY,
      beamPositions,
      drawW,
      drawH,
    };
  }, [rack]);

  // Resolve beam name from bay config or rack-level data
  const getBeamName = (levelIdx) => {
    // 1. Try bay-level per-level config (new Phase 2 format)
    const bayConfig = bay?.bayConfig;
    if (bayConfig?.beamSelections?.[levelIdx]?.beamDbId) {
      const dbBeam = getBeamById(bayConfig.beamSelections[levelIdx].beamDbId);
      if (dbBeam) return dbBeam.name;
    }
    // 2. Try rack-level levelBeams (old format)
    const lb = rack?.levelBeams?.[levelIdx];
    if (lb?.beamId) {
      const dbBeam = getBeamById(lb.beamId);
      if (dbBeam) return dbBeam.name;
    }
    // 3. Fallback
    return null;
  };

  if (!layout) {
    return (
      <div className="text-slate-500 text-sm text-center py-8">
        No rack data available
      </div>
    );
  }

  const {
    frameHeight,
    bayLength,
    uprightPxW,
    beamH,
    basePlateH,
    basePlateW,
    leftUprightX,
    rightUprightX,
    uprightPxH,
    uprightTopY,
    floorY,
    beamPositions,
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

  // Compute interaxis values for right-side dimensions
  const interaxisValues = beamPositions.map((bp, i) => {
    if (i === 0) return bp.elevationMm; // distance from ground to first beam
    return bp.elevationMm - beamPositions[i - 1].elevationMm;
  });

  return (
    <svg
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      className="w-full h-full max-w-[500px] max-h-[460px]"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Arrow markers - defined first */}
      <defs>
        <marker
          id="arrowLeft"
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
          id="arrowRight"
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
          id="arrowUp"
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
          id="arrowDown"
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
      <rect
        x={leftUprightX - 3}
        y={floorY - basePlateH}
        width={basePlateW}
        height={basePlateH}
        fill={BASEPLATE_COLOR}
        stroke={FLOOR_COLOR}
        strokeWidth={0.5}
        rx={1}
      />
      <rect
        x={rightUprightX - 3}
        y={floorY - basePlateH}
        width={basePlateW}
        height={basePlateH}
        fill={BASEPLATE_COLOR}
        stroke={FLOOR_COLOR}
        strokeWidth={0.5}
        rx={1}
      />

      {/* Left upright */}
      <rect
        x={leftUprightX}
        y={uprightTopY}
        width={uprightPxW}
        height={uprightPxH}
        fill={
          hoveredElement === 'left-upright' ? UPRIGHT_HOVER : UPRIGHT_COLOR
        }
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
        fill={
          hoveredElement === 'right-upright' ? UPRIGHT_HOVER : UPRIGHT_COLOR
        }
        stroke={hoveredElement === 'right-upright' ? '#cbd5e1' : '#475569'}
        strokeWidth={hoveredElement === 'right-upright' ? 1.5 : 0.5}
        rx={2}
        className="cursor-pointer transition-colors duration-150"
        onMouseEnter={() => setHoveredElement('right-upright')}
        onMouseLeave={() => setHoveredElement(null)}
        onClick={() => handleClick('upright', 'right-upright')}
      />

      {/* Beams at each level */}
      {beamPositions.map((beam) => {
        const beamId = `beam-level-${beam.level}`;
        const isHovered = hoveredElement === beamId;
        const levelIdx = beam.level - 1;
        const lb = rack.levelBeams?.[levelIdx];
        const beamType = lb?.beamType || rack.beamType || 'default';
        const colors = BEAM_COLORS[beamType] || BEAM_COLORS.default;
        const beamName = getBeamName(levelIdx);
        const beamH2 = beamType === 'Structural' ? beamH + 3 : beamH;
        return (
          <g key={beamId}>
            <rect
              x={beam.x}
              y={beam.y - beamH2 / 2}
              width={beam.width}
              height={beamH2}
              fill={isHovered ? colors.hover : colors.fill}
              stroke={isHovered ? colors.hover : colors.stroke}
              strokeWidth={isHovered ? 1.5 : 0.5}
              rx={2}
              className="cursor-pointer transition-colors duration-150"
              onMouseEnter={() => setHoveredElement(beamId)}
              onMouseLeave={() => setHoveredElement(null)}
              onClick={() => handleClick('beam', beamId)}
            />
            {/* Level label centered on beam - show beam name if available */}
            <text
              x={beam.x + beam.width / 2}
              y={beam.y + 3.5}
              textAnchor="middle"
              fill="#ffffff"
              fontSize={beamName ? 7.5 : 9}
              fontWeight="600"
              className="pointer-events-none select-none"
            >
              {beamName
                ? `L${beam.level} - ${beamName.length > 20 ? beamName.substring(0, 20) + '...' : beamName}`
                : `L${beam.level}`
              }
            </text>
          </g>
        );
      })}

      {/* NC markers - grouped by element as pie charts (dev only) */}
      {import.meta.env.DEV && (() => {
        const groups = Object.values(groupNCsByElement(ncs));
        let fallbackIdx = 0; // counter to spread out non-beam/non-upright markers
        return groups.map((group) => {
          let cx, cy;
          const nc = group.ncs[0];
          const markerR = group.ncs.length > 1 ? 12 : 7;

          if (nc.elementType === 'beam') {
            const level = parseInt(nc.elementId?.replace(/\D/g, '') || '1', 10);
            const beamPos = beamPositions.find((b) => b.level === level);
            if (beamPos) {
              cx = beamPos.x + beamPos.width * 0.85;
              cy = beamPos.y - beamH / 2 - markerR - 2;
            } else {
              cx = SVG_PADDING.left + drawW / 2;
              cy = SVG_PADDING.top + 20;
            }
          } else if (nc.elementId === 'left-upright') {
            cx = leftUprightX + uprightPxW / 2;
            cy = uprightTopY + 30;
          } else if (nc.elementId === 'right-upright') {
            cx = rightUprightX + uprightPxW / 2;
            cy = uprightTopY + 30;
          } else {
            // Bay-level or other elements: spread horizontally across top
            cx = SVG_PADDING.left + 40 + fallbackIdx * 30;
            cy = SVG_PADDING.top + 14;
            fallbackIdx++;
          }

          return (
            <SVGPieMarker
              key={group.key}
              ncs={group.ncs}
              cx={cx}
              cy={cy}
              r={markerR}
            />
          );
        });
      })()}

      {/* Dimension: Bay width at BOTTOM (below floor line) */}
      <g>
        <line
          x1={leftUprightX + uprightPxW}
          y1={floorY + 20}
          x2={rightUprightX}
          y2={floorY + 20}
          stroke={DIM_COLOR}
          strokeWidth={0.75}
          markerStart="url(#arrowLeft)"
          markerEnd="url(#arrowRight)"
        />
        <text
          x={(leftUprightX + uprightPxW + rightUprightX) / 2}
          y={floorY + 34}
          textAnchor="middle"
          fill={LABEL_COLOR}
          fontSize={10}
          fontWeight="500"
        >
          {bayLength} mm
        </text>
      </g>

      {/* Dimension: Frame height on left */}
      <g>
        <line
          x1={SVG_PADDING.left - 20}
          y1={uprightTopY}
          x2={SVG_PADDING.left - 20}
          y2={floorY}
          stroke={DIM_COLOR}
          strokeWidth={0.75}
          markerStart="url(#arrowUp)"
          markerEnd="url(#arrowDown)"
        />
        <text
          x={SVG_PADDING.left - 24}
          y={(uprightTopY + floorY) / 2}
          textAnchor="middle"
          fill={LABEL_COLOR}
          fontSize={9}
          fontWeight="500"
          transform={`rotate(-90, ${SVG_PADDING.left - 24}, ${(uprightTopY + floorY) / 2})`}
        >
          {frameHeight} mm
        </text>
      </g>

      {/* Dimension: Interaxis on right side */}
      {beamPositions.map((beam, i) => {
        const interaxis = interaxisValues[i];
        const prevY = i === 0 ? floorY : beamPositions[i - 1].y;
        const midY = (prevY + beam.y) / 2;
        const dimX = SVG_WIDTH - SVG_PADDING.right + 12;

        return (
          <g key={`dim-${beam.level}`}>
            {/* Tick at beam level */}
            <line
              x1={SVG_WIDTH - SVG_PADDING.right + 8}
              y1={beam.y}
              x2={SVG_WIDTH - SVG_PADDING.right + 20}
              y2={beam.y}
              stroke={DIM_COLOR}
              strokeWidth={0.5}
            />
            {/* Interaxis bracket line */}
            <line
              x1={dimX}
              y1={prevY}
              x2={dimX}
              y2={beam.y}
              stroke={DIM_COLOR}
              strokeWidth={0.5}
              strokeDasharray="2 2"
            />
            {/* Interaxis value label */}
            <text
              x={SVG_WIDTH - SVG_PADDING.right + 24}
              y={midY + 3}
              textAnchor="start"
              fill={LABEL_COLOR}
              fontSize={beamPositions.length > 8 ? 6.5 : 8}
            >
              {interaxis} mm
            </text>
          </g>
        );
      })}

      {/* Top beam absolute height label */}
      {beamPositions.length > 0 && (
        <g>
          <line
            x1={SVG_WIDTH - SVG_PADDING.right + 8}
            y1={floorY}
            x2={SVG_WIDTH - SVG_PADDING.right + 20}
            y2={floorY}
            stroke={DIM_COLOR}
            strokeWidth={0.5}
          />
          {/* Show absolute height for the topmost beam */}
          <text
            x={SVG_WIDTH - SVG_PADDING.right + 24}
            y={beamPositions[beamPositions.length - 1].y - 6}
            textAnchor="start"
            fill="#60a5fa"
            fontSize={8}
            fontWeight="600"
          >
            {beamPositions[beamPositions.length - 1].elevationMm} mm
          </text>
        </g>
      )}
    </svg>
  );
}
