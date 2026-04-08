import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  X,
  Pencil,
  Trash2,
  Copy,
  RotateCw,
  Download,
} from 'lucide-react';
import Button from '../components/ui/Button';
import useInspectionStore from '../stores/inspectionStore';
import useRackStore from '../stores/rackStore';
import useNCStore from '../stores/ncStore';
import useSupplierStore from '../stores/supplierStore';
import LayoutCanvas from '../components/Canvas/LayoutCanvas';
import CanvasToolbar from '../components/Canvas/CanvasToolbar';
import PropertiesPanel from '../components/Canvas/PropertiesPanel';
import { getNCTypeName } from '../utils/ncHelpers';
import { buildExportRows, rowsToCSV, downloadFile, downloadXLSX, downloadZIPBundle } from '../utils/exportNC';

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
  const { racks, updateRack, deleteRack, duplicateRack, undo, redo, canUndo, canRedo } =
    useRackStore();
  const { nonConformities, removeNC, updateNC } = useNCStore();
  const { suppliers } = useSupplierStore();

  const [editMode, setEditMode] = useState(false);
  const [scale, setScale] = useState(1);
  const [markerScale, setMarkerScale] = useState(1);
  const [activeTool, setActiveTool] = useState('select');
  const [selectedRackIds, setSelectedRackIds] = useState([]);
  const [snapSize, setSnapSize] = useState(0);
  const [showProperties, setShowProperties] = useState(false);

  // NC popup state
  const [selectedNC, setSelectedNC] = useState(null);
  const [ncPopupMode, setNCPopupMode] = useState(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState(null);

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

  // Selected rack objects
  const selectedRacks = useMemo(
    () => areaRacks.filter((r) => selectedRackIds.includes(r.id)),
    [areaRacks, selectedRackIds]
  );

  // Show properties panel when selection changes
  useEffect(() => {
    if (selectedRackIds.length > 0) {
      setShowProperties(true);
    }
  }, [selectedRackIds]);

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't capture if typing in an input
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.tagName === 'SELECT'
      )
        return;

      const ctrl = e.ctrlKey || e.metaKey;

      // Delete / Backspace — delete selected
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedRackIds.length > 0 &&
        editMode
      ) {
        e.preventDefault();
        if (confirm(`Delete ${selectedRackIds.length} rack(s)?`)) {
          selectedRackIds.forEach((id) => deleteRack(id));
          setSelectedRackIds([]);
        }
        return;
      }

      // Ctrl+D — duplicate
      if (ctrl && e.key === 'd' && selectedRackIds.length > 0 && editMode) {
        e.preventDefault();
        const newIds = [];
        selectedRackIds.forEach((id) => {
          const dup = duplicateRack(id);
          if (dup) newIds.push(dup.id);
        });
        setSelectedRackIds(newIds);
        return;
      }

      // Ctrl+Z — undo
      if (ctrl && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl+Shift+Z or Ctrl+Y — redo
      if ((ctrl && e.shiftKey && e.key === 'z') || (ctrl && e.key === 'y')) {
        e.preventDefault();
        redo();
        return;
      }

      // Ctrl+A — select all
      if (ctrl && e.key === 'a') {
        e.preventDefault();
        setSelectedRackIds(areaRacks.map((r) => r.id));
        return;
      }

      // Escape — deselect
      if (e.key === 'Escape') {
        setSelectedRackIds([]);
        setContextMenu(null);
        closeNCPopup();
        return;
      }

      // R — rotate selected 90
      if (e.key === 'r' && selectedRackIds.length > 0 && editMode) {
        e.preventDefault();
        selectedRackIds.forEach((id) => {
          const rack = racks.find((r) => r.id === id);
          if (rack) {
            updateRack(id, { rotation: ((rack.rotation || 0) + 90) % 360 });
          }
        });
        return;
      }

      // Arrow keys — nudge
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedRackIds.length > 0 && editMode) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx =
          e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy =
          e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        selectedRackIds.forEach((id) => {
          const rack = racks.find((r) => r.id === id);
          if (rack) {
            updateRack(id, {
              position: {
                x: (rack.position?.x || 0) + dx,
                y: (rack.position?.y || 0) + dy,
              },
            });
          }
        });
        return;
      }

      // V — select tool
      if (e.key === 'v') {
        setActiveTool('select');
        return;
      }

      // H — pan/hand tool
      if (e.key === 'h') {
        setActiveTool('pan');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedRackIds,
    editMode,
    areaRacks,
    racks,
    deleteRack,
    duplicateRack,
    updateRack,
    undo,
    redo,
  ]);

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

  // --- Handlers ---
  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.1, 0.3));
  const handleResetZoom = () => setScale(1);
  const handleScaleChange = (newScale) => setScale(newScale);
  const handleMarkerScaleUp = () =>
    setMarkerScale((prev) => Math.min(prev + 0.25, 3));
  const handleMarkerScaleDown = () =>
    setMarkerScale((prev) => Math.max(prev - 0.25, 0.25));

  const handleBayClick = (rackId, bayId) => {
    // In edit+select mode, clicking a bay selects the rack instead of navigating
    if (editMode && activeTool === 'select') {
      setSelectedRackIds([rackId]);
      return;
    }
    navigate(
      `/inspection/${inspectionId}/area/${areaId}/rack/${rackId}/bay/${bayId}`
    );
  };

  const handleFrameClick = (rackId, frameId) => {
    if (editMode && activeTool === 'select') {
      setSelectedRackIds([rackId]);
      return;
    }
    navigate(
      `/inspection/${inspectionId}/area/${areaId}/rack/${rackId}/frame/${frameId}`
    );
  };

  const handleRackMove = (rackId, position) => {
    if (editMode) {
      updateRack(rackId, { position });
    }
  };

  const handleTransformEnd = (rackId, data) => {
    updateRack(rackId, {
      position: data.position,
      rotation: data.rotation,
    });
  };

  const handleNCDragEnd = useCallback(
    (ncId, pos) => {
      updateNC(ncId, { markerX: pos.x, markerY: pos.y });
    },
    [updateNC]
  );

  // --- NC marker interaction ---
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
    if (selectedNC) removeNC(selectedNC.id);
    closeNCPopup();
  };

  const handleEditNC = () => {
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

  // --- Context menu ---
  const handleContextMenu = useCallback((data) => {
    setContextMenu(data);
  }, []);

  const closeContextMenu = () => setContextMenu(null);

  const handleContextMenuAction = (action) => {
    if (!contextMenu) return;
    const { rackId } = contextMenu;

    switch (action) {
      case 'duplicate': {
        const dup = duplicateRack(rackId);
        if (dup) setSelectedRackIds([dup.id]);
        break;
      }
      case 'delete':
        if (confirm('Delete this rack?')) {
          deleteRack(rackId);
          setSelectedRackIds((ids) => ids.filter((id) => id !== rackId));
        }
        break;
      case 'rotate':
        {
          const rack = racks.find((r) => r.id === rackId);
          if (rack) {
            updateRack(rackId, {
              rotation: ((rack.rotation || 0) + 90) % 360,
            });
          }
        }
        break;
      case 'edit':
        navigate(
          `/inspection/${inspectionId}/area/${areaId}/rack/${rackId}`
        );
        break;
    }
    closeContextMenu();
  };

  // --- Alignment helpers ---
  const handleAlignRacks = (direction) => {
    if (selectedRacks.length < 2) return;
    const positions = selectedRacks.map((r) => r.position || { x: 0, y: 0 });

    let target;
    switch (direction) {
      case 'left':
        target = Math.min(...positions.map((p) => p.x));
        selectedRackIds.forEach((id) => {
          const r = racks.find((rk) => rk.id === id);
          if (r) updateRack(id, { position: { ...r.position, x: target } });
        });
        break;
      case 'right':
        target = Math.max(...positions.map((p) => p.x));
        selectedRackIds.forEach((id) => {
          const r = racks.find((rk) => rk.id === id);
          if (r) updateRack(id, { position: { ...r.position, x: target } });
        });
        break;
      case 'top':
        target = Math.min(...positions.map((p) => p.y));
        selectedRackIds.forEach((id) => {
          const r = racks.find((rk) => rk.id === id);
          if (r) updateRack(id, { position: { ...r.position, y: target } });
        });
        break;
      case 'bottom':
        target = Math.max(...positions.map((p) => p.y));
        selectedRackIds.forEach((id) => {
          const r = racks.find((rk) => rk.id === id);
          if (r) updateRack(id, { position: { ...r.position, y: target } });
        });
        break;
    }
  };

  const handleDistributeRacks = (direction) => {
    if (selectedRacks.length < 3) return;
    const sorted = [...selectedRacks].sort((a, b) =>
      direction === 'horizontal'
        ? (a.position?.x || 0) - (b.position?.x || 0)
        : (a.position?.y || 0) - (b.position?.y || 0)
    );

    const first =
      direction === 'horizontal'
        ? sorted[0].position?.x || 0
        : sorted[0].position?.y || 0;
    const last =
      direction === 'horizontal'
        ? sorted[sorted.length - 1].position?.x || 0
        : sorted[sorted.length - 1].position?.y || 0;
    const step = (last - first) / (sorted.length - 1);

    sorted.forEach((rack, i) => {
      const val = first + step * i;
      if (direction === 'horizontal') {
        updateRack(rack.id, {
          position: { ...rack.position, x: val },
        });
      } else {
        updateRack(rack.id, {
          position: { ...rack.position, y: val },
        });
      }
    });
  };

  const handleRotateRacks = (degrees) => {
    selectedRackIds.forEach((id) => {
      const rack = racks.find((r) => r.id === id);
      if (rack) {
        updateRack(id, {
          rotation: ((rack.rotation || 0) + degrees) % 360,
        });
      }
    });
  };

  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExportNCs = (format = 'csv') => {
    setShowExportMenu(false);
    const rows = buildExportRows({
      inspection,
      areas: [area],
      racks: areaRacks,
      nonConformities,
    });
    if (rows.length === 0) {
      alert('No non-conformities to export for this area.');
      return;
    }
    const date = new Date().toISOString().slice(0, 10);
    const customerSlug = (inspection.endCustomer || 'inspection').replace(/\s+/g, '-');
    const areaSlug = (area.name || 'area').replace(/\s+/g, '-');
    const baseName = `${customerSlug}-${areaSlug}-NCs-${date}`;

    if (format === 'csv') {
      const csv = rowsToCSV(rows);
      downloadFile(csv, `${baseName}.csv`);
    } else if (format === 'xlsx') {
      downloadXLSX(rows, `${baseName}.xlsx`);
    } else if (format === 'zip') {
      // Collect photos from NCs relevant to this area
      const areaRackIds = new Set(areaRacks.map((r) => r.id));
      const areaNCs = nonConformities.filter((nc) => areaRackIds.has(nc.rackId));
      const photos = areaNCs
        .filter((nc) => (Array.isArray(nc.photos) && nc.photos.length > 0) || nc.photo)
        .map((nc) => ({
          ncId: nc.id,
          photos: Array.isArray(nc.photos) ? nc.photos : nc.photo ? [nc.photo] : [],
        }));
      downloadZIPBundle(rows, photos, `${baseName}.zip`);
    }
  };

  const handleBack = () =>
    navigate(`/inspection/${inspectionId}/area/${areaId}/racks`);

  return (
    <div className="h-[calc(100vh-4rem)] bg-slate-950 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <CanvasToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        editMode={editMode}
        onEditModeToggle={() => setEditMode(!editMode)}
        scale={scale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        markerScale={markerScale}
        onMarkerScaleUp={handleMarkerScaleUp}
        onMarkerScaleDown={handleMarkerScaleDown}
        snapSize={snapSize}
        onSnapSizeChange={setSnapSize}
        canUndo={canUndo()}
        canRedo={canRedo()}
        onUndo={undo}
        onRedo={redo}
        onBack={handleBack}
        areaName={area.name}
        onExportNCs={handleExportNCs}
      />

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        <LayoutCanvas
          racks={areaRacks}
          editMode={editMode}
          scale={scale}
          activeTool={activeTool}
          onBayClick={handleBayClick}
          onFrameClick={handleFrameClick}
          onRackMove={handleRackMove}
          onScaleChange={handleScaleChange}
          ncData={ncDataByRack}
          selectedRackIds={selectedRackIds}
          onSelectionChange={setSelectedRackIds}
          supplierColors={supplierColors}
          markerScale={markerScale}
          onNCTap={handleNCTap}
          onNCLongPress={handleNCLongPress}
          onNCDragEnd={handleNCDragEnd}
          onTransformEnd={handleTransformEnd}
          snapSize={snapSize}
          onContextMenu={handleContextMenu}
        />

        {/* Properties Panel */}
        {showProperties && selectedRackIds.length > 0 && (
          <PropertiesPanel
            selectedRacks={selectedRacks}
            onUpdateRack={updateRack}
            onClose={() => {
              setShowProperties(false);
              setSelectedRackIds([]);
            }}
            onAlignRacks={handleAlignRacks}
            onDistributeRacks={handleDistributeRacks}
            onRotateRacks={handleRotateRacks}
          />
        )}

        {/* Context Menu */}
        {contextMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={closeContextMenu}
            />
            <div
              className="absolute z-50 bg-slate-900 border border-slate-600 rounded-xl shadow-2xl p-1 min-w-44"
              style={{
                left: contextMenu.x,
                top: contextMenu.y,
              }}
            >
              <button
                onClick={() => handleContextMenuAction('edit')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Pencil size={14} />
                Edit Properties
              </button>
              <button
                onClick={() => handleContextMenuAction('duplicate')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Copy size={14} />
                Duplicate
              </button>
              <button
                onClick={() => handleContextMenuAction('rotate')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <RotateCw size={14} />
                Rotate 90
              </button>
              <div className="border-t border-slate-700 my-1" />
              <button
                onClick={() => handleContextMenuAction('delete')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </>
        )}

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
