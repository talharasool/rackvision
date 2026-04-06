import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Lock,
  Unlock,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minus,
  Plus,
  X,
  Pencil,
  Trash2,
} from 'lucide-react';
import Button from '../components/ui/Button';
import useInspectionStore from '../stores/inspectionStore';
import useRackStore from '../stores/rackStore';
import useNCStore from '../stores/ncStore';
import useSupplierStore from '../stores/supplierStore';
import LayoutCanvas from '../components/Canvas/LayoutCanvas';
import ncTypes from '../data/ncTypes';

/** Resolve NC type name from ncTypeId */
function getNCTypeName(ncTypeId) {
  if (!ncTypeId) return 'Unknown';
  for (const category of Object.values(ncTypes)) {
    const found = category.find((t) => t.id === ncTypeId);
    if (found) return found.name;
  }
  return ncTypeId;
}

/** Severity label with colored dot */
function SeverityBadge({ severity }) {
  const colorMap = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span
        className={`w-2.5 h-2.5 rounded-full ${colorMap[severity] || colorMap.green}`}
      />
      <span className="capitalize text-slate-300">{severity}</span>
    </span>
  );
}

export default function LayoutEditor() {
  const { inspectionId, areaId } = useParams();
  const navigate = useNavigate();
  const { inspections } = useInspectionStore();
  const { racks, updateRack } = useRackStore();
  const { nonConformities, removeNC } = useNCStore();
  const { suppliers } = useSupplierStore();

  const [editMode, setEditMode] = useState(false);
  const [scale, setScale] = useState(1);
  const [markerScale, setMarkerScale] = useState(1);

  // NC popup state
  const [selectedNC, setSelectedNC] = useState(null);
  const [ncPopupMode, setNCPopupMode] = useState(null); // 'view' | 'actions' | null

  const inspection = inspections.find((i) => i.id === inspectionId);
  const area = inspection?.workingAreas?.find((a) => a.id === areaId);
  const areaRacks = racks.filter((r) => r.areaId === areaId);

  // Build NC data grouped by rack
  const ncDataByRack = useMemo(() => {
    const map = {};
    areaRacks.forEach((rack) => {
      map[rack.id] = nonConformities.filter((nc) => nc.rackId === rack.id);
    });
    return map;
  }, [areaRacks, nonConformities]);

  // Build supplier color lookup
  const supplierColors = useMemo(() => {
    const map = {};
    suppliers.forEach((s) => {
      map[s.id] = s.color;
    });
    return map;
  }, [suppliers]);

  // Suppliers that actually have racks in this area
  const activeSuppliers = useMemo(() => {
    const ids = new Set(areaRacks.map((r) => r.supplierId).filter(Boolean));
    return suppliers.filter((s) => ids.has(s.id));
  }, [areaRacks, suppliers]);

  if (!inspection || !area) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Layout not found.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  // --- Zoom handlers ---
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.3));
  };

  const handleResetZoom = () => {
    setScale(1);
  };

  const handleScaleChange = (newScale) => {
    setScale(newScale);
  };

  // --- Marker scale handlers ---
  const handleMarkerScaleUp = () => {
    setMarkerScale((prev) => Math.min(prev + 0.25, 3));
  };

  const handleMarkerScaleDown = () => {
    setMarkerScale((prev) => Math.max(prev - 0.25, 0.25));
  };

  // --- Navigation handlers ---
  const handleBayClick = (rackId, bayId) => {
    navigate(
      `/inspection/${inspectionId}/area/${areaId}/rack/${rackId}/bay/${bayId}`
    );
  };

  const handleFrameClick = (rackId, frameId) => {
    navigate(
      `/inspection/${inspectionId}/area/${areaId}/rack/${rackId}/frame/${frameId}`
    );
  };

  const handleRackMove = (rackId, position) => {
    if (editMode) {
      updateRack(rackId, { position });
    }
  };

  // --- NC marker interaction handlers ---
  const handleNCTap = useCallback((nc) => {
    setSelectedNC(nc);
    setNCPopupMode('view');
  }, []);

  const handleNCLongPress = useCallback((nc) => {
    setSelectedNC(nc);
    setNCPopupMode('actions');
  }, []);

  const closeNCPopup = () => {
    setSelectedNC(null);
    setNCPopupMode(null);
  };

  const handleDeleteNC = () => {
    if (selectedNC) {
      removeNC(selectedNC.id);
    }
    closeNCPopup();
  };

  const handleEditNC = () => {
    // Navigate to the bay or frame view where the NC can be edited
    if (selectedNC) {
      if (selectedNC.bayId) {
        navigate(
          `/inspection/${inspectionId}/area/${areaId}/rack/${selectedNC.rackId}/bay/${selectedNC.bayId}`
        );
      } else if (selectedNC.frameId) {
        navigate(
          `/inspection/${inspectionId}/area/${areaId}/rack/${selectedNC.rackId}/frame/${selectedNC.frameId}`
        );
      }
    }
    closeNCPopup();
  };

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() =>
              navigate(`/inspection/${inspectionId}/area/${areaId}/racks`)
            }
            className="text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white">{area.name}</h1>
            <p className="text-xs text-slate-400">Layout Editor</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Edit Mode Toggle */}
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              editMode
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
            }`}
          >
            {editMode ? <Unlock size={16} /> : <Lock size={16} />}
            {editMode ? 'Editing' : 'Locked'}
          </button>

          {/* Marker Size Controls */}
          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-1">
            <button
              onClick={handleMarkerScaleDown}
              className="p-2 text-slate-400 hover:text-white transition-colors"
              title="Decrease marker size"
            >
              <Minus size={14} />
            </button>
            <span className="text-xs text-slate-300 w-14 text-center select-none">
              NC {Math.round(markerScale * 100)}%
            </span>
            <button
              onClick={handleMarkerScaleUp}
              className="p-2 text-slate-400 hover:text-white transition-colors"
              title="Increase marker size"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-1">
            <button
              onClick={handleZoomOut}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-xs text-slate-300 w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <Maximize2 size={16} />
            </button>
          </div>

          {/* Back to Rack List */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              navigate(`/inspection/${inspectionId}/area/${areaId}/racks`)
            }
            icon={ArrowLeft}
          >
            Back to Rack List
          </Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        <LayoutCanvas
          racks={areaRacks}
          editMode={editMode}
          scale={scale}
          onBayClick={handleBayClick}
          onFrameClick={handleFrameClick}
          onRackMove={handleRackMove}
          onScaleChange={handleScaleChange}
          ncData={ncDataByRack}
          supplierColors={supplierColors}
          markerScale={markerScale}
          onNCTap={handleNCTap}
          onNCLongPress={handleNCLongPress}
        />

        {/* Supplier Color Legend */}
        {activeSuppliers.length > 0 && (
          <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-700 rounded-lg p-3 backdrop-blur-sm max-w-56">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Suppliers
            </h4>
            <div className="flex flex-col gap-1.5">
              {activeSuppliers.map((supplier) => (
                <div key={supplier.id} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                    style={{ backgroundColor: supplier.color }}
                  />
                  <span className="text-xs text-slate-300 truncate">
                    {supplier.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NC Popup - View Details */}
        {selectedNC && ncPopupMode === 'view' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 border border-slate-600 rounded-xl shadow-2xl p-4 min-w-64 max-w-80 z-50">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">
                Non-Conformity
              </h3>
              <button
                onClick={closeNCPopup}
                className="text-slate-400 hover:text-white transition-colors p-0.5"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Type:</span>
                <span className="text-slate-200">
                  {getNCTypeName(selectedNC.ncTypeId)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Severity:</span>
                <SeverityBadge severity={selectedNC.severity} />
              </div>
              {selectedNC.elementType && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Element:</span>
                  <span className="text-slate-200 capitalize">
                    {selectedNC.elementType}
                  </span>
                </div>
              )}
              {selectedNC.face && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Face:</span>
                  <span className="text-slate-200 uppercase">
                    {selectedNC.face}
                  </span>
                </div>
              )}
              {selectedNC.quantity > 1 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Quantity:</span>
                  <span className="text-slate-200">{selectedNC.quantity}</span>
                </div>
              )}
              {selectedNC.notes && (
                <div>
                  <span className="text-slate-400 block mb-1">Notes:</span>
                  <p className="text-slate-300 text-xs bg-slate-800 rounded p-2">
                    {selectedNC.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={handleEditNC}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <Pencil size={12} />
                Edit
              </button>
              <button
                onClick={closeNCPopup}
                className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* NC Popup - Long Press Actions */}
        {selectedNC && ncPopupMode === 'actions' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 border border-slate-600 rounded-xl shadow-2xl p-2 min-w-48 z-50">
            <div className="text-xs text-slate-400 px-3 pt-2 pb-1 font-medium">
              {getNCTypeName(selectedNC.ncTypeId)} -{' '}
              <span className="capitalize">{selectedNC.severity}</span>
            </div>
            <button
              onClick={handleEditNC}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Pencil size={14} />
              Edit NC
            </button>
            <button
              onClick={handleDeleteNC}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 size={14} />
              Delete NC
            </button>
            <div className="border-t border-slate-700 mt-1 pt-1">
              <button
                onClick={closeNCPopup}
                className="w-full px-3 py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Backdrop for popups */}
        {selectedNC && (
          <div
            className="absolute inset-0 z-40"
            onClick={closeNCPopup}
          />
        )}
      </div>
    </div>
  );
}
