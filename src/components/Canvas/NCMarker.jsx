import { useRef, useCallback } from 'react';
import { Group, Circle, Text } from 'react-konva';

const SEVERITY_COLORS = {
  green: { fill: '#22c55e', stroke: '#15803d' },
  yellow: { fill: '#eab308', stroke: '#a16207' },
  red: { fill: '#ef4444', stroke: '#b91c1c' },
};

const LONG_PRESS_MS = 500;

export default function NCMarker({
  x,
  y,
  severity = 'green',
  size = 8,
  onClick,
  onTap,
  onLongPress,
  label,
  markerScale = 1,
}) {
  const timerRef = useRef(null);
  const longPressedRef = useRef(false);

  const colors = SEVERITY_COLORS[severity] || SEVERITY_COLORS.green;
  const radius = size * markerScale;

  // --- Long press / tap handling ---

  const startTimer = useCallback(() => {
    longPressedRef.current = false;
    timerRef.current = setTimeout(() => {
      longPressedRef.current = true;
      onLongPress?.();
    }, LONG_PRESS_MS);
  }, [onLongPress]);

  const cancelTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Touch handlers
  const handleTouchStart = useCallback(() => {
    startTimer();
  }, [startTimer]);

  const handleTouchEnd = useCallback(() => {
    cancelTimer();
    if (!longPressedRef.current) {
      // Short tap
      if (onTap) {
        onTap();
      } else if (onClick) {
        onClick();
      }
    }
  }, [cancelTimer, onTap, onClick]);

  // Mouse handlers
  const handleMouseDown = useCallback(() => {
    startTimer();
  }, [startTimer]);

  const handleMouseUp = useCallback(() => {
    cancelTimer();
    if (!longPressedRef.current) {
      if (onTap) {
        onTap();
      } else if (onClick) {
        onClick();
      }
    }
  }, [cancelTimer, onTap, onClick]);

  // If there is a label, render a Group with circle + text.
  // Otherwise just render a Circle.
  if (label) {
    return (
      <Group x={x} y={y}>
        <Circle
          x={0}
          y={0}
          radius={radius}
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth={2}
          shadowColor={colors.fill}
          shadowBlur={6}
          shadowOpacity={0.5}
          shadowOffsetX={0}
          shadowOffsetY={2}
          hitStrokeWidth={6}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
        />
        <Text
          x={-radius}
          y={-radius / 2}
          width={radius * 2}
          height={radius}
          text={String(label)}
          fontSize={Math.max(8, radius * 0.9)}
          fill="#fff"
          fontStyle="bold"
          align="center"
          verticalAlign="middle"
          listening={false}
        />
      </Group>
    );
  }

  return (
    <Circle
      x={x}
      y={y}
      radius={radius}
      fill={colors.fill}
      stroke={colors.stroke}
      strokeWidth={2}
      shadowColor={colors.fill}
      shadowBlur={6}
      shadowOpacity={0.5}
      shadowOffsetX={0}
      shadowOffsetY={2}
      hitStrokeWidth={6}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    />
  );
}
