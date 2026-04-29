import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import useAccessoryDatabaseStore from '../../stores/accessoryDatabaseStore';
import useSupplierStore from '../../stores/supplierStore';
import useRackStore from '../../stores/rackStore';

export default function BayConfig({ rack, bay, bayIndex }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Stores
  const suppliers = useSupplierStore((s) => s.suppliers);
  const getFilteredBeams = useBeamDatabaseStore((s) => s.getFilteredBeams);
  const getBeamById = useBeamDatabaseStore((s) => s.getBeamById);
  const allDbBeams = useBeamDatabaseStore((s) => s.beams);
  const getFilteredFrames = useFrameDatabaseStore((s) => s.getFilteredFrames);
  const getFrameById = useFrameDatabaseStore((s) => s.getFrameById);
  const allDbFrames = useFrameDatabaseStore((s) => s.frames);
  const getFilteredAccessories = useAccessoryDatabaseStore((s) => s.getFilteredAccessories);
  const getAccessoryById = useAccessoryDatabaseStore((s) => s.getAccessoryById);
  const allDbAccessories = useAccessoryDatabaseStore((s) => s.accessories);
  const updateBay = useRackStore((s) => s.updateBay);
  const updateRack = useRackStore((s) => s.updateRack);
  const duplicateBayConfig = useRackStore((s) => s.duplicateBayConfig);

  // Bay config — each bay can independently override levels / elevations.
  // Falls back to rack-level values when the bay has no override set.
  const bayConfig = bay?.bayConfig || { beamSelections: [], accessories: [], customLength: null, leftFrameDbId: '', rightFrameDbId: '' };

  // Per-bay level configuration with rack-level fallback (Doc 1 §3.1.1 —
  // each bay edits independently so changing one bay does not affect others).
  const levels = bayConfig.levels ?? rack?.levels ?? 3;
  const firstElevation = bayConfig.firstElevation ?? rack?.firstElevation ?? 0;
  const levelSpacing = bayConfig.levelSpacing ?? rack?.levelSpacing ?? 1500;
  const individualHeights = bayConfig.individualHeights ?? rack?.individualHeights ?? [];
  const useIndividual =
    (bayConfig.useIndividualHeights ?? rack?.useIndividualHeights) &&
    individualHeights.length === levels;
  const levelBeams = rack?.levelBeams || [];
  const rackSupplierId = rack?.supplierId || '';

  // Local state
  const [editLevels, setEditLevels] = useState(levels);
  const [editInteraxis, setEditInteraxis] = useState([]);
  const [expandedLevel, setExpandedLevel] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(rackSupplierId);
  const [customLength, setCustomLength] = useState(bayConfig.customLength || rack?.bayLength || 2700);
  const [accessories, setAccessories] = useState(bayConfig.accessories || []);
  const [levelAccessories, setLevelAccessories] = useState(bayConfig.levelAccessories || {});
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
  }, [elevations, levels, bay?.id]);

  // Sync supplier from rack
  useEffect(() => {
    setSelectedSupplier(rackSupplierId);
  }, [rackSupplierId]);

  // Sync bay config on bay change
  useEffect(() => {
    const bc = bay?.bayConfig || {};
    setCustomLength(bc.customLength || rack?.bayLength || 2700);
    setAccessories(bc.accessories || []);
    setLevelAccessories(bc.levelAccessories || {});
    setLeftFrameDbId(bc.leftFrameDbId || '');
    setRightFrameDbId(bc.rightFrameDbId || '');
    setDuplicateTargets({});
  }, [bay?.id, rack?.bayLength]);

  // Active bay length for beam length proximity / display only
  const activeBayLength = customLength || rack?.bayLength || 2700;

  // All beams for the selected supplier, sorted by closeness to current bay length
  // (exact matches first, then nearest). Selecting a beam auto-syncs bay length.
  const filteredBeams = useMemo(() => {
    const list = getFilteredBeams(selectedSupplier);
    return [...list].sort(
      (a, b) =>
        Math.abs((a.length || 0) - activeBayLength) -
        Math.abs((b.length || 0) - activeBayLength)
    );
  }, [selectedSupplier, activeBayLength, allDbBeams, getFilteredBeams]);

  // Top beam elevation — for display indicator on frames, not filtering
  const topBeamElevation = elevations.length > 0 ? elevations[elevations.length - 1] : 0;
  const rackFrameDepth = rack?.frameDepth || 0;

  // All frames for the selected supplier, sorted by depth match then height match
  const filteredFrames = useMemo(() => {
    const list = getFilteredFrames(selectedSupplier);
    return [...list].sort((a, b) => {
      const depthDiffA = Math.abs((a.depth || 0) - rackFrameDepth);
      const depthDiffB = Math.abs((b.depth || 0) - rackFrameDepth);
      if (depthDiffA !== depthDiffB) return depthDiffA - depthDiffB;
      const heightFitA = (a.height || 0) >= topBeamElevation ? 0 : 1;
      const heightFitB = (b.height || 0) >= topBeamElevation ? 0 : 1;
      return heightFitA - heightFitB;
    });
  }, [selectedSupplier, rackFrameDepth, topBeamElevation, allDbFrames, getFilteredFrames]);

  // Accessories from the database, filtered by supplier
  const filteredDbAccessories = useMemo(() => {
    return getFilteredAccessories(selectedSupplier);
  }, [selectedSupplier, allDbAccessories, getFilteredAccessories]);

  // ---- Handlers ----

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

  // Selecting a beam drives the bay length: a bay's width = its beams' length.
  // If the chosen beam's length differs from the current bay length, sync them.
  const syncBayLengthToBeam = (dbBeam, baseBayConfigPatch) => {
    const beamLen = dbBeam.length || 0;
    const patch = { ...baseBayConfigPatch };
    if (beamLen > 0 && beamLen !== activeBayLength) {
      patch.customLength = beamLen;
      setCustomLength(beamLen);
    }
    return patch;
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
        bayConfig: syncBayLengthToBeam(dbBeam, { beamSelections: newSelections }),
      });
    }
  };

  const handleApplyBeamToAll = (dbBeam) => {
    // FIX: Only update the CURRENT bay's levels, not all bays
    const newSelections = Array.from({ length: levels }, () => ({
      beamId: dbBeam.id,
      beamDbId: dbBeam.id,
    }));

    if (bay?.id && rack?.id) {
      updateBay(rack.id, bay.id, {
        bayConfig: syncBayLengthToBeam(dbBeam, { beamSelections: newSelections }),
      });
    }
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

    // Trim / extend this bay's beam selections to match the new level count
    const prevSelections = bayConfig.beamSelections || [];
    const newSelections = [...prevSelections];
    while (newSelections.length < newLevels) newSelections.push(null);

    // Per-bay write — never touches the rack, so other bays keep their own levels
    if (bay?.id && rack?.id) {
      updateBay(rack.id, bay.id, {
        bayConfig: {
          levels: newLevels,
          individualHeights: newElevations,
          useIndividualHeights: true,
          beamSelections: newSelections.slice(0, newLevels),
        },
      });
    }
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

    // Per-bay write — only this bay's elevations change
    if (bay?.id && rack?.id) {
      updateBay(rack.id, bay.id, {
        bayConfig: {
          individualHeights: newElevations,
          useIndividualHeights: true,
        },
      });
    }
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

  // Per-level accessory handlers
  const getLevelAccessories = (levelIndex) => levelAccessories[levelIndex] || [];

  const handleAddLevelAccessoryFromDb = (levelIndex, dbAcc) => {
    const current = getLevelAccessories(levelIndex);
    if (current.some((a) => a.dbAccessoryId === dbAcc.id)) return;
    const updated = { ...levelAccessories, [levelIndex]: [...current, { name: dbAcc.name, notes: dbAcc.description || '', dbAccessoryId: dbAcc.id, category: dbAcc.category }] };
    setLevelAccessories(updated);
    if (bay?.id && rack?.id) {
      updateBay(rack.id, bay.id, { bayConfig: { levelAccessories: updated } });
    }
  };

  const handleAddLevelAccessoryCustom = (levelIndex) => {
    const current = getLevelAccessories(levelIndex);
    const updated = { ...levelAccessories, [levelIndex]: [...current, { name: '', notes: '', category: 'other' }] };
    setLevelAccessories(updated);
    if (bay?.id && rack?.id) {
      updateBay(rack.id, bay.id, { bayConfig: { levelAccessories: updated } });
    }
  };

  const handleLevelAccessoryChange = (levelIndex, accIndex, field, value) => {
    const current = [...getLevelAccessories(levelIndex)];
    current[accIndex] = { ...current[accIndex], [field]: value };
    const updated = { ...levelAccessories, [levelIndex]: current };
    setLevelAccessories(updated);
    if (bay?.id && rack?.id) {
      updateBay(rack.id, bay.id, { bayConfig: { levelAccessories: updated } });
    }
  };

  const handleRemoveLevelAccessory = (levelIndex, accIndex) => {
    const current = getLevelAccessories(levelIndex).filter((_, i) => i !== accIndex);
    const updated = { ...levelAccessories, [levelIndex]: current };
    setLevelAccessories(updated);
    if (bay?.id && rack?.id) {
      updateBay(rack.id, bay.id, { bayConfig: { levelAccessories: updated } });
    }
  };

  // Frame selection. Selecting a frame whose depth differs from the current
  // rack frame depth syncs rack.frameDepth to the chosen frame's depth.
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
    // Frame depth is a rack-wide property — update at rack level directly.
    const frame = getFrameById(frameDbId);
    if (frame && frame.depth && frame.depth !== rackFrameDepth && rack?.id) {
      updateRack(rack.id, { frameDepth: frame.depth });
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
    if (!frameDbId) return t('bay.none_selected');
    const frame = getFrameById(frameDbId);
    return frame ? frame.name : 'Unknown frame';
  };

  // Frame options for select — show depth/height inline so the user can
  // see whether the frame matches the rack's depth and top beam elevation.
  const frameOptions = useMemo(() => [
    { value: '', label: t('bay.select_frame_placeholder') },
    ...filteredFrames.map((f) => {
      const depthMark = (f.depth || 0) === rackFrameDepth ? '' : ' ⚠';
      const heightMark = (f.height || 0) >= topBeamElevation ? '' : ' ⚠';
      return {
        value: f.id,
        label: `${f.name} — D${f.depth}${depthMark} H${f.height}${heightMark}`,
      };
    }),
  ], [filteredFrames, rackFrameDepth, topBeamElevation, t]);

  return (
    <div className="flex flex-col gap-4">
      {/* Bay Information */}
      <Card className="!p-4">
        <h3 className="text-sm font-semibold text-white mb-3">{t('bay.bay_info_title')}</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <p className="text-slate-400">{t('bay.bay_number')}</p>
            <p className="text-white font-medium">{bIndex + 1}</p>
          </div>
          <div>
            <p className="text-slate-400">{t('bay.rack_label')}</p>
            <p className="text-white font-medium">{rack?.name || '-'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-slate-400 mb-1">{t('bay.supplier_label')}</p>
            <div className="w-full rounded px-3 py-2 text-sm text-slate-300 bg-slate-800/60 border border-slate-700 cursor-not-allowed select-none">
              {suppliers.find((s) => s.id === rackSupplierId)?.name || rack?.manufacturer || t('common.not_set')}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {t('bay.supplier_set_in_wizard')}
            </p>
          </div>
          <div className="col-span-2">
            <Input
              label={t('bay.bay_length_mm')}
              type="number"
              value={customLength}
              onChange={handleCustomLengthChange}
            />
            <p className="text-[10px] text-slate-500 mt-1">
              {t('bay.bay_length_filter_hint')}
            </p>
          </div>

          {/* Accessories (inside Bay Information) */}
          <div className="col-span-2 border-t border-slate-700 pt-3 mt-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-white">{t('bay.accessories_title')}</h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/editors/accessories')}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Plus size={12} /> {t('bay.accessories_new_button')} <ExternalLink size={10} />
                </button>
                <Button variant="ghost" size="sm" icon={Plus} onClick={handleAddAccessory}>
                  {t('bay.accessories_custom_button')}
                </Button>
              </div>
            </div>

            {/* DB-backed accessory selection */}
            {filteredDbAccessories.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-slate-500 mb-1">
                  {t('bay.accessories_from_db_count', { n: filteredDbAccessories.length })}
                </p>
                <div className="flex flex-col gap-1 max-h-[120px] overflow-y-auto pr-1">
                  {filteredDbAccessories.map((dbAcc) => {
                    const isAdded = accessories.some((a) => a.dbAccessoryId === dbAcc.id);
                    return (
                      <button
                        key={dbAcc.id}
                        onClick={() => {
                          if (isAdded) return;
                          const newAcc = [...accessories, { name: dbAcc.name, notes: dbAcc.description || '', dbAccessoryId: dbAcc.id }];
                          setAccessories(newAcc);
                          if (bay?.id && rack?.id) {
                            updateBay(rack.id, bay.id, { bayConfig: { accessories: newAcc } });
                          }
                        }}
                        disabled={isAdded}
                        className={`
                          w-full flex items-center justify-between px-2.5 py-1.5 rounded border text-left text-xs transition-all duration-150
                          ${isAdded
                            ? 'border-blue-500 bg-blue-500/10 text-blue-400 cursor-default'
                            : 'border-slate-700 bg-slate-800/40 text-slate-300 hover:border-slate-500 cursor-pointer'}
                        `}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{dbAcc.name}</span>
                          {dbAcc.description && (
                            <span className="text-[10px] text-slate-500 line-clamp-1">{dbAcc.description}</span>
                          )}
                        </div>
                        {isAdded && <Check size={12} className="text-blue-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredDbAccessories.length === 0 && (
              <div className="text-xs text-slate-500 mb-2 px-2 py-1.5 rounded bg-slate-800/50 border border-slate-700">
                {t('bay.accessories_no_db')}
                {' '}
                <button
                  onClick={() => navigate('/editors/accessories')}
                  className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                >
                  {t('bay.accessories_add_link')} <ExternalLink size={10} />
                </button>
              </div>
            )}

            {/* Added accessories */}
            {accessories.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {accessories.map((acc, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex-1 flex flex-col gap-1">
                      <input
                        type="text"
                        placeholder={t('bay.accessory_name_placeholder')}
                        value={acc.name}
                        onChange={(e) => handleAccessoryChange(i, 'name', e.target.value)}
                        className="w-full rounded px-2 py-1.5 text-xs text-white placeholder-slate-500 bg-slate-800 border border-slate-600 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder={t('bay.accessory_notes_placeholder')}
                        value={acc.notes}
                        onChange={(e) => handleAccessoryChange(i, 'notes', e.target.value)}
                        className="w-full rounded px-2 py-1.5 text-xs text-slate-300 placeholder-slate-500 bg-slate-800 border border-slate-600 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {acc.dbAccessoryId && (
                        <span className="text-[10px] text-blue-400/60">{t('bay.from_database_label')}</span>
                      )}
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
          </div>
        </div>
      </Card>

      {/* Beam Configuration */}
      <Card className="!p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Ruler size={14} className="text-blue-400" />
            <h3 className="text-sm font-semibold text-white">{t('bay.beam_configuration_title')}</h3>
          </div>
          <span className="text-xs text-slate-500">{t('bay.beams_levels_count', { n: levels })}</span>
        </div>

        {filteredBeams.length === 0 && (
          <div className="text-xs text-slate-500 mb-2 px-2 py-1.5 rounded bg-slate-800/50 border border-slate-700">
            {t('bay.no_beams_for_supplier_link')}
            {' '}
            <button
              onClick={() => navigate('/editors/beams')}
              className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
            >
              {t('bay.add_beam_link')} <ExternalLink size={10} />
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {Array.from({ length: editLevels }, (_, i) => {
            const beam = getLevelBeamDisplay(i);
            const isExpanded = expandedLevel === i;
            const displayName = beam?.name || t('bay.beam_not_configured');
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
                      {t('bay.available_beams_count', { n: filteredBeams.length })}
                    </p>
                    <div className="flex flex-col gap-1 max-h-[180px] overflow-y-auto pr-1 mb-2">
                      {filteredBeams.map((b) => {
                        const sel = getLevelBeamSelection(i);
                        const isActive = sel?.beamDbId === b.id;
                        const lengthMatches = (b.length || 0) === activeBayLength;
                        return (
                          <button
                            key={b.id}
                            onClick={() => handleLevelBeamSelect(i, b)}
                            title={
                              lengthMatches
                                ? t('bay.beam_length_matches_title', { n: activeBayLength })
                                : t('bay.beam_length_will_change_title', { n: b.length })
                            }
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
                              <span
                                className={
                                  lengthMatches ? 'text-slate-500' : 'text-amber-400'
                                }
                              >
                                {b.length} mm
                              </span>
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
                      <Plus size={12} /> {t('bay.new_beam_link')} <ExternalLink size={10} />
                    </button>

                    {/* Apply to all levels */}
                    {beam && (
                      <button
                        onClick={() => handleApplyBeamToAll(beam)}
                        className="w-full text-xs text-center text-blue-400 hover:text-blue-300 py-1.5 rounded border border-blue-500/30 hover:border-blue-500/60 transition-colors mb-3"
                      >
                        {t('bay.apply_beam_to_all', { beam: beam.name })}
                      </button>
                    )}

                    {/* Per-level accessories */}
                    <div className="border-t border-slate-700 pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <StickyNote size={10} /> {t('bay.level_accessories_label', { n: i + 1 })}
                        </span>
                        <Button variant="ghost" size="sm" icon={Plus} onClick={() => handleAddLevelAccessoryCustom(i)}>
                          {t('bay.accessories_custom_button')}
                        </Button>
                      </div>

                      {/* DB accessory picker for this level */}
                      {filteredDbAccessories.length > 0 && (
                        <div className="mb-2">
                          <div className="flex flex-col gap-1 max-h-[100px] overflow-y-auto pr-1">
                            {filteredDbAccessories.map((dbAcc) => {
                              const isAdded = getLevelAccessories(i).some((a) => a.dbAccessoryId === dbAcc.id);
                              return (
                                <button
                                  key={dbAcc.id}
                                  onClick={() => handleAddLevelAccessoryFromDb(i, dbAcc)}
                                  disabled={isAdded}
                                  className={`
                                    w-full flex items-center justify-between px-2 py-1 rounded border text-left text-[11px] transition-all duration-150
                                    ${isAdded
                                      ? 'border-blue-500/50 bg-blue-500/10 text-blue-400 cursor-default'
                                      : 'border-slate-700 bg-slate-800/40 text-slate-300 hover:border-slate-500 cursor-pointer'}
                                  `}
                                >
                                  <span className="truncate">{dbAcc.name}</span>
                                  {isAdded && <Check size={10} className="text-blue-400 shrink-0 ml-1" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Added level accessories */}
                      {getLevelAccessories(i).length > 0 && (
                        <div className="flex flex-col gap-1">
                          {getLevelAccessories(i).map((acc, ai) => (
                            <div key={ai} className="flex items-center gap-1.5 p-1.5 rounded bg-slate-800/50 border border-slate-700">
                              <div className="flex-1 flex flex-col gap-0.5">
                                <input
                                  type="text"
                                  placeholder={t('common.name')}
                                  value={acc.name}
                                  onChange={(e) => handleLevelAccessoryChange(i, ai, 'name', e.target.value)}
                                  className="w-full rounded px-2 py-1 text-[11px] text-white placeholder-slate-500 bg-slate-800 border border-slate-600 outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <input
                                  type="text"
                                  placeholder={t('bay.accessory_notes_placeholder')}
                                  value={acc.notes}
                                  onChange={(e) => handleLevelAccessoryChange(i, ai, 'notes', e.target.value)}
                                  className="w-full rounded px-2 py-1 text-[11px] text-slate-300 placeholder-slate-500 bg-slate-800 border border-slate-600 outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                {acc.dbAccessoryId && (
                                  <span className="text-[9px] text-blue-400/60">{t('bay.from_database_label')}</span>
                                )}
                              </div>
                              <button
                                onClick={() => handleRemoveLevelAccessory(i, ai)}
                                className="p-0.5 rounded hover:bg-slate-700 text-slate-500 hover:text-red-400 transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {getLevelAccessories(i).length === 0 && filteredDbAccessories.length === 0 && (
                        <p className="text-[10px] text-slate-500">{t('bay.no_accessories_for_level')}</p>
                      )}
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
          <h3 className="text-sm font-semibold text-white">{t('bay.frame_selection_title')}</h3>
          <button
            onClick={() => navigate('/editors/frames')}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <Plus size={12} /> {t('bay.new_frame_link')} <ExternalLink size={10} />
          </button>
        </div>

        {filteredFrames.length === 0 && (
          <div className="text-xs text-slate-500 mb-3 px-2 py-1.5 rounded bg-slate-800/50 border border-slate-700">
            {t('bay.no_frames_for_supplier')}
            {' '}
            <button
              onClick={() => navigate('/editors/frames')}
              className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
            >
              {t('bay.add_frame_link')} <ExternalLink size={10} />
            </button>
          </div>
        )}
        {filteredFrames.length > 0 && (
          <p className="text-[10px] text-slate-500 mb-2">
            {t('bay.frame_depth_mismatch_hint', { depth: rackFrameDepth, elevation: topBeamElevation })}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Select
              label={t('bay.frame_front')}
              value={leftFrameDbId}
              onChange={(e) => handleFrameSelect('left', e.target.value)}
              options={frameOptions}
              placeholder={t('bay.select_frame_placeholder')}
            />
            {leftFrameDbId && (
              <p className="text-[10px] text-slate-500 mt-1 truncate">
                {getFrameDisplayName(leftFrameDbId)}
              </p>
            )}
          </div>
          <div>
            <Select
              label={t('bay.frame_rear')}
              value={rightFrameDbId}
              onChange={(e) => handleFrameSelect('right', e.target.value)}
              options={frameOptions}
              placeholder={t('bay.select_frame_placeholder')}
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
        <h3 className="text-sm font-semibold text-white mb-3">{t('bay.levels_elevations_title')}</h3>
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm text-slate-400 w-28">{t('bay.number_of_levels')}</label>
          <Button variant="secondary" size="sm" icon={Minus} onClick={() => handleLevelsChange(-1)} disabled={editLevels <= 1} />
          <span className="text-lg font-bold text-white w-8 text-center">{editLevels}</span>
          <Button variant="secondary" size="sm" icon={Plus} onClick={() => handleLevelsChange(1)} disabled={editLevels >= 20} />
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-3 mb-2 text-[10px] text-slate-500 uppercase tracking-wider">
          <span className="w-14 shrink-0">{t('bay.column_level')}</span>
          <span className="flex-1">{t('bay.column_interaxis')}</span>
          <span className="w-24 shrink-0 text-right">{t('bay.column_from_ground')}</span>
        </div>

        <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
          {editInteraxis.map((inter, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-14 shrink-0">
                {i === 0 ? t('bay.level_first_label') : t('bay.level_n_label', { n: i + 1 })}
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

      {/* Duplicate Configuration */}
      {rack?.bays && rack.bays.length > 1 && (
        <Card className="!p-4">
          <div className="flex items-center gap-2 mb-3">
            <Copy size={14} className="text-blue-400" />
            <h3 className="text-sm font-semibold text-white">{t('bay.duplicate_config_title')}</h3>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            {t('bay.duplicate_config_hint')}
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
            {t('bay.duplicate_to_selected')}
          </Button>
        </Card>
      )}
    </div>
  );
}
