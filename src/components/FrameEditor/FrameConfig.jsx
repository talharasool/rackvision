import React from 'react';
import { Link, Package, Info, Ruler } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function FrameConfig({ rack, frame, frameIndex, onUpdate }) {
  const fIndex = frameIndex ?? frame?.index ?? 0;
  const frameHeight = frame?.height || rack?.frameHeight || 0;
  const frameDepth = frame?.depth || rack?.frameDepth || 0;
  const uprightWidth = frame?.uprightWidth || rack?.uprightWidth || 0;
  const frameModel = frame?.name || frame?.model || rack?.frameType || '-';
  const capacity = frame?.capacity || rack?.frameCapacity || 0;

  // Determine connected bays: frame at index N borders bay N-1 (left) and bay N (right)
  const bays = rack?.bays || [];
  const leftBayIndex = fIndex - 1;
  const rightBayIndex = fIndex;
  const leftBay = leftBayIndex >= 0 ? bays[leftBayIndex] : null;
  const rightBay = rightBayIndex < bays.length ? bays[rightBayIndex] : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Frame Info */}
      <Card className="!p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info size={14} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Frame Information</h3>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div>
            <p className="text-slate-400">Frame Number</p>
            <p className="text-white font-medium">{fIndex + 1}</p>
          </div>
          <div>
            <p className="text-slate-400">Rack</p>
            <p className="text-white font-medium">{rack?.name || '-'}</p>
          </div>
          <div>
            <p className="text-slate-400">Height</p>
            <p className="text-white font-medium">{frameHeight} mm</p>
          </div>
          <div>
            <p className="text-slate-400">Depth</p>
            <p className="text-white font-medium">{frameDepth} mm</p>
          </div>
          <div>
            <p className="text-slate-400">Upright Width</p>
            <p className="text-white font-medium">{uprightWidth} mm</p>
          </div>
          <div>
            <p className="text-slate-400">Position</p>
            <p className="text-white font-medium">
              {fIndex === 0
                ? 'First (Left End)'
                : fIndex === (rack?.frames?.length || 1) - 1
                  ? 'Last (Right End)'
                  : `Interior (#${fIndex + 1})`}
            </p>
          </div>
        </div>
      </Card>

      {/* Frame Type / Model */}
      <Card className="!p-4">
        <div className="flex items-center gap-2 mb-3">
          <Ruler size={14} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Frame Type</h3>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div>
            <p className="text-slate-400">Model</p>
            <p className="text-white font-medium">{frameModel}</p>
          </div>
          <div>
            <p className="text-slate-400">Manufacturer</p>
            <p className="text-white font-medium">
              {frame?.manufacturer || rack?.manufacturer || '-'}
            </p>
          </div>
        </div>
      </Card>

      {/* Capacity */}
      <Card className="!p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Capacity</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div>
            <p className="text-slate-400">Rated Capacity</p>
            <p className="text-white font-medium">
              {capacity > 0 ? `${capacity.toLocaleString()} kg` : '-'}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Status</p>
            <p className="text-emerald-400 font-medium">
              {capacity > 0 ? 'Within limits' : 'Not specified'}
            </p>
          </div>
        </div>
      </Card>

      {/* Connected Bays */}
      <Card className="!p-4">
        <div className="flex items-center gap-2 mb-3">
          <Link size={14} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Connected Bays</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {/* Left bay */}
          <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-slate-800/70 border border-slate-700">
            <span className="text-xs text-slate-400 uppercase tracking-wider">
              Left Bay
            </span>
            {leftBay ? (
              <>
                <p className="text-sm text-white font-medium">
                  {leftBay.name || `Bay ${leftBayIndex + 1}`}
                </p>
                <p className="text-xs text-slate-500">Index: {leftBayIndex}</p>
              </>
            ) : (
              <p className="text-xs text-slate-500 italic">None (end frame)</p>
            )}
          </div>

          {/* Right bay */}
          <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-slate-800/70 border border-slate-700">
            <span className="text-xs text-slate-400 uppercase tracking-wider">
              Right Bay
            </span>
            {rightBay ? (
              <>
                <p className="text-sm text-white font-medium">
                  {rightBay.name || `Bay ${rightBayIndex + 1}`}
                </p>
                <p className="text-xs text-slate-500">Index: {rightBayIndex}</p>
              </>
            ) : (
              <p className="text-xs text-slate-500 italic">None (end frame)</p>
            )}
          </div>
        </div>
      </Card>

      {/* Accessories */}
      <Card className="!p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Accessories</h3>
          <Button variant="ghost" size="sm" icon={Package}>
            Add
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Package size={28} className="text-slate-600 mb-2" />
          <p className="text-sm text-slate-500">No accessories added</p>
          <p className="text-xs text-slate-600 mt-1">
            Column guards, frame protectors, and other accessories can be added here.
          </p>
        </div>
      </Card>
    </div>
  );
}
