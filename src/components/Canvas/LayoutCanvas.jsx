import { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Line, Rect } from 'react-konva';
import RackShape from './RackShape';

const MIN_SCALE = 0.2;
const MAX_SCALE = 3.0;
const GRID_SIZE = 50; // px between grid lines

export default function LayoutCanvas({
  racks = [],
  editMode = false,
  scale = 1,
  onBayClick,
  onFrameClick,
  onRackMove,
  onScaleChange,
  ncData = {},
  selectedRackId = null,
  supplierColors = {},
  markerScale = 1,
  onNCTap,
  onNCLongPress,
}) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  // Resize observer to fill parent container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      setDimensions({
        width: container.offsetWidth || 800,
        height: container.offsetHeight || 600,
      });
    };

    updateSize();

    const ro = new ResizeObserver(updateSize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Mouse wheel zoom
  const handleWheel = useCallback(
    (e) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = scale;
      const pointer = stage.getPointerPosition();
      const mousePointTo = {
        x: (pointer.x - stagePos.x) / oldScale,
        y: (pointer.y - stagePos.y) / oldScale,
      };

      const direction = e.evt.deltaY < 0 ? 1 : -1;
      const factor = 1.08;
      let newScale =
        direction > 0 ? oldScale * factor : oldScale / factor;
      newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      setStagePos(newPos);
      onScaleChange?.(newScale);
    },
    [scale, stagePos, onScaleChange]
  );

  const handleDragEnd = (e) => {
    // Stage panning -- only when not in editMode
    if (e.target === stageRef.current) {
      setStagePos({ x: e.target.x(), y: e.target.y() });
    }
  };

  const handleRackMove = useCallback(
    (rackId, newPos) => {
      onRackMove?.(rackId, newPos);
    },
    [onRackMove]
  );

  // Build grid lines that cover the visible area
  const gridLines = [];
  const visibleWidth = dimensions.width / scale + Math.abs(stagePos.x / scale);
  const visibleHeight = dimensions.height / scale + Math.abs(stagePos.y / scale);
  const startX = -Math.abs(stagePos.x / scale) - GRID_SIZE;
  const startY = -Math.abs(stagePos.y / scale) - GRID_SIZE;

  // Vertical grid lines
  for (
    let x = Math.floor(startX / GRID_SIZE) * GRID_SIZE;
    x < visibleWidth + GRID_SIZE;
    x += GRID_SIZE
  ) {
    gridLines.push(
      <Line
        key={`gv-${x}`}
        points={[x, startY, x, visibleHeight + GRID_SIZE]}
        stroke="#1e293b"
        strokeWidth={0.5}
        listening={false}
      />
    );
  }

  // Horizontal grid lines
  for (
    let y = Math.floor(startY / GRID_SIZE) * GRID_SIZE;
    y < visibleHeight + GRID_SIZE;
    y += GRID_SIZE
  ) {
    gridLines.push(
      <Line
        key={`gh-${y}`}
        points={[startX, y, visibleWidth + GRID_SIZE, y]}
        stroke="#1e293b"
        strokeWidth={0.5}
        listening={false}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#0f172a',
      }}
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        scaleX={scale}
        scaleY={scale}
        x={stagePos.x}
        y={stagePos.y}
        draggable={!editMode}
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
      >
        {/* Grid layer */}
        <Layer listening={false}>
          <Rect
            x={-5000}
            y={-5000}
            width={10000}
            height={10000}
            fill="#0f172a"
            listening={false}
          />
          {gridLines}
        </Layer>

        {/* Racks layer */}
        <Layer>
          {racks.map((rack) => (
            <RackShape
              key={rack.id}
              rack={rack}
              scale={scale}
              editMode={editMode}
              isSelected={rack.id === selectedRackId}
              onBayClick={onBayClick}
              onFrameClick={onFrameClick}
              onDragEnd={handleRackMove}
              ncData={ncData[rack.id] || []}
              supplierColor={supplierColors?.[rack.supplierId]}
              markerScale={markerScale}
              onNCTap={onNCTap}
              onNCLongPress={onNCLongPress}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
