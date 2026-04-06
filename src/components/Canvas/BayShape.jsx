import { Group, Rect, Text } from 'react-konva';
import NCMarker from './NCMarker';

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
  onNCTap,
  onNCLongPress,
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
        x={0}
        y={depth / 2 - 6}
        width={width}
        text={`Bay ${bayIndex}`}
        fontSize={11}
        fill="#cbd5e1"
        align="center"
        listening={false}
      />
      {ncMarkers.map((nc, i) => {
        // Distribute NC markers evenly across the bay width
        const markerX = ((i + 1) / (ncMarkers.length + 1)) * width;
        const markerY = depth / 2 + 12;
        return (
          <NCMarker
            key={nc.id || i}
            x={markerX}
            y={markerY}
            severity={nc.severity}
            size={6}
            markerScale={markerScale}
            onTap={() => onNCTap?.(nc)}
            onLongPress={() => onNCLongPress?.(nc)}
            onClick={() => nc.onClick?.(nc)}
          />
        );
      })}
    </Group>
  );
}
