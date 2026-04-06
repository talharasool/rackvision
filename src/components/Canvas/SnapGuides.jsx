import { Line } from 'react-konva';

export default function SnapGuides({ guides = [] }) {
  return (
    <>
      {guides.map((guide, i) => {
        if (guide.orientation === 'vertical') {
          return (
            <Line
              key={`sg-v-${i}`}
              points={[guide.position, -5000, guide.position, 5000]}
              stroke="#06b6d4"
              strokeWidth={1}
              dash={[4, 4]}
              listening={false}
            />
          );
        }
        return (
          <Line
            key={`sg-h-${i}`}
            points={[-5000, guide.position, 5000, guide.position]}
            stroke="#22c55e"
            strokeWidth={1}
            dash={[4, 4]}
            listening={false}
          />
        );
      })}
    </>
  );
}

const SNAP_THRESHOLD = 8;

/**
 * Calculate snap guides for a dragging rack against other racks.
 * Returns { guides, snappedPos } where snappedPos is the adjusted position.
 */
export function calculateSnapGuides(
  dragRackId,
  dragPos,
  dragSize,
  allRacks,
  snapSize
) {
  const guides = [];
  let snappedX = dragPos.x;
  let snappedY = dragPos.y;

  // If snap to grid is enabled
  if (snapSize > 0) {
    snappedX = Math.round(dragPos.x / snapSize) * snapSize;
    snappedY = Math.round(dragPos.y / snapSize) * snapSize;
    return { guides: [], snappedPos: { x: snappedX, y: snappedY } };
  }

  // Otherwise, snap to other racks (alignment guides)
  const dragLeft = dragPos.x;
  const dragRight = dragPos.x + (dragSize?.width || 0);
  const dragTop = dragPos.y;
  const dragBottom = dragPos.y + (dragSize?.height || 0);
  const dragCenterX = (dragLeft + dragRight) / 2;
  const dragCenterY = (dragTop + dragBottom) / 2;

  let closestDx = Infinity;
  let closestDy = Infinity;

  for (const rack of allRacks) {
    if (rack.id === dragRackId) continue;

    const pos = rack.position || { x: 0, y: 0 };
    const rLeft = pos.x;
    const rRight = pos.x + (rack._width || 0);
    const rTop = pos.y;
    const rBottom = pos.y + (rack._height || 0);
    const rCenterX = (rLeft + rRight) / 2;
    const rCenterY = (rTop + rBottom) / 2;

    // Vertical alignment checks (x-axis)
    const xChecks = [
      { drag: dragLeft, ref: rLeft, label: 'left-left' },
      { drag: dragRight, ref: rRight, label: 'right-right' },
      { drag: dragLeft, ref: rRight, label: 'left-right' },
      { drag: dragRight, ref: rLeft, label: 'right-left' },
      { drag: dragCenterX, ref: rCenterX, label: 'center-center-x' },
    ];

    for (const check of xChecks) {
      const diff = Math.abs(check.drag - check.ref);
      if (diff < SNAP_THRESHOLD && diff < Math.abs(closestDx)) {
        closestDx = check.ref - check.drag;
        guides.push({
          orientation: 'vertical',
          position: check.ref,
        });
      }
    }

    // Horizontal alignment checks (y-axis)
    const yChecks = [
      { drag: dragTop, ref: rTop, label: 'top-top' },
      { drag: dragBottom, ref: rBottom, label: 'bottom-bottom' },
      { drag: dragTop, ref: rBottom, label: 'top-bottom' },
      { drag: dragBottom, ref: rTop, label: 'bottom-top' },
      { drag: dragCenterY, ref: rCenterY, label: 'center-center-y' },
    ];

    for (const check of yChecks) {
      const diff = Math.abs(check.drag - check.ref);
      if (diff < SNAP_THRESHOLD && diff < Math.abs(closestDy)) {
        closestDy = check.ref - check.drag;
        guides.push({
          orientation: 'horizontal',
          position: check.ref,
        });
      }
    }
  }

  if (Math.abs(closestDx) < SNAP_THRESHOLD) snappedX = dragPos.x + closestDx;
  if (Math.abs(closestDy) < SNAP_THRESHOLD) snappedY = dragPos.y + closestDy;

  return {
    guides: guides.length > 0 ? guides : [],
    snappedPos: { x: snappedX, y: snappedY },
  };
}
