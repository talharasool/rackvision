import { useState, useRef, useEffect } from 'react';
import {
  MousePointer2,
  Hand,
  Lock,
  Unlock,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minus,
  Plus,
  Undo2,
  Redo,
  Grid3x3,
  ArrowLeft,
  Download,
  ChevronDown,
  FileText,
} from 'lucide-react';

const SNAP_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '10px', value: 10 },
  { label: '25px', value: 25 },
  { label: '50px', value: 50 },
];

function ToolButton({ active, onClick, children, title, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg transition-colors ${
        disabled
          ? 'text-slate-600 cursor-not-allowed'
          : active
            ? 'bg-blue-600/30 text-blue-400 border border-blue-500/50'
            : 'text-slate-400 hover:text-white hover:bg-slate-700'
      }`}
    >
      {children}
    </button>
  );
}

function ExportDropdown({ onExportNCs }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  if (!onExportNCs) return null;

  return (
    <div className="relative flex items-center" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
        title="Export NCs"
      >
        <Download size={14} />
        Export NCs
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-1">
          <button
            onClick={() => { setOpen(false); onExportNCs('csv'); }}
            className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={() => { setOpen(false); onExportNCs('xlsx'); }}
            className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Export XLSX
          </button>
          <button
            onClick={() => { setOpen(false); onExportNCs('zip'); }}
            className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Export ZIP (with photos)
          </button>
        </div>
      )}
    </div>
  );
}

export default function CanvasToolbar({
  activeTool,
  onToolChange,
  editMode,
  onEditModeToggle,
  scale,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  markerScale,
  onMarkerScaleUp,
  onMarkerScaleDown,
  labelFontSize,
  onLabelFontSizeUp,
  onLabelFontSizeDown,
  snapSize,
  onSnapSizeChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onBack,
  areaName,
  onExportNCs,
  onExportLayoutPDF,
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700 shrink-0">
      {/* Left: Back + Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-white">{areaName}</h1>
          <p className="text-xs text-slate-400">Layout Editor</p>
        </div>
      </div>

      {/* Center: Tools */}
      <div className="flex items-center gap-1">
        {/* Tool selector */}
        <div className="flex items-center gap-0.5 bg-slate-800 border border-slate-700 rounded-lg p-0.5 mr-2">
          <ToolButton
            active={activeTool === 'select'}
            onClick={() => onToolChange('select')}
            title="Select (V)"
          >
            <MousePointer2 size={16} />
          </ToolButton>
          <ToolButton
            active={activeTool === 'pan'}
            onClick={() => onToolChange('pan')}
            title="Pan (H)"
          >
            <Hand size={16} />
          </ToolButton>
        </div>

        {/* Edit Mode */}
        <button
          onClick={onEditModeToggle}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors mr-2 ${
            editMode
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50'
              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
          }`}
        >
          {editMode ? <Unlock size={14} /> : <Lock size={14} />}
          {editMode ? 'Editing' : 'Locked'}
        </button>

        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5 bg-slate-800 border border-slate-700 rounded-lg p-0.5 mr-2">
          <ToolButton
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </ToolButton>
          <ToolButton
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo size={16} />
          </ToolButton>
        </div>

        {/* Grid Snap */}
        <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 mr-2">
          <Grid3x3 size={14} className="text-slate-400" />
          <select
            value={snapSize}
            onChange={(e) => onSnapSizeChange(Number(e.target.value))}
            className="bg-transparent text-xs text-slate-300 outline-none cursor-pointer"
          >
            {SNAP_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-slate-800">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Marker Size */}
        <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-1">
          <button
            onClick={onMarkerScaleDown}
            className="p-1.5 text-slate-400 hover:text-white transition-colors"
            title="Decrease marker size"
          >
            <Minus size={12} />
          </button>
          <span className="text-xs text-slate-300 w-12 text-center select-none">
            NC {Math.round(markerScale * 100)}%
          </span>
          <button
            onClick={onMarkerScaleUp}
            className="p-1.5 text-slate-400 hover:text-white transition-colors"
            title="Increase marker size"
          >
            <Plus size={12} />
          </button>
        </div>

        {/* Label Font Size */}
        {onLabelFontSizeUp && (
          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-1 ml-2">
            <button
              onClick={onLabelFontSizeDown}
              className="p-1.5 text-slate-400 hover:text-white transition-colors"
              title="Decrease label font size"
            >
              <Minus size={12} />
            </button>
            <span className="text-xs text-slate-300 w-14 text-center select-none">
              Label {Math.round((labelFontSize || 1) * 100)}%
            </span>
            <button
              onClick={onLabelFontSizeUp}
              className="p-1.5 text-slate-400 hover:text-white transition-colors"
              title="Increase label font size"
            >
              <Plus size={12} />
            </button>
          </div>
        )}

        {/* Zoom */}
        <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-1 ml-2">
          <button
            onClick={onZoomOut}
            className="p-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-xs text-slate-300 w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={onZoomIn}
            className="p-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={onResetZoom}
            className="p-1.5 text-slate-400 hover:text-white transition-colors"
            title="Fit to screen"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Right: Export actions */}
      <div className="flex items-center gap-2">
        {onExportLayoutPDF && (
          <button
            onClick={onExportLayoutPDF}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title="Export layout as PDF (Doc 1 §5.9)"
          >
            <FileText size={14} />
            Layout PDF
          </button>
        )}
        {import.meta.env.DEV && <ExportDropdown onExportNCs={onExportNCs} />}
      </div>
    </div>
  );
}
