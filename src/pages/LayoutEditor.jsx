import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  X,
  Pencil,
  Trash2,
  Copy,
  RotateCw,
  Download,
  AlertTriangle,
  Eraser,
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
import { exportLayoutPDF } from '../utils/exportLayoutPDF';

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
  const { t } = useTranslation();
  const { inspectionId, areaId } = useParams();
  const navigate = useNavigate();
  const { inspections } = useInspectionStore();
  const { racks, updateRack, deleteRack, duplicateRack, undo, redo, canUndo, canRedo } =
    useRackStore();
  const { nonConformities, removeNC, updateNC } = useNCStore();
  const { suppliers } = useSupplierStore();

  // Persist editor preferences across sessions
  const savedPrefs = useRef(() => {
    try {
      return JSON.parse(localStorage.getItem('rackvision-editor-prefs') || '{}');
    } catch { return {}; }
  });
  const prefs = savedPrefs.current();
  const persistPref = (key, value) => {
    try {
      const current = JSON.parse(localStorage.getItem('rackvision-editor-prefs') || '{}');
      current[key] = value;
      localStorage.setItem('rackvision-editor-prefs', JSON.stringify(current));
    } catch { /* ignore */ }
  };

  // Doc 5 §11: Restore canvas pan position per area
  const savedCanvasPos = prefs.canvasPositions?.[areaId] || null;

  const [editMode, setEditMode] = useState(false);
  const [scale, setScale] = useState(prefs.scale ?? 1);
  const [markerScale, setMarkerScale] = useState(prefs.markerScale ?? 1);
  const [labelFontSize, setLabelFontSize] = useState(prefs.labelFontSize ?? 1);
  const [activeTool, setActiveTool] = useState('select');
  const [selectedRackIds, setSelectedRackIds] = useState([]);
  const [snapSize, setSnapSize] = useState(prefs.snapSize ?? 0);
  const [showProperties, setShowProperties] = useState(false);

  // NC popup state
  const [selectedNC, setSelectedNC] = useState(null);
  const [ncPopupMode, setNCPopupMode] = useState(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState(null);

  // Delete confirmation modal
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Ref to the LayoutCanvas wrapper — exposes the Konva stage via getStage()
  // for Layout PDF export (Doc 1 §5.9).
  const canvasRef = useRef(null);

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

      // Delete / Backspace — delete selected (show confirmation modal)
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedRackIds.length > 0 &&
        editMode
      ) {
        e.preventDefault();
        if (selectedRackIds.length === 1) {
          // Single rack — show detailed modal
          const rack = racks.find((r) => r.id === selectedRackIds[0]);
          const rackNCs = nonConformities.filter((nc) => nc.rackId === selectedRackIds[0]);
          setDeleteConfirm({
            rackId: selectedRackIds[0],
            rackName: rack?.name || t('layout.unnamed_rack'),
            bayCount: rack?.bays?.length || 0,
            frameCount: rack?.frames?.length || 0,
            ncCount: rackNCs.length,
          });
        } else {
          // Multi-rack — show count-based modal
          const totalNCs = nonConformities.filter((nc) => selectedRackIds.includes(nc.rackId)).length;
          setDeleteConfirm({
            rackId: '__multi__',
            rackIds: [...selectedRackIds],
            rackName: `${selectedRackIds.length} racks`,
            bayCount: selectedRackIds.reduce((sum, id) => {
              const r = racks.find((rk) => rk.id === id);
              return sum + (r?.bays?.length || 0);
            }, 0),
            frameCount: selectedRackIds.reduce((sum, id) => {
              const r = racks.find((rk) => rk.id === id);
              return sum + (r?.frames?.length || 0);
            }, 0),
            ncCount: totalNCs,
          });
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

      // F — flip front side (Doc 4 §2.1c): toggle which edge shows frame
      // numbers + rack name. 'top' <-> 'bottom'.
      if (e.key === 'f' && selectedRackIds.length > 0 && editMode) {
        e.preventDefault();
        selectedRackIds.forEach((id) => {
          const rack = racks.find((r) => r.id === id);
          if (rack) {
            updateRack(id, {
              frontSide: (rack.frontSide || 'top') === 'top' ? 'bottom' : 'top',
            });
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
          <p className="text-slate-400 mb-4">{t('layout.layout_not_found')}</p>
          <Button onClick={() => navigate('/')}>{t('common.go_home')}</Button>
        </div>
      </div>
    );
  }

  // --- Handlers ---
  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.1, 0.3));
  const handleResetZoom = () => setScale(1);
  const handleScaleChange = (newScale) => { setScale(newScale); persistPref('scale', newScale); };
  const handleMarkerScaleUp = () =>
    setMarkerScale((prev) => { const v = Math.min(prev + 0.25, 3); persistPref('markerScale', v); return v; });
  const handleMarkerScaleDown = () =>
    setMarkerScale((prev) => { const v = Math.max(prev - 0.25, 0.25); persistPref('markerScale', v); return v; });
  const handleLabelFontSizeUp = () =>
    setLabelFontSize((prev) => { const v = Math.min(prev + 0.25, 3); persistPref('labelFontSize', v); return v; });
  const handleLabelFontSizeDown = () =>
    setLabelFontSize((prev) => { const v = Math.max(prev - 0.25, 0.5); persistPref('labelFontSize', v); return v; });

  // Doc 5 §11: Persist canvas position per area
  const handleStagePosChange = useCallback((pos) => {
    try {
      const current = JSON.parse(localStorage.getItem('rackvision-editor-prefs') || '{}');
      if (!current.canvasPositions) current.canvasPositions = {};
      current.canvasPositions[areaId] = pos;
      localStorage.setItem('rackvision-editor-prefs', JSON.stringify(current));
    } catch { /* ignore */ }
  }, [areaId]);

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
      case 'delete': {
        const rack = racks.find((r) => r.id === rackId);
        const rackNCs = nonConformities.filter((nc) => nc.rackId === rackId);
        setDeleteConfirm({
          rackId,
          rackName: rack?.name || t('layout.unnamed_rack'),
          bayCount: rack?.bays?.length || 0,
          frameCount: rack?.frames?.length || 0,
          ncCount: rackNCs.length,
        });
        break;
      }
      case 'clearNCs': {
        const rackNCs = nonConformities.filter((nc) => nc.rackId === rackId);
        if (rackNCs.length === 0) break;
        rackNCs.forEach((nc) => removeNC(nc.id));
        break;
      }
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
        setSelectedRackIds([rackId]);
        setShowProperties(true);
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
      alert(t('layout.no_ncs_to_export_area'));
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

  const handleExportLayoutPDF = () => {
    const stage = canvasRef.current?.getStage?.();
    if (!stage) {
      alert(t('layout.layout_canvas_not_ready'));
      return;
    }
    if (areaRacks.length === 0) {
      alert(t('layout.no_racks_to_export'));
      return;
    }
    // Briefly clear selection so selection outlines don't appear in the PDF.
    const prevSelection = selectedRackIds;
    setSelectedRackIds([]);
    // Defer to next frame so React commits the cleared selection before snapshot.
    requestAnimationFrame(() => {
      try {
        exportLayoutPDF({
          stage,
          inspection,
          area,
          racks: areaRacks,
          nonConformities,
          suppliers,
        });
      } catch (err) {
        console.error('Layout PDF export failed', err);
        alert(t('layout.layout_pdf_export_failed', { error: err.message || err }));
      } finally {
        setSelectedRackIds(prevSelection);
      }
    });
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
        labelFontSize={labelFontSize}
        onLabelFontSizeUp={handleLabelFontSizeUp}
        onLabelFontSizeDown={handleLabelFontSizeDown}
        snapSize={snapSize}
        onSnapSizeChange={(v) => { setSnapSize(v); persistPref('snapSize', v); }}
        canUndo={canUndo()}
        canRedo={canRedo()}
        onUndo={undo}
        onRedo={redo}
        onBack={handleBack}
        areaName={area.name}
        onExportNCs={handleExportNCs}
        onExportLayoutPDF={handleExportLayoutPDF}
      />

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        <LayoutCanvas
          ref={canvasRef}
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
          labelFontSize={labelFontSize}
          onNCTap={handleNCTap}
          onNCLongPress={handleNCLongPress}
          onNCDragEnd={handleNCDragEnd}
          onTransformEnd={handleTransformEnd}
          snapSize={snapSize}
          onContextMenu={handleContextMenu}
          initialStagePos={savedCanvasPos}
          onStagePosChange={handleStagePosChange}
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
        {contextMenu && (() => {
          const cmRack = racks.find((r) => r.id === contextMenu.rackId);
          const cmLevels = cmRack?.levels ?? 3;
          const cmBays = cmRack?.bays?.length ?? cmRack?.numberOfBays ?? 0;
          const cmFrames = cmRack?.frames?.length ?? 0;
          return (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={closeContextMenu}
              />
              <div
                className="absolute z-50 bg-slate-900 border border-slate-600 rounded-xl shadow-2xl p-1 min-w-52"
                style={{
                  left: contextMenu.x,
                  top: contextMenu.y,
                }}
              >
                {/* Rack info header */}
                {cmRack && (
                  <div className="px-3 py-2 border-b border-slate-700 mb-1">
                    <p className="text-sm font-semibold text-white truncate">
                      {cmRack.name || t('layout.unnamed_rack')}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {t('layout.delete_bay_count', { n: cmBays })} · {t('layout.delete_frame_count', { n: cmFrames })} · {cmLevels} level{cmLevels !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => handleContextMenuAction('edit')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Pencil size={14} />
                  {t('layout.edit_properties')}
                </button>
                <button
                  onClick={() => handleContextMenuAction('duplicate')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Copy size={14} />
                  {t('layout.duplicate')}
                </button>
                <button
                  onClick={() => handleContextMenuAction('rotate')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <RotateCw size={14} />
                  {t('layout.rotate_90')}
                </button>
                {(() => {
                  const ncCount = nonConformities.filter((nc) => nc.rackId === contextMenu.rackId).length;
                  return ncCount > 0 ? (
                    <>
                      <div className="border-t border-slate-700 my-1" />
                      <button
                        onClick={() => handleContextMenuAction('clearNCs')}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                      >
                        <Eraser size={14} />
                        {t('layout.clear_n_ncs', { n: ncCount })}
                      </button>
                    </>
                  ) : null;
                })()}
                <div className="border-t border-slate-700 my-1" />
                <button
                  onClick={() => handleContextMenuAction('delete')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                  {t('layout.delete_rack')}
                </button>
              </div>
            </>
          );
        })()}

        {/* Supplier Color Legend */}
        {activeSuppliers.length > 0 && (
          <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-700 rounded-lg p-3 backdrop-blur-sm max-w-56">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              {t('layout.suppliers_legend_title')}
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
                {t('layout.nc_popup_title')}
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
                <span className="text-slate-400">{t('layout.nc_popup_type_label')}</span>
                <span className="text-slate-200">
                  {getNCTypeName(selectedNC.ncTypeId)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('layout.nc_popup_severity_label')}</span>
                <SeverityBadge severity={selectedNC.severity} />
              </div>
              {selectedNC.elementType && (
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('layout.nc_popup_element_label')}</span>
                  <span className="text-slate-200 capitalize">
                    {selectedNC.elementType}
                  </span>
                </div>
              )}
              {selectedNC.face && (
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('layout.nc_popup_face_label')}</span>
                  <span className="text-slate-200 uppercase">
                    {selectedNC.face}
                  </span>
                </div>
              )}
              {selectedNC.quantity > 1 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('layout.nc_popup_quantity_label')}</span>
                  <span className="text-slate-200">{selectedNC.quantity}</span>
                </div>
              )}
              {selectedNC.notes && (
                <div>
                  <span className="text-slate-400 block mb-1">{t('layout.nc_popup_notes_label')}</span>
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
                {t('layout.nc_popup_edit_button')}
              </button>
              <button
                onClick={closeNCPopup}
                className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium rounded-lg transition-colors"
              >
                {t('layout.nc_popup_close_button')}
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
              {t('layout.nc_actions_edit')}
            </button>
            <button
              onClick={handleDeleteNC}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 size={14} />
              {t('layout.nc_actions_delete')}
            </button>
            <div className="border-t border-slate-700 mt-1 pt-1">
              <button
                onClick={closeNCPopup}
                className="w-full px-3 py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                {t('common.cancel')}
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

        {/* Delete Rack Confirmation Modal */}
        {deleteConfirm && (
          <>
            <div
              className="fixed inset-0 z-[60] bg-black/60"
              onClick={() => setDeleteConfirm(null)}
            />
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-600 rounded-2xl shadow-2xl p-5 max-w-sm w-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-full bg-red-500/15">
                    <AlertTriangle size={20} className="text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">{t('layout.delete_rack_title')}</h3>
                    <p className="text-xs text-slate-400">{deleteConfirm.rackName}</p>
                  </div>
                </div>

                <div className="bg-slate-800/60 rounded-lg p-3 mb-4 text-sm text-slate-300">
                  <p className="mb-2">{t('layout.delete_rack_body')}</p>
                  <ul className="space-y-1 text-xs text-slate-400">
                    <li>- {t('layout.delete_bay_count', { n: deleteConfirm.bayCount })}</li>
                    <li>- {t('layout.delete_frame_count', { n: deleteConfirm.frameCount })}</li>
                    {deleteConfirm.ncCount > 0 && (
                      <li className="text-red-400 font-medium">
                        - {t('layout.delete_nc_count_with_warning', { n: deleteConfirm.ncCount })}
                      </li>
                    )}
                  </ul>
                </div>

                {deleteConfirm.ncCount > 0 && (
                  <button
                    onClick={() => {
                      const ids = deleteConfirm.rackIds || [deleteConfirm.rackId];
                      const rackNCs = nonConformities.filter((nc) => ids.includes(nc.rackId));
                      rackNCs.forEach((nc) => removeNC(nc.id));
                      setDeleteConfirm(null);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mb-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 text-sm font-medium rounded-lg border border-amber-500/30 transition-colors"
                  >
                    <Eraser size={14} />
                    {t('layout.clear_ncs_only')}
                  </button>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium rounded-lg transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={() => {
                      if (deleteConfirm.rackIds) {
                        deleteConfirm.rackIds.forEach((id) => deleteRack(id));
                        setSelectedRackIds([]);
                      } else {
                        deleteRack(deleteConfirm.rackId);
                        setSelectedRackIds((ids) => ids.filter((id) => id !== deleteConfirm.rackId));
                      }
                      setDeleteConfirm(null);
                    }}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {t('common.delete_everything')}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
