import { forwardRef } from 'react';
import { Group, Rect, Text } from 'react-konva';
import FrameShape from './FrameShape';
import BayShape from './BayShape';
import NCMarker from './NCMarker';
import { computeMarkerPosition } from '../../utils/markerPlacement';
import { groupNCsByElement } from '../../utils/ncGrouping';

// 1mm = 0.1px at scale 1
const MM_TO_PX = 0.1;

const RackShape = forwardRef(function RackShape(
  {
    rack,
    scale = 1,
    editMode = false,
    isSelected = false,
    onBayClick,
    onFrameClick,
    onDragEnd,
    onDragMove,
    onClick,
    ncData = [],
    supplierColor,
    markerScale = 1,
    labelFontSize = 1,
    onNCTap,
    onNCLongPress,
    onNCDragEnd,
    snapSize = 0,
  },
  ref
) {
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
    frontSide = 'top',
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
        labelFontSize={labelFontSize}
        frontSide={frontSide}
        onClick={() => onFrameClick?.(id, frame.id)}
      />
    );

    // NC markers on frames — grouped
    const frameNCs = ncByFrame[frame.id] || [];
    if (frameNCs.length > 0) {
      const groups = groupNCsByElement(frameNCs);
      Object.values(groups).forEach((group) => {
        const firstNC = group.ncs[0];
        const hasCustomPos = firstNC.markerX != null;
        const defaultPos = computeMarkerPosition(
          group.elementType,
          { bayWidth: 0, bayDepth: scaledFrameDepth, frameWidth: scaledUprightWidth },
          0,
          1
        );
        const mx = hasCustomPos ? firstNC.markerX : xOffset + defaultPos.x;
        const my = hasCustomPos ? firstNC.markerY : defaultPos.y;

        elements.push(
          <NCMarker
            key={`fnc-${group.key}`}
            x={mx}
            y={my}
            severity={firstNC.severity}
            ncGroup={group.ncs.length > 1 ? group.ncs : null}
            size={5}
            markerScale={markerScale}
            draggable={editMode}
            onTap={() => onNCTap?.(firstNC)}
            onLongPress={() => onNCLongPress?.(firstNC)}
            onDragEnd={(pos) => onNCDragEnd?.(firstNC.id, pos)}
          />
        );
      });
    }

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
          labelFontSize={labelFontSize}
          ncMarkers={ncByBay[bay.id] || []}
          onNCTap={onNCTap}
          onNCLongPress={onNCLongPress}
          onNCDragEnd={onNCDragEnd}
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

  const handleDragMove = (e) => {
    if (!editMode) return;
    const node = e.target;

    // Snap to grid during drag
    if (snapSize > 0) {
      const x = Math.round(node.x() / snapSize) * snapSize;
      const y = Math.round(node.y() / snapSize) * snapSize;
      node.x(x);
      node.y(y);
    }

    onDragMove?.(id, { x: node.x(), y: node.y() }, {
      width: totalWidth,
      height: scaledFrameDepth,
    });
  };

  const handleClick = (e) => {
    // Only fire if clicking the group itself (background), not children
    onClick?.(id, e);
  };

  return (
    <Group
      ref={ref}
      id={id}
      x={position.x}
      y={position.y}
      rotation={rotation}
      draggable={editMode}
      onDragEnd={handleDragEnd}
      onDragMove={handleDragMove}
      onClick={handleClick}
      onTap={handleClick}
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

      {/* Rack name label — Doc 5 §12: vertically centered in rack body,
          placed to the right of the last frame, outside the rack. */}
      <Text
        x={totalWidth + 4}
        y={scaledFrameDepth / 2 - (7 * labelFontSize)}
        text={name || 'Rack'}
        fontSize={14 * labelFontSize}
        fontStyle="bold"
        fill="#e2e8f0"
        listening={false}
      />

      {/* Frames and bays */}
      {elements}
    </Group>
  );
});

export default RackShape;
