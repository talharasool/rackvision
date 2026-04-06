import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Minus, Plus, Link, Check, Ruler, ChevronDown, ChevronUp,
  Copy, ExternalLink, X, StickyNote,
} from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Select from '../ui/Select';
import useBeamDatabaseStore from '../../stores/beamDatabaseStore';
import useFrameDatabaseStore from '../../stores/frameDatabaseStore';
import useSupplierStore from '../../stores/supplierStore';
import useRackStore from '../../stores/rackStore';

export default function BayConfig({ rack, bay, bayIndex, onUpdate }) {
  const navigate = useNavigate();

  // Stores
  const suppliers = useSupplierStore((s) => s.suppliers);
  const getFilteredBeams = useBeamDatabaseStore((s) => s.getFilteredBeams);
  const getBeamById = useBeamDatabaseStore((s) => s.getBeamById);
  const allDbBeams = useBeamDatabaseStore((s) => s.beams);
  const getFilteredFrames = useFrameDatabaseStore((s) => s.getFilteredFrames);
  const getFrameById = useFrameDatabaseStore((s) => s.getFrameById);
  const allDbFrames = useFrameDatabaseStore((s) => s.frames);
  const updateBay = useRackStore((s) => s.updateBay);
  const duplicateBayConfig = useRackStore((s) => s.duplicateBayConfig);

  // Rack-level values
  const levels = rack?.levels || 3;
  const firstElevation = rack?.firstElevation || 0;
  const levelSpacing = rack?.levelSpacing || 1500;
  const individualHeights = rack?.individualHeights || [];
  const useIndividual =
    rack?.useIndividualHeights && individualHeights.length === levels;
  const levelBeams = rack?.levelBeams || [];
  const rackSupplierId = rack?.supplierId || '';

  // Bay config
  const bayConfig = bay?.bayConfig || { beamSelections: [], accessories: [], customLength: null, leftFrameDbId: '', rightFrameDbId: '' };

  // Local state
  const [editLevels, setEditLevels] = useState(levels);
  const [editInteraxis, setEditInteraxis] = useState([]);
  const [expandedLevel, setExpandedLevel] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(rackSupplierId);
  const [customLength, setCustomLength] = useState(bayConfig.customLength || rack?.bayLength || 2700);
  const [accessories, setAccessories] = useState(bayConfig.accessories || []);
  const [leftFrameDbId, setLeftFrameDbId] = useState(bayConfig.leftFrameDbId || '');
  const [rightFrameDbId, setRightFrameDbId] = useState(bayConfig.rightFrameDbId || '');
  const [duplicateTargets, setDuplicateTargets] = useState({});

  const bIndex = bayIndex ?? bay?.index ?? 0;

  // Compute elevations from rack data
  const elevations = useMemo(() => {
    const elev = [];
    for (let i = 0; i < levels; i++) {
      elev.push(
        useIndividual ? individualHeights[i] : firstElevation + levelSpacing * i
      );
    }
    return elev;
  }, [levels, firstElevation, levelSpacing, individualHeights, useIndividual]);

  // Convert elevations to interaxis (distance between consecutive levels)
  useEffect(() => {
    const inter = [];
    for (let i = 0; i < elevations.length; i++) {
      if (i === 0) {
        inter.push(elevations[0]); // First level: distance from ground
      } else {
        inter.push(elevations[i] - elevations[i - 1]);
      }
    }
    setEditInteraxis(inter);
    setEditLevels(levels);
  }, [elevations, levels]);

  // Sync supplier from rack
  useEffect(() => {
    setSelectedSupplier(rackSupplierId);
  }, [rackSupplierId]);

  // Sync bay config on bay change
  useEffect(() => {
    const bc = bay?.bayConfig || {};
    setCustomLength(bc.customLength || rack?.bayLength || 2700);
    setAccessories(bc.accessories || []);
    setLeftFrameDbId(bc.leftFrameDbId || '');
    setRightFrameDbId(bc.rightFrameDbId || '');
    setDuplicateTargets({});
  }, [bay?.id, rack?.bayLength]);

  // Active bay length for beam filtering
  const activeBayLength = customLength || rack?.bayLength || 2700;

  // Filtered beams from database (by supplier + length)
  const filteredBeams = useMemo(() => {
    return getFilteredBeams(selectedSupplier, activeBayLength);
  }, [selectedSupplier, activeBayLength, allDbBeams, getFilteredBeams]);

  // Compute top beam elevation for frame filtering
  const topBeamElevation = elevations.length > 0 ? elevations[elevations.length - 1] : 0;

  // Filtered frames from database
  const filteredFrames = useMemo(() => {
    return getFilteredFrames(selectedSupplier, rack?.frameDepth || 0, topBeamElevation);
  }, [selectedSupplier, rack?.frameDepth, topBeamElevation, allDbFrames, getFilteredFrames]);

  // Supplier options
  const supplierOptions = useMemo(() => [
    { value: '', label: 'All Suppliers' },
    ...suppliers.map((s) => ({ value: s.id, label: s.name })),
  ], [suppliers]);

  // ---- Handlers ----

  const handleSupplierChange = (e) => {
    const val = e.target.value;
    setSelectedSupplier(val);
    const supplier = suppliers.find((s) => s.id === val);
    onUpdate?.({
      supplierId: val,
      supplierName: supplier?.name || '',
    });
  };

  const handleCustomLengthChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val <= 0) return;
    setCustomLength(val);
    if (bay?.id && rack?.id) {
      updateBay(rack.id, bay.id, {
        bayConfig: { customLength: val },
      });
    }
  };

  // Get beam selection for a level from bay config
  const getLevelBeamSelection = (levelIndex) => {
    return bayConfig.beamSelections?.[levelIndex] || null;
  };

  // Get display beam for a level
  const getLevelBeamDisplay = (levelIndex) => {
    const sel = getLevelBeamSelection(levelIndex);
    if (sel?.beamDbId) {
      const dbBeam = getBeamById(sel.beamDbId);
      if (dbBeam) return dbBeam;
    }
    // Fallback: rack-level levelBeams (old format)
    const lb = levelBeams[levelIndex];
    if (lb?.beamId) {
      return { id: lb.beamId, name: lb.beamType || 'Custom', length: lb.bayLength };
    }
    return null;
  };

  const handleLevelBeamSelect = (levelIndex, dbBeam) => {
    const newSelections = [...(bayConfig.beamSelections || [])];
    while (newSelections.length <= levelIndex) {
      newSelections.push(null);
    }
    newSelections[levelIndex] = {
      beamId: dbBeam.id,
      beamDbId: dbBeam.id,
    };

    if (bay?.id && rack?.id) {
      updateBay(rack.id, bay.id, {
        bayConfig: { beamSelections: newSelections },
      });
    }

    // Also update the rack-level levelBeams for backward compatibility
    const newLevelBeams = [...levelBeams];
    while (newLevelBeams.length <= levelIndex) {
      newLevelBeams.push({ beamId: '', beamType: '', bayLength: activeBayLength });
    }
    newLevelBeams[levelIndex] = {
      beamId: dbBeam.id,
      beamType: dbBeam.beamType || 'standard-double-c',
      bayLength: dbBeam.length || activeBayLength,
    };
    onUpdate?.({ levelBeams: newLevelBeams });
  };

  const handleApplyBeamToAll = (dbBeam) => {
    // FIX: Only update the CURRENT bay's levels, not all bays
    const newSelections = Array.from({ length: levels }, () => ({
      beamId: dbBeam.id,
      beamDbId: dbBeam.id,
    }));

    if (bay?.id && rack?.id) {
      updateBay(rack.id, bay.id, {
        bayConfig: { beamSelections: newSelections },
      });
    }

    // Also update rack-level levelBeams for backward compat (current bay only)
    const newLevelBeams = Array.from({ length: levels }, () => ({
      beamId: dbBeam.id,
      beamType: dbBeam.beamType || 'standard-double-c',
      bayLength: dbBeam.length || activeBayLength,
    }));
    onUpdate?.({ levelBeams: newLevelBeams });
  };

  const handleLevelsChange = (delta) => {
    const newLevels = Math.max(1, Math.min(20, editLevels + delta));
    setEditLevels(newLevels);

    // Recompute elevations from interaxis
    const newInteraxis = [...editInteraxis];
    while (newInteraxis.length < newLevels) {
      newInteraxis.push(levelSpacing);
    }
    const trimmedInteraxis = newInteraxis.slice(0, newLevels);
    setEditInteraxis(trimmedInteraxis);

    // Convert interaxis to absolute elevations
    const newElevations = [];
    let cumulative = 0;
    for (let i = 0; i < newLevels; i++) {
      cumulative = i === 0 ? trimmedInteraxis[0] : cumulative + trimmedInteraxis[i];
      newElevations.push(cumulative);
    }

    // Extend levelBeams
    const newLevelBeams = [...levelBeams];
    while (newLevelBeams.length < newLevels) {
      newLevelBeams.push({ beamId: '', beamType: '', bayLength: activeBayLength });
    }

    onUpdate?.({
      levels: newLevels,
      individualHeights: newElevations,
      useIndividualHeights: true,
      levelBeams: newLevelBeams.slice(0, newLevels),
    });
  };

  const handleInteraxisChange = (index, value) => {
    const val = parseInt(value, 10) || 0;
    const newInteraxis = [...editInteraxis];
    newInteraxis[index] = val;
    setEditInteraxis(newInteraxis);

    // Convert to absolute elevations
    const newElevations = [];
    let cumulative = 0;
    for (let i = 0; i < newInteraxis.length; i++) {
      cumulative = i === 0 ? newInteraxis[0] : cumulative + newInteraxis[i];
      newElevations.push(cumulative);
    }

    onUpdate?.({
      individualHeights: newElevations,
      useIndividualHeights: true,
    });
  };

  // Compute "from ground" cumulative values
  const fromGround = useMemo(() => {
    const result = [];
    let cum = 0;
    for (let i = 0; i < editInteraxis.length; i++) {
      cum = i === 0 ? editInteraxis[0] : cum + editInteraxis[i];
      result.push(cum);
    }
    return result;
  }, [editInteraxis]);

  // Accessories
  const handleAddAccessory = () => {
    const newAcc = [...accessories, { name: '', notes: '' }];
    setAccessories(newAcc);
    if (bay?.id && rack?.id) {
      updateBay(rack.id, bay.id, { bayConfig: { accessories: newAcc } });
    }
  };

  const handleAccessoryChange = (index, field, value) => {
    const newAcc = [...accessories];
    newAcc[index] = { ...newAcc[index], [field]: value };
    setAccessories(newAcc);
    if (bay?.id && rack?.id) {
      updateBay(rack.id, bay.id, { bayConfig: { accessories: newAcc } });
    }
  };

  const handleRemoveAccessory = (index) => {
    const newAcc = accessories.filter((_, i) => i !== index);
    setAccessories(newAcc);
    if (bay?.id && rack?.id) {
      updateBay(rack.id, bay.id, { bayConfig: { accessories: newAcc } });
    }
  };

  // Frame selection
  const handleFrameSelect = (side, frameDbId) => {
    if (side === 'left') {
      setLeftFrameDbId(frameDbId);
    } else {
      setRightFrameDbId(frameDbId);
    }
    if (bay?.id && rack?.id) {
      updateBay(rack.id, bay.id, {
        bayConfig: {
          [side === 'left' ? 'leftFrameDbId' : 'rightFrameDbId']: frameDbId,
        },
      });
    }
  };

  // Duplicate config
  const handleToggleDuplicateTarget = (bayId) => {
    setDuplicateTargets((prev) => ({
      ...prev,
      [bayId]: !prev[bayId],
    }));
  };

  const handleDuplicate = () => {
    const targetIds = Object.keys(duplicateTargets).filter((k) => duplicateTargets[k]);
    if (targetIds.length === 0 || !bay?.id || !rack?.id) return;
    duplicateBayConfig(rack.id, bay.id, targetIds);
    setDuplicateTargets({});
  };

  // Frame display name helper
  const getFrameDisplayName = (frameDbId) => {
    if (!frameDbId) return 'None selected';
    const frame = getFrameById(frameDbId);
    return frame ? frame.name : 'Unknown frame';
  };

  // Frame options for select
  const frameOptions = useMemo(() => [
    { value: '', label: 'Select frame...' },
    ...filteredFrames.map((f) => ({ value: f.id, label: f.name })),
  ], [filteredFrames]);

  return (
    <div className="flex flex-col gap-4">
      {/* Bay Information */}
      <Card className="!p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Bay Information</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <p className="text-slate-400">Bay Number</p>
            <p className="text-white font-medium">{bIndex + 1}</p>
          </div>
          <div>
            <p className="text-slate-400">Rack</p>
            <p className="text-white font-medium">{rack?.name || '-'}</p>
          </div>
          <div className="col-span-2">
            <Select
              label="Supplier"
              value={selectedSupplier}
              onChange={handleSupplierChange}
              options={supplierOptions}
            />
          </div>
          <div className="col-span-2">
            <Input
              label="Bay Length (mm)"
              type="number"
              value={customLength}
              onChange={handleCustomLengthChange}
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Filters available beams by length
            </p>
          </div>
        </div>
      </Card>

      {/* Beam Configuration */}
      <Card className="!p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Ruler size={14} className="text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Beam Configuration</h3>
          </div>
          <span className="text-xs text-slate-500">{levels} level{levels !== 1 ? 's' : ''}</span>
        </div>

        {filteredBeams.length === 0 && (
          <div className="text-xs text-slate-500 mb-2 px-2 py-1.5 rounded bg-slate-800/50 border border-slate-700">
            No beams match current supplier/length filters.
            {' '}
            <button
              onClick={() => navigate('/editors/beams')}
              className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
            >
              Add beam <ExternalLink size={10} />
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {Array.from({ length: editLevels }, (_, i) => {
            const beam = getLevelBeamDisplay(i);
            const isExpanded = expandedLevel === i;
            const displayName = beam?.name || 'Not configured';
            const displayLength = beam?.length || activeBayLength;

            return (
              <div key={i} className="rounded-lg border border-slate-700 overflow-hidden">
                {/* Level header */}
                <button
                  onClick={() => setExpandedLevel(isExpanded ? null : i)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-800/70 hover:bg-slate-800 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded">
                      L{i + 1}
                    </span>
                    <div>
                      <span className="text-sm text-white font-medium">
                        {displayName}
                      </span>
                      <span className="text-xs text-slate-500 ml-2">
                        {displayLength} mm
                      </span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={14} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={14} className="text-slate-400" />
                  )}
                </button>

                {/* Expanded panel */}
                {isExpanded && (
                  <div className="p-3 bg-slate-900/50 border-t border-slate-700">
                    {/* Beam list from database */}
                    <p className="text-xs text-slate-500 mb-2">
                      Available beams ({filteredBeams.length}):
                    </p>
                    <div className="flex flex-col gap-1 max-h-[180px] overflow-y-auto pr-1 mb-2">
                      {filteredBeams.map((b) => {
                        const sel = getLevelBeamSelection(i);
                        const isActive = sel?.beamDbId === b.id;
                        return (
                          <button
                            key={b.id}
                            onClick={() => handleLevelBeamSelect(i, b)}
                            className={`
                              w-full flex items-center justify-between px-2.5 py-1.5 rounded border text-left text-xs
                              transition-all duration-150
                              ${isActive
                                ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                : 'border-slate-700 bg-slate-800/40 text-slate-300 hover:border-slate-500'}
                            `}
                          >
                            <span className="font-medium truncate mr-2">{b.name}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-slate-500">{b.length} mm</span>
                              {isActive && <Check size={12} className="text-blue-400" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* New Beam link */}
                    <button
                      onClick={() => navigate('/editors/beams')}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mb-3"
                    >
                      <Plus size={12} /> New Beam <ExternalLink size={10} />
                    </button>

                    {/* Apply to all levels */}
                    {beam && (
                      <button
                        onClick={() => handleApplyBeamToAll(beam)}
                        className="w-full text-xs text-center text-blue-400 hover:text-blue-300 py-1.5 rounded border border-blue-500/30 hover:border-blue-500/60 transition-colors mb-3"
                      >
                        Apply "{beam.name}" to all levels (this bay only)
                      </button>
                    )}

                    {/* Per-level accessories */}
                    <div className="border-t border-slate-700 pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <StickyNote size={10} /> Level {i + 1} Accessories
                        </span>
                      </div>
                      {/* Accessories are per-bay, shown contextually in each level for convenience */}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Frame Selection */}
      <Card className="!p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Frame Selection</h3>
          <button
            onClick={() => navigate('/editors/frames')}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <Plus size={12} /> New Frame <ExternalLink size={10} />
          </button>
        </div>

        {filteredFrames.length === 0 && (
          <div className="text-xs text-slate-500 mb-3 px-2 py-1.5 rounded bg-slate-800/50 border border-slate-700">
            No frames match current filters (supplier, depth {rack?.frameDepth || 0} mm, min height {topBeamElevation} mm).
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Select
              label="Left Frame"
              value={leftFrameDbId}
              onChange={(e) => handleFrameSelect('left', e.target.value)}
              options={frameOptions}
              placeholder="Select frame..."
            />
            {leftFrameDbId && (
              <p className="text-[10px] text-slate-500 mt-1 truncate">
                {getFrameDisplayName(leftFrameDbId)}
              </p>
            )}
          </div>
          <div>
            <Select
              label="Right Frame"
              value={rightFrameDbId}
              onChange={(e) => handleFrameSelect('right', e.target.value)}
              options={frameOptions}
              placeholder="Select frame..."
            />
            {rightFrameDbId && (
              <p className="text-[10px] text-slate-500 mt-1 truncate">
                {getFrameDisplayName(rightFrameDbId)}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Levels & Elevations (interaxis) */}
      <Card className="!p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Levels & Elevations</h3>
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm text-slate-400 w-28">Number of Levels</label>
          <Button variant="secondary" size="sm" icon={Minus} onClick={() => handleLevelsChange(-1)} disabled={editLevels <= 1} />
          <span className="text-lg font-bold text-white w-8 text-center">{editLevels}</span>
          <Button variant="secondary" size="sm" icon={Plus} onClick={() => handleLevelsChange(1)} disabled={editLevels >= 20} />
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-3 mb-2 text-[10px] text-slate-500 uppercase tracking-wider">
          <span className="w-14 shrink-0">Level</span>
          <span className="flex-1">Interaxis (mm)</span>
          <span className="w-24 shrink-0 text-right">From ground</span>
        </div>

        <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
          {editInteraxis.map((inter, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-14 shrink-0">
                {i === 0 ? 'L1 (1st)' : `L${i + 1}`}
              </span>
              <Input
                type="number"
                value={inter}
                onChange={(e) => handleInteraxisChange(i, e.target.value)}
                className="flex-1"
              />
              <span className="text-xs text-slate-500 w-24 shrink-0 text-right font-mono">
                {fromGround[i]} mm
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Per-Bay Accessories */}
      <Card className="!p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Accessories</h3>
          <Button variant="ghost" size="sm" icon={Plus} onClick={handleAddAccessory}>
            Add
          </Button>
        </div>

        {accessories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <StickyNote size={24} className="text-slate-600 mb-2" />
            <p className="text-sm text-slate-500">No accessories added</p>
            <p className="text-[10px] text-slate-600 mt-1">
              Click "Add" to add accessories to this bay
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {accessories.map((acc, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700">
                <div className="flex-1 flex flex-col gap-1.5">
                  <input
                    type="text"
                    placeholder="Accessory name"
                    value={acc.name}
                    onChange={(e) => handleAccessoryChange(i, 'name', e.target.value)}
                    className="w-full rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 bg-slate-800 border border-slate-600 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Notes (optional)"
                    value={acc.notes}
                    onChange={(e) => handleAccessoryChange(i, 'notes', e.target.value)}
                    className="w-full rounded px-2 py-1.5 text-xs text-slate-300 placeholder-slate-500 bg-slate-800 border border-slate-600 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={() => handleRemoveAccessory(i)}
                  className="mt-1 p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-red-400 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Duplicate Configuration */}
      {rack?.bays && rack.bays.length > 1 && (
        <Card className="!p-4">
          <div className="flex items-center gap-2 mb-3">
            <Copy size={14} className="text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Duplicate Configuration</h3>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Copy this bay's beam and accessory configuration to other bays:
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {rack.bays.map((otherBay) => {
              if (otherBay.id === bay?.id) return null;
              const isSelected = !!duplicateTargets[otherBay.id];
              return (
                <button
                  key={otherBay.id}
                  onClick={() => handleToggleDuplicateTarget(otherBay.id)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150
                    ${isSelected
                      ? 'border-blue-500 bg-blue-500/15 text-blue-400'
                      : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-500'}
                  `}
                >
                  {isSelected && <Check size={10} className="inline mr-1" />}
                  {otherBay.name || `Bay ${otherBay.index + 1}`}
                </button>
              );
            })}
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={Copy}
            onClick={handleDuplicate}
            disabled={Object.values(duplicateTargets).filter(Boolean).length === 0}
          >
            Duplicate to Selected
          </Button>
        </Card>
      )}
    </div>
  );
}
