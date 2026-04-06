import React, { useState, useMemo, useRef } from 'react';
import { Trash2, CheckCircle2, PlusCircle, Camera, X, ChevronDown } from 'lucide-react';
import Button from '../ui/Button';
import ncTypes from '../../data/ncTypes';

const SEVERITY_CONFIG = {
  green: { label: 'Green', color: 'bg-green-500', border: 'border-green-500', text: 'text-green-400', ring: 'ring-green-500/30' },
  yellow: { label: 'Yellow', color: 'bg-yellow-500', border: 'border-yellow-500', text: 'text-yellow-400', ring: 'ring-yellow-500/30' },
  red: { label: 'Red', color: 'bg-red-500', border: 'border-red-500', text: 'text-red-400', ring: 'ring-red-500/30' },
};

// Quick-access NC buttons for beams (most common issues)
const BEAM_QUICK_NCS = ['beam-damaged', 'beam-missing-connector', 'beam-unhooked'];

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

  const levels = rack?.levels || bay?.levels || 3;

  // Get accessories for the selected level (future: per-level accessories from bay config)
  const levelAccessories = useMemo(() => {
    // For now, return empty. Phase 2 will populate per-level accessories.
    return [];
  }, [selectedLevel, bay]);

  // Element buttons for the selected level
  const elementButtons = useMemo(() => {
    if (selectedLevel === null) return [];
    const buttons = [{ id: 'beam', label: 'Beam', ncCategory: 'beam' }];
    // Add any accessories at this level
    levelAccessories.forEach((acc) => {
      buttons.push({ id: acc.id, label: acc.label, ncCategory: acc.ncCategory || acc.id });
    });
    return buttons;
  }, [selectedLevel, levelAccessories]);

  // NC types for the selected element
  const filteredNCTypes = useMemo(() => {
    if (elementType === 'beam') return ncTypes.beam || [];
    if (elementType === 'upright') return ncTypes.upright || [];
    // Look up by element type key in ncTypes
    if (ncTypes[elementType]) return ncTypes[elementType];
    return [];
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
    setElementId(`${elType}-level-${selectedLevel}`);
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

  // Look up NC type name by id
  const getNCTypeName = (ncTypeId) => {
    for (const category of Object.values(ncTypes)) {
      const found = category.find((t) => t.id === ncTypeId);
      if (found) return found.name;
    }
    return ncTypeId;
  };

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

      {/* Step 1: Level Selection */}
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
          1. Select Level
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
                L{level}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Element Selection */}
      {selectedLevel !== null && (
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
            2. Element
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

      {/* Step 3: FRONT / REAR */}
      {elementType && (
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
            3. Face
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

      {/* Step 4: NC Type - Quick buttons + Other dropdown */}
      {face && (
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
            4. Non-Conformity
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

      {/* Step 5: Severity */}
      {selectedNCType && selectedNCData && (
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
            5. Severity
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

      {/* Step 6: Photos */}
      {severity && (
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
            6. Photos (optional, max 3)
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

      {/* Step 7: Quantity + Notes */}
      {severity && (
        <div className="grid grid-cols-[100px_1fr] gap-3">
          {/* Quantity */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
              7. Qty
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
