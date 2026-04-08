import { useRef, useCallback } from 'react';
import { Group, Circle, Text, Arc } from 'react-konva';

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
  onDragEnd,
  draggable = false,
  label,
  markerScale = 1,
  ncGroup = null,
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

  const handleDragEnd = useCallback(
    (e) => {
      if (!onDragEnd) return;
      const node = e.target;
      // Report position relative to parent group
      onDragEnd({ x: node.x(), y: node.y() });
    },
    [onDragEnd]
  );

  const interactionProps = {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
  };

  // --- Pie-chart mode: multiple NCs grouped ---
  if (Array.isArray(ncGroup) && ncGroup.length > 1) {
    const total = ncGroup.length;
    const sliceAngle = 360 / total;

    return (
      <Group
        x={x}
        y={y}
        draggable={draggable}
        onDragEnd={draggable ? handleDragEnd : undefined}
        {...interactionProps}
      >
        {/* Dark background circle for clean edge */}
        <Circle x={0} y={0} radius={radius} fill="#0f172a" listening={false} />
        {/* Pie slices */}
        {ncGroup.map((nc, i) => {
          const sliceColor = (SEVERITY_COLORS[nc.severity] || SEVERITY_COLORS.green).fill;
          return (
            <Arc
              key={nc.id || i}
              x={0}
              y={0}
              angle={sliceAngle}
              rotation={i * sliceAngle - 90}
              innerRadius={0}
              outerRadius={radius}
              fill={sliceColor}
              stroke="#0f172a"
              strokeWidth={0.5}
              listening={false}
            />
          );
        })}
        {/* Outer ring */}
        <Circle
          x={0}
          y={0}
          radius={radius}
          fill="transparent"
          stroke="#0f172a"
          strokeWidth={1.5}
          listening={false}
        />
        {/* Count label */}
        <Text
          x={-radius}
          y={-radius / 2}
          width={radius * 2}
          height={radius}
          text={String(total)}
          fontSize={Math.max(8, radius * 0.9)}
          fill="#fff"
          fontStyle="bold"
          align="center"
          verticalAlign="middle"
          listening={false}
        />
        {/* Drag handle indicator */}
        {draggable && (
          <Circle
            x={0}
            y={0}
            radius={radius + 3}
            stroke="#3b82f6"
            strokeWidth={1}
            dash={[2, 2]}
            listening={false}
            opacity={0.5}
          />
        )}
      </Group>
    );
  }

  // --- Single marker mode (existing behavior) ---

  const circleProps = {
    radius,
    fill: colors.fill,
    stroke: colors.stroke,
    strokeWidth: 2,
    shadowColor: colors.fill,
    shadowBlur: 6,
    shadowOpacity: 0.5,
    shadowOffsetX: 0,
    shadowOffsetY: 2,
    hitStrokeWidth: 6,
    ...interactionProps,
  };

  // If there is a label, render a Group with circle + text.
  if (label) {
    return (
      <Group
        x={x}
        y={y}
        draggable={draggable}
        onDragEnd={draggable ? handleDragEnd : undefined}
      >
        <Circle x={0} y={0} {...circleProps} />
        {/* Drag handle indicator */}
        {draggable && (
          <Circle
            x={0}
            y={0}
            radius={radius + 3}
            stroke="#3b82f6"
            strokeWidth={1}
            dash={[2, 2]}
            listening={false}
            opacity={0.5}
          />
        )}
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

  if (draggable) {
    return (
      <Group
        x={x}
        y={y}
        draggable={true}
        onDragEnd={handleDragEnd}
      >
        <Circle x={0} y={0} {...circleProps} />
        {/* Drag handle indicator */}
        <Circle
          x={0}
          y={0}
          radius={radius + 3}
          stroke="#3b82f6"
          strokeWidth={1}
          dash={[2, 2]}
          listening={false}
          opacity={0.5}
        />
      </Group>
    );
  }

  return (
    <Circle
      x={x}
      y={y}
      {...circleProps}
    />
  );
}
