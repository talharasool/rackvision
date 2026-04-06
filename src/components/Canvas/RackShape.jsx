import { Group, Rect, Text } from 'react-konva';
import FrameShape from './FrameShape';
import BayShape from './BayShape';
import NCMarker from './NCMarker';

// 1mm = 0.1px at scale 1
const MM_TO_PX = 0.1;

export default function RackShape({
  rack,
  scale = 1,
  editMode = false,
  isSelected = false,
  onBayClick,
  onFrameClick,
  onDragEnd,
  ncData = [],
  supplierColor,
  markerScale = 1,
  onNCTap,
  onNCLongPress,
}) {
  const {
    id,
    name,
    numberOfBays = 1,
    bayLength = 2700,
    frameDepth = 1000,
    uprightWidth = 100,
    position = { x: 0, y: 0 },
    rotation = 0,
    bays = [],
    frames = [],
  } = rack;

  const scaledBayLength = bayLength * MM_TO_PX;
  const scaledFrameDepth = frameDepth * MM_TO_PX;
  const scaledUprightWidth = uprightWidth * MM_TO_PX;

  // Total rack width = all frames + all bays
  const totalWidth =
    frames.length * scaledUprightWidth + bays.length * scaledBayLength;

  // Build NC lookup by bayId and frameId
  const ncByBay = {};
  const ncByFrame = {};
  ncData.forEach((nc) => {
    if (nc.bayId) {
      if (!ncByBay[nc.bayId]) ncByBay[nc.bayId] = [];
      ncByBay[nc.bayId].push(nc);
    }
    if (nc.frameId) {
      if (!ncByFrame[nc.frameId]) ncByFrame[nc.frameId] = [];
      ncByFrame[nc.frameId].push(nc);
    }
  });

  // Interleave frames and bays: F0 B0 F1 B1 F2 ... Fn
  const elements = [];
  let xOffset = 0;

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    elements.push(
      <FrameShape
        key={`frame-${frame.id}`}
        x={xOffset}
        y={0}
        width={scaledUprightWidth}
        depth={scaledFrameDepth}
        frameIndex={frame.index + 1}
        isSelected={false}
        editMode={editMode}
        supplierColor={supplierColor}
        onClick={() => onFrameClick?.(id, frame.id)}
      />
    );

    // NC markers on frames
    (ncByFrame[frame.id] || []).forEach((nc, ncIdx) => {
      elements.push(
        <NCMarker
          key={`fnc-${nc.id || ncIdx}`}
          x={xOffset + scaledUprightWidth / 2}
          y={-12 - ncIdx * 14}
          severity={nc.severity}
          size={5}
          markerScale={markerScale}
          onTap={() => onNCTap?.(nc)}
          onLongPress={() => onNCLongPress?.(nc)}
        />
      );
    });

    xOffset += scaledUprightWidth;

    // Bay after this frame (if there's a matching bay)
    if (i < bays.length) {
      const bay = bays[i];
      elements.push(
        <BayShape
          key={`bay-${bay.id}`}
          x={xOffset}
          y={0}
          width={scaledBayLength}
          depth={scaledFrameDepth}
          bayIndex={bay.index + 1}
          isSelected={false}
          editMode={editMode}
          supplierColor={supplierColor}
          markerScale={markerScale}
          ncMarkers={ncByBay[bay.id] || []}
          onNCTap={onNCTap}
          onNCLongPress={onNCLongPress}
          onClick={() => onBayClick?.(id, bay.id)}
        />
      );
      xOffset += scaledBayLength;
    }
  }

  const handleDragEnd = (e) => {
    if (!editMode) return;
    const node = e.target;
    onDragEnd?.(id, { x: node.x(), y: node.y() });
  };

  return (
    <Group
      x={position.x}
      y={position.y}
      rotation={rotation}
      draggable={editMode}
      onDragEnd={handleDragEnd}
    >
      {/* Selection highlight */}
      {isSelected && (
        <Rect
          x={-4}
          y={-24}
          width={totalWidth + 8}
          height={scaledFrameDepth + 44}
          fill="transparent"
          stroke="#3b82f6"
          strokeWidth={2}
          dash={[6, 3]}
          cornerRadius={4}
          shadowColor="#3b82f6"
          shadowBlur={10}
          shadowOpacity={0.3}
          listening={false}
        />
      )}

      {/* Rack name label */}
      <Text
        x={0}
        y={-18}
        width={totalWidth}
        text={name || 'Rack'}
        fontSize={12}
        fontStyle="bold"
        fill="#e2e8f0"
        align="center"
        listening={false}
      />

      {/* Frames and bays */}
      {elements}
    </Group>
  );
}
