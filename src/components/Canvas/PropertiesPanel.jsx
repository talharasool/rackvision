import {
  X,
  AlignStartVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignEndHorizontal,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  RotateCw,
} from 'lucide-react';

function FieldRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <label className="text-xs text-slate-400 shrink-0 w-16">{label}</label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function NumberInput({ value, onChange, step = 1, min, max }) {
  return (
    <input
      type="number"
      value={Math.round(value ?? 0)}
      onChange={(e) => onChange(Number(e.target.value))}
      step={step}
      min={min}
      max={max}
      className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white outline-none focus:border-blue-500"
    />
  );
}

export default function PropertiesPanel({
  selectedRacks = [],
  onUpdateRack,
  onClose,
  onAlignRacks,
  onDistributeRacks,
  onRotateRacks,
}) {
  if (selectedRacks.length === 0) return null;

  const isSingle = selectedRacks.length === 1;
  const rack = isSingle ? selectedRacks[0] : null;

  return (
    <div className="absolute top-0 right-0 h-full w-64 bg-slate-900 border-l border-slate-700 z-30 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-white">
          {isSingle ? 'Properties' : `${selectedRacks.length} Racks Selected`}
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Single rack properties */}
        {isSingle && rack && (
          <>
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                Identity
              </h4>
              <FieldRow label="Name">
                <input
                  type="text"
                  value={rack.name || ''}
                  onChange={(e) =>
                    onUpdateRack(rack.id, { name: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white outline-none focus:border-blue-500"
                />
              </FieldRow>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                Transform
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <FieldRow label="X">
                  <NumberInput
                    value={rack.position?.x}
                    onChange={(x) =>
                      onUpdateRack(rack.id, {
                        position: { ...rack.position, x },
                      })
                    }
                  />
                </FieldRow>
                <FieldRow label="Y">
                  <NumberInput
                    value={rack.position?.y}
                    onChange={(y) =>
                      onUpdateRack(rack.id, {
                        position: { ...rack.position, y },
                      })
                    }
                  />
                </FieldRow>
              </div>
              <FieldRow label="Rotation">
                <div className="flex items-center gap-1">
                  <NumberInput
                    value={rack.rotation || 0}
                    onChange={(rotation) =>
                      onUpdateRack(rack.id, { rotation: rotation % 360 })
                    }
                    step={15}
                  />
                  <span className="text-xs text-slate-500">deg</span>
                </div>
              </FieldRow>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                Configuration
              </h4>
              <FieldRow label="Bays">
                <span className="text-xs text-slate-300">
                  {rack.numberOfBays}
                </span>
              </FieldRow>
              <FieldRow label="Levels">
                <span className="text-xs text-slate-300">{rack.levels}</span>
              </FieldRow>
              <FieldRow label="Supplier">
                <span className="text-xs text-slate-300">
                  {rack.supplierName || 'None'}
                </span>
              </FieldRow>
            </div>
          </>
        )}

        {/* Multi-select alignment actions */}
        {!isSingle && (
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-slate-300 uppercase tracking-wider">
              Align
            </h4>
            <div className="grid grid-cols-4 gap-1">
              <button
                onClick={() => onAlignRacks?.('left')}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                title="Align Left"
              >
                <AlignStartVertical size={16} />
              </button>
              <button
                onClick={() => onAlignRacks?.('right')}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                title="Align Right"
              >
                <AlignEndVertical size={16} />
              </button>
              <button
                onClick={() => onAlignRacks?.('top')}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                title="Align Top"
              >
                <AlignStartHorizontal size={16} />
              </button>
              <button
                onClick={() => onAlignRacks?.('bottom')}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                title="Align Bottom"
              >
                <AlignEndHorizontal size={16} />
              </button>
            </div>

            <h4 className="text-xs font-medium text-slate-300 uppercase tracking-wider">
              Distribute
            </h4>
            <div className="grid grid-cols-4 gap-1">
              <button
                onClick={() => onDistributeRacks?.('horizontal')}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                title="Distribute Horizontally"
              >
                <AlignHorizontalDistributeCenter size={16} />
              </button>
              <button
                onClick={() => onDistributeRacks?.('vertical')}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                title="Distribute Vertically"
              >
                <AlignVerticalDistributeCenter size={16} />
              </button>
            </div>

            <h4 className="text-xs font-medium text-slate-300 uppercase tracking-wider">
              Transform
            </h4>
            <button
              onClick={() => onRotateRacks?.(90)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300 hover:text-white transition-colors w-full"
            >
              <RotateCw size={14} />
              Rotate 90
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
