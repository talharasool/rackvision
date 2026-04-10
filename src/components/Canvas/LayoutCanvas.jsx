import { useRef, useEffect, useState, useCallback, createRef } from 'react';
import { Stage, Layer, Line, Rect } from 'react-konva';
import RackShape from './RackShape';
import SelectionTransformer from './SelectionTransformer';
import SnapGuides, { calculateSnapGuides } from './SnapGuides';

const MIN_SCALE = 0.2;
const MAX_SCALE = 3.0;
const GRID_SIZE = 50; // px between grid lines

export default function LayoutCanvas({
  racks = [],
  editMode = false,
  scale = 1,
  activeTool = 'select',
  onBayClick,
  onFrameClick,
  onRackMove,
  onScaleChange,
  ncData = {},
  selectedRackIds = [],
  onSelectionChange,
  supplierColors = {},
  markerScale = 1,
  labelFontSize = 1,
  onNCTap,
  onNCLongPress,
  onNCDragEnd,
  onTransformEnd,
  snapSize = 0,
  onContextMenu,
}) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  // Selection box state
  const [selectionBox, setSelectionBox] = useState(null);
  const isSelectingRef = useRef(false);
  const selectionStartRef = useRef(null);

  // Snap guides
  const [snapGuides, setSnapGuides] = useState([]);

  // Rack refs for Transformer
  const rackRefsMap = useRef({});

  // Ensure refs exist for all racks
  racks.forEach((rack) => {
    if (!rackRefsMap.current[rack.id]) {
      rackRefsMap.current[rack.id] = createRef();
    }
  });

  // Cleanup stale refs
  const rackIds = new Set(racks.map((r) => r.id));
  Object.keys(rackRefsMap.current).forEach((id) => {
    if (!rackIds.has(id)) delete rackRefsMap.current[id];
  });

  // Get selected node refs for Transformer
  const selectedNodes = selectedRackIds
    .map((id) => rackRefsMap.current[id]?.current)
    .filter(Boolean);

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
    // Stage panning
    if (e.target === stageRef.current) {
      setStagePos({ x: e.target.x(), y: e.target.y() });
    }
  };

  const handleRackMove = useCallback(
    (rackId, newPos) => {
      setSnapGuides([]);
      onRackMove?.(rackId, newPos);
    },
    [onRackMove]
  );

  const handleRackDragMove = useCallback(
    (rackId, pos, size) => {
      if (snapSize === 0) {
        // Alignment snap to other racks
        const racksWithSize = racks.map((r) => ({
          ...r,
          _width: size?.width || 100,
          _height: size?.height || 100,
        }));
        const { guides } = calculateSnapGuides(
          rackId,
          pos,
          size,
          racksWithSize,
          0
        );
        setSnapGuides(guides);
      }
    },
    [racks, snapSize]
  );

  // --- Selection logic ---

  const getPointerPosOnCanvas = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pointer = stage.getPointerPosition();
    if (!pointer) return { x: 0, y: 0 };
    return {
      x: (pointer.x - stagePos.x) / scale,
      y: (pointer.y - stagePos.y) / scale,
    };
  }, [stagePos, scale]);

  const handleStageMouseDown = useCallback(
    (e) => {
      // Right-click context menu
      if (e.evt.button === 2) {
        e.evt.preventDefault();
        return;
      }

      if (activeTool !== 'select') return;

      // Check if clicking on a rack element by walking up the tree
      const target = e.target;
      const stage = stageRef.current;
      const currentRackIds = new Set(racks.map((r) => r.id));

      let clickedOnRack = false;
      let node = target;
      while (node && node !== stage) {
        const nodeId = node.id?.();
        if (nodeId && currentRackIds.has(nodeId)) {
          clickedOnRack = true;
          break;
        }
        node = node.getParent();
      }

      // If clicking on empty area (not on a rack), deselect and start selection box
      if (!clickedOnRack) {
        if (!e.evt.shiftKey) {
          onSelectionChange?.([]);
        }
        if (editMode) {
          const pos = getPointerPosOnCanvas();
          selectionStartRef.current = pos;
          isSelectingRef.current = true;
          setSelectionBox({
            x: pos.x,
            y: pos.y,
            width: 0,
            height: 0,
          });
        }
      }
    },
    [activeTool, editMode, onSelectionChange, getPointerPosOnCanvas, racks]
  );

  const handleStageMouseMove = useCallback(
    (e) => {
      if (!isSelectingRef.current || !selectionStartRef.current) return;

      const pos = getPointerPosOnCanvas();
      const start = selectionStartRef.current;

      setSelectionBox({
        x: Math.min(start.x, pos.x),
        y: Math.min(start.y, pos.y),
        width: Math.abs(pos.x - start.x),
        height: Math.abs(pos.y - start.y),
      });
    },
    [getPointerPosOnCanvas]
  );

  const handleStageMouseUp = useCallback(() => {
    if (!isSelectingRef.current || !selectionBox) {
      isSelectingRef.current = false;
      setSelectionBox(null);
      return;
    }

    // Find racks inside selection box
    if (selectionBox.width > 5 && selectionBox.height > 5) {
      const box = selectionBox;
      const selected = racks.filter((rack) => {
        const pos = rack.position || { x: 0, y: 0 };
        return (
          pos.x >= box.x &&
          pos.y >= box.y &&
          pos.x <= box.x + box.width &&
          pos.y <= box.y + box.height
        );
      });
      onSelectionChange?.(selected.map((r) => r.id));
    }

    isSelectingRef.current = false;
    selectionStartRef.current = null;
    setSelectionBox(null);
  }, [selectionBox, racks, onSelectionChange]);

  const handleRackClick = useCallback(
    (rackId, e) => {
      if (activeTool !== 'select') return;

      const shiftKey = e?.evt?.shiftKey || false;

      if (shiftKey) {
        // Toggle selection
        const newIds = selectedRackIds.includes(rackId)
          ? selectedRackIds.filter((id) => id !== rackId)
          : [...selectedRackIds, rackId];
        onSelectionChange?.(newIds);
      } else {
        onSelectionChange?.([rackId]);
      }
    },
    [activeTool, selectedRackIds, onSelectionChange]
  );

  // Context menu (right-click)
  const handleContextMenu = useCallback(
    (e) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      // Find if right-clicking on a rack
      const target = e.target;
      let rackGroup = target;

      // Walk up to find the rack Group (which has an id matching a rack)
      while (rackGroup && rackGroup !== stage) {
        const nodeId = rackGroup.id?.();
        if (nodeId && racks.some((r) => r.id === nodeId)) {
          // Select this rack if not already
          if (!selectedRackIds.includes(nodeId)) {
            onSelectionChange?.([nodeId]);
          }
          const pointer = stage.getPointerPosition();
          onContextMenu?.({
            rackId: nodeId,
            x: pointer.x,
            y: pointer.y,
          });
          return;
        }
        rackGroup = rackGroup.getParent();
      }
    },
    [racks, selectedRackIds, onSelectionChange, onContextMenu]
  );

  const handleTransformEnd = useCallback(
    (rackId, data) => {
      onTransformEnd?.(rackId, data);
    },
    [onTransformEnd]
  );

  // Determine if stage is draggable
  const stageDraggable = activeTool === 'pan' || !editMode;

  // Build grid lines that cover the visible area
  const gridLines = [];
  const visibleWidth =
    dimensions.width / scale + Math.abs(stagePos.x / scale);
  const visibleHeight =
    dimensions.height / scale + Math.abs(stagePos.y / scale);
  const startX = -Math.abs(stagePos.x / scale) - GRID_SIZE;
  const startY = -Math.abs(stagePos.y / scale) - GRID_SIZE;

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
        cursor:
          activeTool === 'pan'
            ? 'grab'
            : activeTool === 'select'
              ? 'default'
              : 'default',
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
        draggable={stageDraggable}
        onWheel={handleWheel}
        onDragEnd={handleDragEnd}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onTouchStart={handleStageMouseDown}
        onTouchMove={handleStageMouseMove}
        onTouchEnd={handleStageMouseUp}
        onContextMenu={handleContextMenu}
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
              ref={rackRefsMap.current[rack.id]}
              rack={rack}
              scale={scale}
              editMode={editMode}
              isSelected={selectedRackIds.includes(rack.id)}
              onBayClick={onBayClick}
              onFrameClick={onFrameClick}
              onDragEnd={handleRackMove}
              onDragMove={handleRackDragMove}
              onClick={handleRackClick}
              ncData={ncData[rack.id] || []}
              supplierColor={supplierColors?.[rack.supplierId]}
              markerScale={markerScale}
              labelFontSize={labelFontSize}
              onNCTap={onNCTap}
              onNCLongPress={onNCLongPress}
              onNCDragEnd={onNCDragEnd}
              snapSize={snapSize}
            />
          ))}

          {/* Selection Transformer */}
          {editMode && selectedRackIds.length > 0 && (
            <SelectionTransformer
              selectedNodes={selectedNodes}
              onTransformEnd={handleTransformEnd}
            />
          )}

          {/* Snap Guides */}
          <SnapGuides guides={snapGuides} />

          {/* Selection box rectangle */}
          {selectionBox && (
            <Rect
              x={selectionBox.x}
              y={selectionBox.y}
              width={selectionBox.width}
              height={selectionBox.height}
              fill="rgba(59, 130, 246, 0.1)"
              stroke="#3b82f6"
              strokeWidth={1}
              dash={[4, 4]}
              listening={false}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}
