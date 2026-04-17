import React, { useState, useMemo, useRef } from 'react';
import { Trash2, CheckCircle2, PlusCircle, Camera, X, ChevronDown } from 'lucide-react';
import Button from '../ui/Button';
import ncTypes from '../../data/ncTypes';
import { getNCTypeName } from '../../utils/ncHelpers';

const SEVERITY_CONFIG = {
  green: { label: 'Green', color: 'bg-green-500', border: 'border-green-500', text: 'text-green-400', ring: 'ring-green-500/30' },
  yellow: { label: 'Yellow', color: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-400', ring: 'ring-yellow-500/30' },
  red: { label: 'Red', color: 'bg-red-500', border: 'border-red-500', text: 'text-red-400', ring: 'ring-red-500/30' },
};

// Quick-access NC buttons for beams (most common issues)
const BEAM_QUICK_NCS = ['beam-damaged', 'beam-missing-safety-lock', 'beam-detached'];

// Per-level elements (shown after level selection)
const PER_LEVEL_ELEMENTS = [
  { id: 'beam', label: 'Beam', ncCategory: 'beam' },
  { id: 'palletSupportBar', label: 'Pallet Support Bar', ncCategory: 'palletSupportBar' },
  { id: 'rearPalletStopBeam', label: 'Rear Pallet Stop Beam', ncCategory: 'rearPalletStopBeam' },
  { id: 'deckingPanels', label: 'Decking Panels', ncCategory: 'deckingPanels' },
  { id: 'pallet', label: 'Pallet', ncCategory: 'pallet' },
];

// Bay/rack-level elements (no level selection needed)
const BAY_LEVEL_ELEMENTS = [
  { id: 'rearSafetyMesh', label: 'Rear Safety Mesh', ncCategory: 'rearSafetyMesh' },
  { id: 'underpassProtection', label: 'Underpass Protection', ncCategory: 'underpassProtection' },
  { id: 'horizontalBracing', label: 'Horizontal Bracing', ncCategory: 'horizontalBracing' },
  { id: 'verticalBracing', label: 'Vertical Bracing', ncCategory: 'verticalBracing' },
  { id: 'bay', label: 'Bay', ncCategory: 'bay' },
  { id: 'aisle', label: 'Aisle', ncCategory: 'aisle' },
  { id: 'entireRackingSystem', label: 'Entire Racking System', ncCategory: 'entireRackingSystem' },
];

export default function BayInspection({
  rack,
  bay,
  bayIndex,
  rackId,
  bayId,
  ncs = [],
  onAddNC,
  onRemoveNC,
}) {
  // Selection state
  const [inspectionMode, setInspectionMode] = useState('level');
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [elementType, setElementType] = useState('');
  const [elementId, setElementId] = useState('');
  const [face, setFace] = useState('');
  const [selectedNCType, setSelectedNCType] = useState('');
  const [severity, setSeverity] = useState('');
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [photos, setPhotos] = useState([]);
  const [showAllNCs, setShowAllNCs] = useState(false);

  const fileInputRef = useRef(null);

  // Per-bay level count with rack-level fallback (Doc 1 §3.1.1 — bays edit independently)
  const levels = bay?.bayConfig?.levels ?? rack?.levels ?? bay?.levels ?? 3;

  // Compute elevation per level for display in level selector
  const bc = bay?.bayConfig || {};
  const _iH = bc.individualHeights ?? rack?.individualHeights ?? [];
  const _fE = bc.firstElevation ?? rack?.firstElevation ?? 0;
  const _lS = bc.levelSpacing ?? rack?.levelSpacing ?? 1500;
  const _useI = (bc.useIndividualHeights ?? rack?.useIndividualHeights) && _iH.length === levels;
  const levelElevations = useMemo(() => {
    const elev = [];
    for (let i = 0; i < levels; i++) {
      elev.push(_useI ? _iH[i] : _fE + _lS * i);
    }
    return elev;
  }, [levels, _useI, _iH, _fE, _lS]);

  // Element buttons based on mode and level
  const elementButtons = useMemo(() => {
    if (inspectionMode === 'bay') return BAY_LEVEL_ELEMENTS;
    if (selectedLevel === null) return [];
    return PER_LEVEL_ELEMENTS;
  }, [inspectionMode, selectedLevel]);

  // NC types for the selected element
  const filteredNCTypes = useMemo(() => {
    if (!elementType) return [];
    // Find the element definition to get ncCategory
    const allElements = [...PER_LEVEL_ELEMENTS, ...BAY_LEVEL_ELEMENTS];
    const elDef = allElements.find(e => e.id === elementType);
    const category = elDef?.ncCategory || elementType;
    return ncTypes[category] || [];
  }, [elementType]);

  // Selected NC type data
  const selectedNCData = filteredNCTypes.find((t) => t.id === selectedNCType);

  // Quick NC types (shown as large buttons) vs "Other" (dropdown)
  const quickNCTypes = useMemo(() => {
    if (elementType === 'beam') {
      return filteredNCTypes.filter((t) => BEAM_QUICK_NCS.includes(t.id));
    }
    // For other elements, show first 3 as quick buttons
    return filteredNCTypes.slice(0, 3);
  }, [elementType, filteredNCTypes]);

  const otherNCTypes = useMemo(() => {
    if (elementType === 'beam') {
      return filteredNCTypes.filter((t) => !BEAM_QUICK_NCS.includes(t.id));
    }
    return filteredNCTypes.slice(3);
  }, [elementType, filteredNCTypes]);

  const handleReset = () => {
    setSelectedLevel(null);
    setElementType('');
    setElementId('');
    setFace('');
    setSelectedNCType('');
    setSeverity('');
    setNotes('');
    setQuantity(1);
    setPhotos([]);
    setShowAllNCs(false);
  };

  const handleSelectLevel = (level) => {
    setSelectedLevel(level);
    setElementType('');
    setElementId('');
    setFace('');
    setSelectedNCType('');
    setSeverity('');
    setNotes('');
    setQuantity(1);
    setPhotos([]);
    setShowAllNCs(false);
  };

  const handleSelectElement = (elType) => {
    setElementType(elType);
    if (inspectionMode === 'bay') {
      setElementId(`${elType}-bay-${bayId || 'unknown'}`);
    } else {
      setElementId(`${elType}-level-${selectedLevel}`);
    }
    setFace('');
    setSelectedNCType('');
    setSeverity('');
    setShowAllNCs(false);
  };

  const handleSelectFace = (f) => {
    setFace(f);
    setSelectedNCType('');
    setSeverity('');
  };

  const handleSelectNCType = (ncTypeId) => {
    setSelectedNCType(ncTypeId);
    setSeverity('');
    setShowAllNCs(false);
  };

  const handleAddPhoto = () => {
    if (photos.length >= 3) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotos((prev) => {
        if (prev.length >= 3) return prev;
        return [...prev, ev.target.result];
      });
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleRemovePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRecord = () => {
    if (!elementType || !elementId || !selectedNCType || !severity) return;

    const ncData = {
      rackId: rackId || rack?.id || '',
      bayId: bayId || bay?.id || '',
      elementType,
      elementId,
      ncTypeId: selectedNCType,
      severity,
      face,
      quantity: Math.max(1, quantity),
      photos: photos.length > 0 ? photos : [],
      notes: notes.trim(),
    };

    onAddNC?.(ncData);
    handleReset();
  };

  const canRecord = elementType && elementId && selectedNCType && severity;

  // Derive element label
  const getElementLabel = (elType, elId) => {
    if (elType === 'beam') {
      const level = elId?.replace(/\D/g, '') || '';
      return `Beam L${level}`;
    }
    if (elId === 'left-upright') return 'Left Upright';
    if (elId === 'right-upright') return 'Right Upright';
    return elId;
  };

  // Dynamic step numbering
  let stepNum = 1;

  return (
    <div className="flex flex-col gap-5">
      {/* Hidden file input for photos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Mode Toggle: Per-level vs Bay-level */}
      <div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { setInspectionMode('level'); handleReset(); }}
            className={`py-2.5 px-4 rounded-lg border text-sm font-bold transition-all duration-150 ${
              inspectionMode === 'level'
                ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
            }`}
          >
            Per Level
          </button>
          <button
            onClick={() => { setInspectionMode('bay'); handleReset(); }}
            className={`py-2.5 px-4 rounded-lg border text-sm font-bold transition-all duration-150 ${
              inspectionMode === 'bay'
                ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
            }`}
          >
            Bay / Rack Level
          </button>
        </div>
      </div>

      {/* Level Selection (only in per-level mode) */}
      {inspectionMode === 'level' && (
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
            {stepNum++}. Select Level
          </label>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: levels }, (_, i) => {
              const level = i + 1;
              const isActive = selectedLevel === level;
              return (
                <button
                  key={level}
                  onClick={() => handleSelectLevel(level)}
                  className={`
                    py-3 px-4 rounded-lg border text-sm font-bold
                    transition-all duration-150
                    ${
                      isActive
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                    }
                  `}
                >
                  <span>L{level}</span>
                  <span className="block text-[10px] font-normal opacity-60">
                    {levelElevations[i] ?? 0}mm
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Element Selection */}
      {(inspectionMode === 'bay' || selectedLevel !== null) && (
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
            {stepNum++}. Element
          </label>
          <div className="grid grid-cols-2 gap-2">
            {elementButtons.map((el) => {
              const isActive = elementType === el.id;
              return (
                <button
                  key={el.id}
                  onClick={() => handleSelectElement(el.id)}
                  className={`
                    py-3 px-4 rounded-lg border text-sm font-medium
                    transition-all duration-150
                    ${
                      isActive
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                    }
                  `}
                >
                  {el.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* FRONT / REAR (only for beam and upright) */}
      {elementType && (elementType === 'beam' || elementType === 'upright') && (
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
            {stepNum++}. Face
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['front', 'rear'].map((f) => {
              const isActive = face === f;
              return (
                <button
                  key={f}
                  onClick={() => handleSelectFace(f)}
                  className={`
                    py-3 px-4 rounded-lg border text-sm font-bold uppercase
                    transition-all duration-150
                    ${
                      isActive
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                    }
                  `}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* NC Type - Quick buttons + Other dropdown */}
      {(face || (elementType && elementType !== 'beam' && elementType !== 'upright')) && (
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
            {stepNum++}. Non-Conformity
          </label>
          <div className="flex flex-col gap-2">
            {/* Quick NC buttons */}
            {quickNCTypes.map((ncType) => {
              const isActive = selectedNCType === ncType.id;
              return (
                <button
                  key={ncType.id}
                  onClick={() => handleSelectNCType(ncType.id)}
                  className={`
                    py-3 px-4 rounded-lg border text-left
                    transition-all duration-150
                    ${
                      isActive
                        ? 'bg-blue-600/15 border-blue-500'
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                    }
                  `}
                >
                  <p className={`text-sm font-medium ${isActive ? 'text-blue-400' : 'text-white'}`}>
                    {ncType.name}
                  </p>
                </button>
              );
            })}

            {/* "Other" toggle for remaining NC types */}
            {otherNCTypes.length > 0 && (
              <>
                <button
                  onClick={() => setShowAllNCs(!showAllNCs)}
                  className="py-3 px-4 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500 hover:text-white transition-all duration-150 flex items-center justify-between"
                >
                  <span className="text-sm font-medium">Other</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${showAllNCs ? 'rotate-180' : ''}`}
                  />
                </button>

                {showAllNCs && (
                  <div className="flex flex-col gap-1.5 pl-2 border-l-2 border-slate-700 ml-2">
                    {otherNCTypes.map((ncType) => {
                      const isActive = selectedNCType === ncType.id;
                      return (
                        <button
                          key={ncType.id}
                          onClick={() => handleSelectNCType(ncType.id)}
                          className={`
                            py-2.5 px-3 rounded-lg border text-left
                            transition-all duration-150
                            ${
                              isActive
                                ? 'bg-blue-600/15 border-blue-500'
                                : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                            }
                          `}
                        >
                          <p className={`text-sm font-medium ${isActive ? 'text-blue-400' : 'text-white'}`}>
                            {ncType.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {ncType.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Severity */}
      {selectedNCType && selectedNCData && (
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
            {stepNum++}. Severity
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['green', 'yellow', 'red'].map((sev) => {
              const config = SEVERITY_CONFIG[sev];
              const isAllowed = selectedNCData.severities.includes(sev);
              const isActive = severity === sev;

              if (!isAllowed) {
                return (
                  <button
                    key={sev}
                    disabled
                    className="py-3 px-4 rounded-lg border border-slate-800 text-slate-600 text-sm font-medium opacity-40 cursor-not-allowed"
                  >
                    {config.label}
                  </button>
                );
              }

              return (
                <button
                  key={sev}
                  onClick={() => setSeverity(sev)}
                  className={`
                    py-3 px-4 rounded-lg border text-sm font-medium
                    transition-all duration-150
                    ${
                      isActive
                        ? `${config.border} ${config.text} bg-slate-800 ring-2 ${config.ring}`
                        : `border-slate-700 text-slate-400 hover:${config.border} hover:${config.text}`
                    }
                  `}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${config.color}`} />
                    {config.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Photos */}
      {severity && (
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
            {stepNum++}. Photos (optional, max 3)
          </label>
          <div className="flex gap-2 flex-wrap">
            {photos.map((photo, index) => (
              <div
                key={index}
                className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-600"
              >
                <img
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleRemovePhoto(index)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-600 flex items-center justify-center"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            ))}
            {photos.length < 3 && (
              <button
                onClick={handleAddPhoto}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-500 hover:border-slate-400 hover:text-slate-300 transition-colors"
              >
                <Camera size={20} />
                <span className="text-[10px] mt-1">Add</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quantity + Notes */}
      {severity && (
        <div className="grid grid-cols-[100px_1fr] gap-3">
          {/* Quantity */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
              {stepNum++}. Qty
            </label>
            <input
              type="number"
              min={1}
              max={99}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="
                w-full rounded-lg px-3 py-2.5 text-sm text-white text-center font-medium
                bg-slate-800 border border-slate-600 transition-colors duration-150 outline-none
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              "
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observations..."
              rows={2}
              className="
                w-full rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500
                bg-slate-800 border border-slate-600 transition-colors duration-150 outline-none
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none
              "
            />
          </div>
        </div>
      )}

      {/* Save Button */}
      {severity && (
        <Button
          onClick={handleRecord}
          disabled={!canRecord}
          icon={PlusCircle}
          className="w-full"
          size="lg"
        >
          Record NC
        </Button>
      )}

      {/* Recorded NCs List */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">
            Recorded NCs
          </h3>
          {ncs.length > 0 && (
            <span className="text-xs text-slate-400">
              {ncs.length} item{ncs.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {ncs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 size={28} className="text-slate-600 mb-2" />
            <p className="text-sm text-slate-500">No NCs recorded for this bay</p>
            <p className="text-xs text-slate-600 mt-1">
              Use the form above to record non-conformities
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {ncs.map((nc) => {
              const sevConfig = SEVERITY_CONFIG[nc.severity] || SEVERITY_CONFIG.green;
              const photoCount = nc.photos?.length || (nc.photo ? 1 : 0);
              return (
                <div
                  key={nc.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                >
                  {/* Severity dot */}
                  <span
                    className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${sevConfig.color}`}
                  />

                  {/* NC info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">
                      {getNCTypeName(nc.ncTypeId)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-400">
                        {getElementLabel(nc.elementType, nc.elementId)}
                      </p>
                      {nc.face && (
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                          {nc.face}
                        </span>
                      )}
                      {(nc.quantity || 1) > 1 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                          x{nc.quantity}
                        </span>
                      )}
                      {photoCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                          {photoCount} photo{photoCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    {nc.notes && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {nc.notes}
                      </p>
                    )}
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => onRemoveNC?.(nc.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1 shrink-0"
                    title="Remove NC"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
