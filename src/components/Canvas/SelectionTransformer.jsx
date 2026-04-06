import { useEffect, useRef } from 'react';
import { Transformer } from 'react-konva';

export default function SelectionTransformer({
  selectedNodes = [],
  onTransformEnd,
}) {
  const trRef = useRef(null);

  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;

    if (selectedNodes.length === 0) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }

    // Filter out null refs
    const validNodes = selectedNodes.filter(Boolean);
    tr.nodes(validNodes);
    tr.getLayer()?.batchDraw();
  }, [selectedNodes]);

  const handleTransformEnd = () => {
    const tr = trRef.current;
    if (!tr) return;

    tr.nodes().forEach((node) => {
      const rackId = node.id();
      if (!rackId) return;

      const x = node.x();
      const y = node.y();
      const rotation = node.rotation();
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      // Reset scale back to 1 (we apply scale as a size change conceptually)
      node.scaleX(1);
      node.scaleY(1);

      onTransformEnd?.(rackId, {
        position: { x, y },
        rotation,
        scaleX,
        scaleY,
      });
    });
  };

  return (
    <Transformer
      ref={trRef}
      rotateEnabled={true}
      enabledAnchors={[
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
      ]}
      borderStroke="#3b82f6"
      borderStrokeWidth={2}
      anchorFill="#1e40af"
      anchorStroke="#60a5fa"
      anchorSize={10}
      anchorCornerRadius={2}
      rotateAnchorOffset={20}
      keepRatio={true}
      boundBoxFunc={(oldBox, newBox) => {
        // Minimum size constraint
        if (newBox.width < 20 || newBox.height < 20) {
          return oldBox;
        }
        return newBox;
      }}
      onTransformEnd={handleTransformEnd}
    />
  );
}
