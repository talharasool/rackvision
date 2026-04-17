import { Group, Rect, Text } from 'react-konva';
import NCMarker from './NCMarker';
import { computeMarkerPosition } from '../../utils/markerPlacement';
import { groupNCsByElement } from '../../utils/ncGrouping';

/**
 * Convert a hex color to an rgba string with the given alpha.
 */
function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Darken a hex color by a given factor (0 = black, 1 = original).
 */
function darkenHex(hex, factor = 0.5) {
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * factor);
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * factor);
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * factor);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default function BayShape({
  x,
  y,
  width,
  depth,
  bayIndex,
  isSelected,
  onClick,
  editMode,
  ncMarkers = [],
  supplierColor,
  markerScale = 1,
  labelFontSize = 1,
  onNCTap,
  onNCLongPress,
  onNCDragEnd,
}) {
  // Derive fill and stroke from supplierColor when provided.
  // Fill uses ~30% opacity variant; stroke uses full color.
  // When selected, use a brighter/darker variant.
  let fill, stroke;

  if (supplierColor) {
    fill = isSelected
      ? darkenHex(supplierColor, 0.55)
      : darkenHex(supplierColor, 0.35);
    stroke = isSelected ? supplierColor : darkenHex(supplierColor, 0.8);
  } else {
    fill = isSelected ? '#1e40af' : '#1e3a5f';
    stroke = isSelected ? '#60a5fa' : '#3b82f6';
  }

  return (
    <Group x={x} y={y}>
      <Rect
        width={width}
        height={depth}
        fill={fill}
        stroke={stroke}
        strokeWidth={isSelected ? 2 : 1}
        opacity={0.6}
        cornerRadius={2}
        onClick={onClick}
        onTap={onClick}
        hitStrokeWidth={4}
      />
      <Text
        x={-width}
        y={depth / 2 - 6 * labelFontSize}
        width={width * 3}
        wrap="none"
        text={`Bay ${bayIndex}`}
        fontSize={11 * labelFontSize}
        fill="#cbd5e1"
        align="center"
        listening={false}
      />
      {(() => {
        const groups = groupNCsByElement(ncMarkers);
        return Object.values(groups).map((group) => {
          // Use custom position from first NC if set, otherwise compute default
          const firstNC = group.ncs[0];
          const hasCustomPos = firstNC.markerX != null;
          const defaultPos = computeMarkerPosition(
            group.elementType,
            { bayWidth: width, bayDepth: depth, frameWidth: 0 },
            0,
            1
          );
          const markerX = hasCustomPos ? firstNC.markerX : defaultPos.x;
          const markerY = hasCustomPos ? firstNC.markerY : defaultPos.y;

          return (
            <NCMarker
              key={group.key}
              x={markerX}
              y={markerY}
              severity={group.ncs[0].severity}
              ncGroup={group.ncs.length > 1 ? group.ncs : null}
              size={6}
              markerScale={markerScale}
              draggable={editMode}
              onTap={() => onNCTap?.(firstNC)}
              onLongPress={() => onNCLongPress?.(firstNC)}
              onDragEnd={(pos) => onNCDragEnd?.(firstNC.id, pos)}
            />
          );
        });
      })()}
    </Group>
  );
}
