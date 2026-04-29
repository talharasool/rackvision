import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, Check, ExternalLink, AlertTriangle } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Card from '../ui/Card';
import WizardStep from './WizardStep';
import useRackStore from '../../stores/rackStore';
import useSupplierStore from '../../stores/supplierStore';
import useBeamDatabaseStore, { BEAM_TYPES } from '../../stores/beamDatabaseStore';
import useFrameDatabaseStore from '../../stores/frameDatabaseStore';

const TOTAL_STEPS = 7;

const BEAM_TYPE_LABEL = Object.fromEntries(
  BEAM_TYPES.map((t) => [t.value, t.label])
);

const initialRackData = {
  supplierId: '',
  supplierName: '',
  manufacturer: '', // kept for backwards compat — mirrors supplierName
  numberOfBays: 1,
  name: '',
  beamId: '',
  bayLength: 0,
  beamType: '',
  levels: 3,
  firstElevation: 0,
  levelSpacing: 1500,
  useIndividualHeights: false,
  individualHeights: [],
  frameId: '',
  frameHeight: 0,
  frameDepth: 0,
  uprightWidth: 0,
  uprightDepth: 0,
  braceType: 'Z',
};

export default function RackWizard({ isOpen, onClose, areaId, editRack }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [rackData, setRackData] = useState(initialRackData);
  // Doc 5 §9: Inline beam/frame creation state
  const [showNewBeam, setShowNewBeam] = useState(false);
  const [newBeamData, setNewBeamData] = useState({ customName: '', length: '', height: '', depth: '' });
  const [showNewFrame, setShowNewFrame] = useState(false);
  const [newFrameData, setNewFrameData] = useState({ customName: '', uprightHeight: '', depth: '', uprightWidth: '' });

  const { createRack, updateRack } = useRackStore();
  const { suppliers } = useSupplierStore();
  const { beams, getFilteredBeams, addBeam } = useBeamDatabaseStore();
  const { frames, getFilteredFrames, addFrame } = useFrameDatabaseStore();

  const isEditing = !!editRack;

  // Pre-fill data when editing
  useEffect(() => {
    if (editRack && isOpen) {
      setRackData({
        supplierId: editRack.supplierId || '',
        supplierName: editRack.supplierName || editRack.manufacturer || '',
        manufacturer: editRack.supplierName || editRack.manufacturer || '',
        numberOfBays: editRack.numberOfBays || 1,
        name: editRack.name || '',
        beamId: editRack.beamId || '',
        bayLength: editRack.bayLength || 0,
        beamType: editRack.beamType || '',
        levels: editRack.levels || 3,
        firstElevation: editRack.firstElevation || 0,
        levelSpacing: editRack.levelSpacing || 1500,
        useIndividualHeights: editRack.useIndividualHeights || false,
        individualHeights: editRack.individualHeights || [],
        frameId: editRack.frameId || '',
        frameHeight: editRack.frameHeight || 0,
        frameDepth: editRack.frameDepth || 0,
        uprightWidth: editRack.uprightWidth || 0,
        uprightDepth: editRack.uprightDepth || editRack.uprightWidth || 0,
        braceType: editRack.braceType || 'Z',
      });
      setCurrentStep(1);
    } else if (isOpen) {
      setRackData(initialRackData);
      setCurrentStep(1);
    }
  }, [editRack, isOpen]);

  // Update field helper
  const updateField = (field, value) => {
    setRackData((prev) => ({ ...prev, [field]: value }));
  };

  // Auto-suggest rack name
  const suggestedName = useMemo(() => {
    const supplierName = rackData.supplierName;
    const bays = rackData.numberOfBays;
    return supplierName ? `${supplierName}-${bays}Bay-001` : '';
  }, [rackData.supplierName, rackData.numberOfBays]);

  // Filtered beams & frames for the selected supplier
  const filteredBeams = useMemo(() => {
    if (!rackData.supplierId) return [];
    return getFilteredBeams(rackData.supplierId);
  }, [rackData.supplierId, beams, getFilteredBeams]);

  const filteredFrames = useMemo(() => {
    if (!rackData.supplierId) return [];
    return getFilteredFrames(rackData.supplierId);
  }, [rackData.supplierId, frames, getFilteredFrames]);

  // Group filtered beams by beamType
  const beamsByType = useMemo(() => {
    const grouped = {};
    filteredBeams.forEach((beam) => {
      const label = BEAM_TYPE_LABEL[beam.beamType] || beam.beamType || 'Other';
      if (!grouped[label]) grouped[label] = [];
      grouped[label].push(beam);
    });
    return grouped;
  }, [filteredBeams]);

  // Handle supplier selection — resets beam/frame picks since filters change
  const handleSupplierSelect = (supplierId) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    setRackData((prev) => ({
      ...prev,
      supplierId,
      supplierName: supplier?.name || '',
      manufacturer: supplier?.name || '',
      // Reset downstream picks when supplier changes
      beamId: '',
      bayLength: 0,
      beamType: '',
      frameId: '',
      frameHeight: 0,
      frameDepth: 0,
      uprightWidth: 0,
      uprightDepth: 0,
      braceType: 'Z',
    }));
  };

  // Handle beam selection
  const handleBeamSelect = (beamId) => {
    const beam = filteredBeams.find((b) => b.id === beamId);
    if (beam) {
      updateField('beamId', beam.id);
      updateField('bayLength', beam.length || 0);
      updateField('beamType', beam.beamType || '');
    }
  };

  // Handle frame selection
  const handleFrameSelect = (frameId) => {
    const frame = filteredFrames.find((f) => f.id === frameId);
    if (frame) {
      setRackData((prev) => ({
        ...prev,
        frameId: frame.id,
        frameHeight: frame.uprightHeight || frame.height || 0,
        frameDepth: frame.depth || 0,
        uprightWidth: frame.uprightWidth || 0,
        uprightDepth: frame.uprightDepth || frame.uprightWidth || 0,
        braceType: frame.braceType || 'Z',
      }));
    }
  };

  // Handle level count change and sync individual heights array
  const handleLevelsChange = (newLevels) => {
    const clamped = Math.max(1, Math.min(20, newLevels));
    updateField('levels', clamped);

    setRackData((prev) => {
      const heights = [...prev.individualHeights];
      while (heights.length < clamped) {
        const lastHeight = heights.length > 0 ? heights[heights.length - 1] : prev.firstElevation;
        heights.push(lastHeight + prev.levelSpacing);
      }
      return { ...prev, levels: clamped, individualHeights: heights.slice(0, clamped) };
    });
  };

  // Validation per step
  const isStepValid = (step) => {
    switch (step) {
      case 1:
        return !!rackData.supplierId;
      case 2:
        return rackData.numberOfBays >= 1 && rackData.numberOfBays <= 50;
      case 3:
        return !!rackData.name.trim();
      case 4:
        return !!rackData.beamId;
      case 5:
        return rackData.levels >= 1 && rackData.levels <= 20;
      case 6:
        return !!rackData.frameId;
      case 7:
        return true;
      default:
        return false;
    }
  };

  // Handle confirm
  const handleConfirm = () => {
    const payload = { ...rackData };
    delete payload.useIndividualHeights;

    if (isEditing) {
      updateRack(editRack.id, payload);
    } else {
      createRack(areaId, payload);
    }
    onClose();
  };

  // Navigation helper — close wizard and jump to an editor
  const openEditor = (path) => {
    onClose();
    navigate(path);
  };

  const goNext = () => {
    if (currentStep < TOTAL_STEPS && isStepValid(currentStep)) {
      setCurrentStep((s) => s + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  };

  // Selected beam/frame/supplier for display
  const selectedBeam = filteredBeams.find((b) => b.id === rackData.beamId);
  const selectedFrame = filteredFrames.find((f) => f.id === rackData.frameId);
  const selectedSupplier = suppliers.find((s) => s.id === rackData.supplierId);

  // Doc 1 §2.3.7: highest beam elevation (top of highest level) so we can
  // flag frames that are too short.
  const highestBeamElevation = useMemo(() => {
    if (rackData.useIndividualHeights && rackData.individualHeights.length) {
      return Math.max(...rackData.individualHeights);
    }
    return (
      rackData.firstElevation +
      Math.max(0, rackData.levels - 1) * rackData.levelSpacing
    );
  }, [
    rackData.useIndividualHeights,
    rackData.individualHeights,
    rackData.firstElevation,
    rackData.levels,
    rackData.levelSpacing,
  ]);

  const isFrameCompatible = (frame) => {
    const h = frame?.uprightHeight || frame?.height || 0;
    return h >= highestBeamElevation;
  };

  const selectedFrameIncompatible =
    !!selectedFrame && !isFrameCompatible(selectedFrame);

  // ─── Step Renderers ─────────────────────────────────────────────────

  const renderStep1 = () => (
    <WizardStep
      stepNumber={1}
      totalSteps={TOTAL_STEPS}
      title={t('wizard.step1_title')}
      description={t('wizard.step1_description')}
    >
      <div className="flex flex-col gap-4">
        {suppliers.length === 0 ? (
          <Card className="!p-4">
            <p className="text-sm text-slate-300 mb-3">
              {t('wizard.no_suppliers_message')}
            </p>
            <Button
              size="sm"
              icon={ExternalLink}
              onClick={() => openEditor('/editors/suppliers')}
            >
              {t('wizard.open_supplier_editor')}
            </Button>
          </Card>
        ) : (
          <>
            <Select
              label={t('wizard.supplier_label')}
              value={rackData.supplierId}
              onChange={(e) => handleSupplierSelect(e.target.value)}
              placeholder={t('wizard.supplier_placeholder')}
              required
              options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
            />
            <button
              type="button"
              className="self-start text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
              onClick={() => openEditor('/editors/suppliers')}
            >
              <ExternalLink size={12} />
              {t('wizard.manage_suppliers')}
            </button>
          </>
        )}
      </div>
    </WizardStep>
  );

  const renderStep2 = () => (
    <WizardStep
      stepNumber={2}
      totalSteps={TOTAL_STEPS}
      title={t('wizard.step2_title')}
      description={t('wizard.step2_description')}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            size="lg"
            icon={Minus}
            onClick={() =>
              updateField('numberOfBays', Math.max(1, rackData.numberOfBays - 1))
            }
            disabled={rackData.numberOfBays <= 1}
          />
          <div className="w-24 text-center">
            <span className="text-4xl font-bold text-white">
              {rackData.numberOfBays}
            </span>
          </div>
          <Button
            variant="secondary"
            size="lg"
            icon={Plus}
            onClick={() =>
              updateField('numberOfBays', Math.min(50, rackData.numberOfBays + 1))
            }
            disabled={rackData.numberOfBays >= 50}
          />
        </div>
        <Input
          type="number"
          value={rackData.numberOfBays}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val)) {
              updateField('numberOfBays', Math.max(1, Math.min(50, val)));
            }
          }}
          className="w-32"
        />
        <p className="text-xs text-slate-500">{t('wizard.bays_range_hint')}</p>
      </div>
    </WizardStep>
  );

  const renderStep3 = () => (
    <WizardStep
      stepNumber={3}
      totalSteps={TOTAL_STEPS}
      title={t('wizard.step3_title')}
      description={t('wizard.step3_description')}
    >
      <div className="flex flex-col gap-4">
        <Input
          label={t('wizard.rack_name_label')}
          value={rackData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder={t('wizard.rack_name_placeholder')}
          required
        />
        {suggestedName && rackData.name !== suggestedName && (
          <button
            type="button"
            className="text-left text-sm text-blue-400 hover:text-blue-300 transition-colors"
            onClick={() => updateField('name', suggestedName)}
          >
            {t('wizard.name_suggestion_prefix')}<span className="font-medium">{suggestedName}</span>
          </button>
        )}
      </div>
    </WizardStep>
  );

  const renderStep4 = () => (
    <WizardStep
      stepNumber={4}
      totalSteps={TOTAL_STEPS}
      title={t('wizard.step4_title')}
      description={t('wizard.step4_description', { supplier: rackData.supplierName || t('common.supplier') })}
    >
      {filteredBeams.length === 0 ? (
        <Card className="!p-4">
          <p className="text-sm text-slate-300 mb-1">
            {t('wizard.no_beams_for_supplier_title', { supplier: rackData.supplierName })}
          </p>
          <p className="text-xs text-slate-400 mb-3">
            {t('wizard.no_beams_for_supplier_hint')}
          </p>
          <Button
            size="sm"
            icon={ExternalLink}
            onClick={() => openEditor('/editors/beams')}
          >
            {t('wizard.open_beam_editor')}
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1">
          {Object.entries(beamsByType).map(([type, typeBeams]) => (
            <div key={type}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {type}
              </p>
              <div className="flex flex-col gap-2">
                {typeBeams.map((beam) => {
                  const isSelected = rackData.beamId === beam.id;
                  return (
                    <div
                      key={beam.id}
                      onClick={() => handleBeamSelect(beam.id)}
                      className={`
                        flex items-center justify-between p-3 rounded-lg border cursor-pointer
                        transition-all duration-150
                        ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                        }
                      `}
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{beam.name}</p>
                        <p className="text-xs text-slate-400">
                          {t('wizard.beam_dims', { length: beam.length, height: beam.height, depth: beam.depth })}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Doc 5 §9: Quick-add new beam inline */}
          {!showNewBeam ? (
            <button
              onClick={() => setShowNewBeam(true)}
              className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-slate-600 text-slate-400 hover:text-blue-400 hover:border-blue-500/50 transition-colors"
            >
              <Plus size={16} />
              <span className="text-sm">{t('wizard.new_beam_inline_label')}</span>
            </button>
          ) : (
            <div className="p-3 rounded-lg border border-blue-500/40 bg-blue-500/5 space-y-3">
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">{t('wizard.quick_add_beam')}</p>
              <Input
                label={t('wizard.beam_name_optional')}
                value={newBeamData.customName}
                onChange={(e) => setNewBeamData(p => ({ ...p, customName: e.target.value }))}
                placeholder={t('wizard.beam_name_placeholder')}
              />
              <div className="grid grid-cols-3 gap-2">
                <Input
                  label={t('wizard.length_mm')}
                  type="number"
                  value={newBeamData.length}
                  onChange={(e) => setNewBeamData(p => ({ ...p, length: e.target.value }))}
                  placeholder={t('wizard.length_placeholder')}
                />
                <Input
                  label={t('wizard.height_mm')}
                  type="number"
                  value={newBeamData.height}
                  onChange={(e) => setNewBeamData(p => ({ ...p, height: e.target.value }))}
                  placeholder={t('wizard.height_placeholder')}
                />
                <Input
                  label={t('wizard.depth_mm')}
                  type="number"
                  value={newBeamData.depth}
                  onChange={(e) => setNewBeamData(p => ({ ...p, depth: e.target.value }))}
                  placeholder={t('wizard.depth_placeholder')}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={!newBeamData.length}
                  onClick={() => {
                    const beam = addBeam({
                      supplierId: rackData.supplierId,
                      supplierName: rackData.supplierName,
                      customName: newBeamData.customName.trim(),
                      length: Number(newBeamData.length) || 0,
                      height: Number(newBeamData.height) || 0,
                      depth: Number(newBeamData.depth) || 0,
                    });
                    if (beam) {
                      // Set directly — filteredBeams is stale this render
                      setRackData(prev => ({
                        ...prev,
                        beamId: beam.id,
                        bayLength: beam.length || 0,
                        beamType: beam.beamType || '',
                      }));
                    }
                    setShowNewBeam(false);
                    setNewBeamData({ customName: '', length: '', height: '', depth: '' });
                  }}
                >
                  {t('wizard.add_and_select')}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setShowNewBeam(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </WizardStep>
  );

  const renderStep5 = () => (
    <WizardStep
      stepNumber={5}
      totalSteps={TOTAL_STEPS}
      title={t('wizard.step5_title')}
      description={t('wizard.step5_description')}
    >
      <div className="flex flex-col gap-4">
        {/* Number of levels */}
        <div className="flex items-center gap-4">
          <label className="text-sm text-slate-400 w-32">{t('wizard.number_of_levels')}</label>
          <Button
            variant="secondary"
            size="sm"
            icon={Minus}
            onClick={() => handleLevelsChange(rackData.levels - 1)}
            disabled={rackData.levels <= 1}
          />
          <span className="text-lg font-bold text-white w-8 text-center">
            {rackData.levels}
          </span>
          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={() => handleLevelsChange(rackData.levels + 1)}
            disabled={rackData.levels >= 20}
          />
        </div>

        {/* First elevation */}
        <Input
          label={t('wizard.first_elevation_height_mm')}
          type="number"
          value={rackData.firstElevation}
          onChange={(e) => updateField('firstElevation', parseInt(e.target.value, 10) || 0)}
          placeholder="0"
        />

        {/* Spacing mode toggle */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-400">{t('wizard.level_heights_label')}</label>
          <button
            type="button"
            onClick={() => updateField('useIndividualHeights', false)}
            className={`px-3 py-1 text-xs rounded-l-md border transition-colors ${
              !rackData.useIndividualHeights
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-slate-800 border-slate-600 text-slate-400'
            }`}
          >
            {t('wizard.uniform_spacing')}
          </button>
          <button
            type="button"
            onClick={() => {
              updateField('useIndividualHeights', true);
              // Initialize individual heights if empty
              if (rackData.individualHeights.length === 0) {
                const heights = [];
                for (let i = 0; i < rackData.levels; i++) {
                  heights.push(rackData.firstElevation + rackData.levelSpacing * i);
                }
                updateField('individualHeights', heights);
              }
            }}
            className={`px-3 py-1 text-xs rounded-r-md border transition-colors ${
              rackData.useIndividualHeights
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-slate-800 border-slate-600 text-slate-400'
            }`}
          >
            {t('wizard.individual_heights')}
          </button>
        </div>

        {/* Uniform spacing input */}
        {!rackData.useIndividualHeights && (
          <Input
            label={t('wizard.level_spacing_mm')}
            type="number"
            value={rackData.levelSpacing}
            onChange={(e) => updateField('levelSpacing', parseInt(e.target.value, 10) || 0)}
            placeholder="1500"
          />
        )}

        {/* Individual level heights */}
        {rackData.useIndividualHeights && (
          <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
            {Array.from({ length: rackData.levels }, (_, i) => (
              <Input
                key={i}
                label={t('wizard.level_n_height_mm', { n: i + 1 })}
                type="number"
                value={rackData.individualHeights[i] ?? ''}
                onChange={(e) => {
                  const newHeights = [...rackData.individualHeights];
                  newHeights[i] = parseInt(e.target.value, 10) || 0;
                  updateField('individualHeights', newHeights);
                }}
                placeholder={`${rackData.firstElevation + rackData.levelSpacing * i}`}
              />
            ))}
          </div>
        )}
      </div>
    </WizardStep>
  );

  const renderStep6 = () => (
    <WizardStep
      stepNumber={6}
      totalSteps={TOTAL_STEPS}
      title={t('wizard.step6_title')}
      description={t('wizard.step6_description', { supplier: rackData.supplierName || t('common.supplier') })}
    >
      {filteredFrames.length === 0 ? (
        <Card className="!p-4">
          <p className="text-sm text-slate-300 mb-1">
            {t('wizard.no_frames_for_supplier_title', { supplier: rackData.supplierName })}
          </p>
          <p className="text-xs text-slate-400 mb-3">
            {t('wizard.no_frames_for_supplier_hint')}
          </p>
          <Button
            size="sm"
            icon={ExternalLink}
            onClick={() => openEditor('/editors/frames')}
          >
            {t('wizard.open_frame_editor')}
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-slate-400">
            {t('wizard.highest_beam_elevation_note', { height: highestBeamElevation })}
          </p>
          {selectedFrameIncompatible && (
            <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-200 text-sm">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">{t('wizard.frame_incompatible_warning')}</p>
                <p className="text-xs mt-0.5">
                  {t('wizard.frame_incompatible_detail', { height: selectedFrame?.uprightHeight || selectedFrame?.height, elevation: highestBeamElevation })}
                </p>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1">
            {filteredFrames.map((frame) => {
              const isSelected = rackData.frameId === frame.id;
              const compatible = isFrameCompatible(frame);
              return (
                <div
                  key={frame.id}
                  onClick={() => handleFrameSelect(frame.id)}
                  className={`
                    flex items-center justify-between p-3 rounded-lg border cursor-pointer
                    transition-all duration-150
                    ${
                      isSelected
                        ? compatible
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-amber-500 bg-amber-500/10'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }
                  `}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{frame.name}</p>
                      {!compatible && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300 bg-amber-500/15 border border-amber-500/40 px-1.5 py-0.5 rounded">
                          <AlertTriangle size={10} />
                          {t('wizard.frame_too_short_badge')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {t('wizard.frame_dims', { height: frame.uprightHeight || frame.height, depth: frame.depth, width: frame.uprightWidth })}
                    </p>
                  </div>
                  {isSelected && (
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        compatible ? 'bg-blue-600' : 'bg-amber-600'
                      }`}
                    >
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Doc 5 §9: Quick-add new frame inline */}
            {!showNewFrame ? (
              <button
                onClick={() => setShowNewFrame(true)}
                className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-slate-600 text-slate-400 hover:text-blue-400 hover:border-blue-500/50 transition-colors"
              >
                <Plus size={16} />
                <span className="text-sm">{t('wizard.new_frame_inline_label')}</span>
              </button>
            ) : (
              <div className="p-3 rounded-lg border border-blue-500/40 bg-blue-500/5 space-y-3">
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">{t('wizard.quick_add_frame')}</p>
                <Input
                  label={t('wizard.frame_name_optional')}
                  value={newFrameData.customName}
                  onChange={(e) => setNewFrameData(p => ({ ...p, customName: e.target.value }))}
                  placeholder={t('wizard.frame_name_placeholder')}
                />
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    label={t('wizard.height_mm')}
                    type="number"
                    value={newFrameData.uprightHeight}
                    onChange={(e) => setNewFrameData(p => ({ ...p, uprightHeight: e.target.value }))}
                    placeholder={t('wizard.frame_height_placeholder')}
                  />
                  <Input
                    label={t('wizard.depth_mm')}
                    type="number"
                    value={newFrameData.depth}
                    onChange={(e) => setNewFrameData(p => ({ ...p, depth: e.target.value }))}
                    placeholder={t('wizard.frame_depth_placeholder')}
                  />
                  <Input
                    label={t('wizard.upright_w_mm')}
                    type="number"
                    value={newFrameData.uprightWidth}
                    onChange={(e) => setNewFrameData(p => ({ ...p, uprightWidth: e.target.value }))}
                    placeholder={t('wizard.upright_w_placeholder')}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={!newFrameData.uprightHeight}
                    onClick={() => {
                      const frame = addFrame({
                        supplierId: rackData.supplierId,
                        supplierName: rackData.supplierName,
                        customName: newFrameData.customName.trim(),
                        uprightHeight: Number(newFrameData.uprightHeight) || 0,
                        depth: Number(newFrameData.depth) || 0,
                        uprightWidth: Number(newFrameData.uprightWidth) || 0,
                      });
                      if (frame) {
                        // Set directly — filteredFrames is stale this render
                        setRackData(prev => ({
                          ...prev,
                          frameId: frame.id,
                          frameHeight: frame.uprightHeight || frame.height || 0,
                          frameDepth: frame.depth || 0,
                          uprightWidth: frame.uprightWidth || 0,
                          uprightDepth: frame.uprightDepth || frame.uprightWidth || 0,
                          braceType: frame.braceType || 'Z',
                        }));
                      }
                      setShowNewFrame(false);
                      setNewFrameData({ customName: '', uprightHeight: '', depth: '', uprightWidth: '' });
                    }}
                  >
                    {t('wizard.add_and_select')}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setShowNewFrame(false)}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </WizardStep>
  );

  const renderStep7 = () => (
    <WizardStep
      stepNumber={7}
      totalSteps={TOTAL_STEPS}
      title={t('wizard.step7_title')}
      description={t('wizard.step7_description')}
    >
      <Card className="!p-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <p className="text-slate-400">{t('wizard.summary_supplier')}</p>
            <p className="text-white font-medium">
              {selectedSupplier?.name || rackData.supplierName || '-'}
            </p>
          </div>
          <div>
            <p className="text-slate-400">{t('wizard.summary_rack_name')}</p>
            <p className="text-white font-medium">{rackData.name}</p>
          </div>
          <div>
            <p className="text-slate-400">{t('wizard.summary_number_of_bays')}</p>
            <p className="text-white font-medium">{rackData.numberOfBays}</p>
          </div>
          <div>
            <p className="text-slate-400">{t('wizard.summary_bay_length')}</p>
            <p className="text-white font-medium">
              {selectedBeam ? `${selectedBeam.name} (${selectedBeam.length}mm)` : `${rackData.bayLength}mm`}
            </p>
          </div>
          <div>
            <p className="text-slate-400">{t('wizard.summary_beam_type')}</p>
            <p className="text-white font-medium">
              {BEAM_TYPE_LABEL[rackData.beamType] || rackData.beamType || '-'}
            </p>
          </div>
          <div>
            <p className="text-slate-400">{t('wizard.summary_number_of_levels')}</p>
            <p className="text-white font-medium">{rackData.levels}</p>
          </div>
          <div>
            <p className="text-slate-400">{t('wizard.summary_first_elevation')}</p>
            <p className="text-white font-medium">{rackData.firstElevation}mm</p>
          </div>
          <div>
            <p className="text-slate-400">{t('wizard.summary_level_spacing')}</p>
            <p className="text-white font-medium">
              {rackData.useIndividualHeights ? t('wizard.summary_level_spacing_individual') : `${rackData.levelSpacing}mm`}
            </p>
          </div>
          <div>
            <p className="text-slate-400">{t('wizard.summary_frame')}</p>
            <p className="text-white font-medium">
              {selectedFrame ? selectedFrame.name : '-'}
            </p>
          </div>
          <div>
            <p className="text-slate-400">{t('wizard.summary_frame_dimensions')}</p>
            <p className="text-white font-medium">
              {selectedFrame
                ? `${selectedFrame.uprightHeight || selectedFrame.height}mm H x ${selectedFrame.depth}mm D`
                : '-'}
            </p>
          </div>
        </div>
      </Card>
      {selectedFrameIncompatible && (
        <div className="mt-3 flex items-start gap-2 p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-200 text-sm">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <p className="text-xs">
            {t('wizard.summary_warning_frame_short', { height: selectedFrame?.uprightHeight || selectedFrame?.height, elevation: highestBeamElevation })}
          </p>
        </div>
      )}
    </WizardStep>
  );

  // ─── Step Map ───────────────────────────────────────────────────────

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      case 7: return renderStep7();
      default: return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t('wizard.edit_rack_title') : t('wizard.create_rack_title')}
      size="lg"
    >
      <div className="flex flex-col gap-6">
        {renderCurrentStep()}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between border-t border-slate-700 pt-4">
          <Button
            variant="ghost"
            onClick={goBack}
            disabled={currentStep === 1}
          >
            {t('common.back')}
          </Button>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              {t('common.cancel')}
            </Button>

            {currentStep < TOTAL_STEPS ? (
              <Button
                onClick={goNext}
                disabled={!isStepValid(currentStep)}
              >
                {t('common.next')}
              </Button>
            ) : (
              <Button
                onClick={handleConfirm}
                disabled={!isStepValid(currentStep)}
              >
                {isEditing ? t('wizard.update_rack') : t('wizard.create_rack')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
