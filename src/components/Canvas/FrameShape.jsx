import { Group, Rect, Text } from 'react-konva';

/**
 * Darken a hex color by a given factor (0 = black, 1 = original).
 */
function darkenHex(hex, factor = 0.5) {
  const r = Math.round(parseInt(hex.slice(1, 3), 16) * factor);
  const g = Math.round(parseInt(hex.slice(3, 5), 16) * factor);
  const b = Math.round(parseInt(hex.slice(5, 7), 16) * factor);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default function FrameShape({
  x,
  y,
  width,
  depth,
  frameIndex,
  isSelected,
  onClick,
  editMode,
  supplierColor,
  labelFontSize = 1,
}) {
  // When supplierColor is provided, use a darker shade for the fill instead of gray.
  let fill, stroke;

  if (supplierColor) {
    fill = isSelected ? supplierColor : darkenHex(supplierColor, 0.4);
    stroke = isSelected ? supplierColor : darkenHex(supplierColor, 0.25);
  } else {
    fill = isSelected ? '#3b82f6' : '#475569';
    stroke = isSelected ? '#60a5fa' : '#1e293b';
  }

  return (
    <Group x={x} y={y}>
      <Rect
        width={width}
        height={depth}
        fill={fill}
        stroke={stroke}
        strokeWidth={1}
        cornerRadius={1}
        shadowColor="#000"
        shadowBlur={isSelected ? 6 : 2}
        shadowOpacity={isSelected ? 0.4 : 0.2}
        shadowOffsetY={1}
        onClick={onClick}
        onTap={onClick}
        hitStrokeWidth={4}
      />
      <Text
        x={-width}
        y={depth + 4}
        width={width * 3}
        wrap="none"
        text={`${frameIndex}`}
        fontSize={9 * labelFontSize}
        fill="#94a3b8"
        align="center"
        listening={false}
      />
    </Group>
  );
}
