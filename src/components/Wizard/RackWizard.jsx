import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Minus, Check } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Card from '../ui/Card';
import WizardStep from './WizardStep';
import manufacturers, { addManufacturer } from '../../data/manufacturers';
import beams from '../../data/beams';
import frames from '../../data/frames';
import useRackStore from '../../stores/rackStore';

const TOTAL_STEPS = 7;

const initialRackData = {
  manufacturer: '',
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
};

export default function RackWizard({ isOpen, onClose, areaId, editRack }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [rackData, setRackData] = useState(initialRackData);
  const [newManufacturer, setNewManufacturer] = useState('');
  const [manufacturerList, setManufacturerList] = useState(manufacturers);

  const { createRack, updateRack } = useRackStore();

  const isEditing = !!editRack;

  // Pre-fill data when editing
  useEffect(() => {
    if (editRack && isOpen) {
      setRackData({
        manufacturer: editRack.manufacturer || '',
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
      });
      setCurrentStep(1);
    } else if (isOpen) {
      setRackData(initialRackData);
      setCurrentStep(1);
    }
  }, [editRack, isOpen]);

  // Keep manufacturer list in sync
  useEffect(() => {
    setManufacturerList([...manufacturers]);
  }, [isOpen]);

  // Update field helper
  const updateField = (field, value) => {
    setRackData((prev) => ({ ...prev, [field]: value }));
  };

  // Auto-suggest rack name
  const suggestedName = useMemo(() => {
    const mfr = manufacturerList.find((m) => m.id === rackData.manufacturer);
    const mfrName = mfr ? mfr.name : '';
    const bays = rackData.numberOfBays;
    return mfrName ? `${mfrName}-${bays}Bay-001` : '';
  }, [rackData.manufacturer, rackData.numberOfBays, manufacturerList]);

  // Handle adding a new manufacturer
  const handleAddManufacturer = () => {
    const trimmed = newManufacturer.trim();
    if (!trimmed) return;
    const added = addManufacturer(trimmed);
    setManufacturerList([...manufacturers]);
    updateField('manufacturer', added.id);
    setNewManufacturer('');
  };

  // Handle beam selection
  const handleBeamSelect = (beamId) => {
    const beam = beams.find((b) => b.id === beamId);
    if (beam) {
      updateField('beamId', beam.id);
      updateField('bayLength', beam.length);
      updateField('beamType', beam.type);
    }
  };

  // Handle frame selection
  const handleFrameSelect = (frameId) => {
    const frame = frames.find((f) => f.id === frameId);
    if (frame) {
      updateField('frameId', frame.id);
      updateField('frameHeight', frame.height);
      updateField('frameDepth', frame.depth);
      updateField('uprightWidth', frame.uprightWidth);
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
        return !!rackData.manufacturer;
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
    // Remove wizard-only fields
    delete payload.useIndividualHeights;

    if (isEditing) {
      updateRack(editRack.id, payload);
    } else {
      createRack(areaId, payload);
    }
    onClose();
  };

  // Navigation
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

  // Group beams by type
  const beamsByType = useMemo(() => {
    const grouped = {};
    beams.forEach((beam) => {
      if (!grouped[beam.type]) grouped[beam.type] = [];
      grouped[beam.type].push(beam);
    });
    return grouped;
  }, []);

  // Selected beam/frame for display
  const selectedBeam = beams.find((b) => b.id === rackData.beamId);
  const selectedFrame = frames.find((f) => f.id === rackData.frameId);
  const selectedManufacturer = manufacturerList.find((m) => m.id === rackData.manufacturer);

  // ─── Step Renderers ─────────────────────────────────────────────────

  const renderStep1 = () => (
    <WizardStep
      stepNumber={1}
      totalSteps={TOTAL_STEPS}
      title="Select Manufacturer"
      description="Choose the rack manufacturer or add a new one."
    >
      <div className="flex flex-col gap-4">
        <Select
          label="Manufacturer"
          value={rackData.manufacturer}
          onChange={(e) => updateField('manufacturer', e.target.value)}
          placeholder="Select a manufacturer..."
          required
          options={manufacturerList.map((m) => ({ value: m.id, label: m.name }))}
        />

        <div className="flex items-center gap-2 pt-2">
          <p className="text-xs text-slate-500">or</p>
        </div>

        <div className="flex gap-2">
          <Input
            label="Add New Manufacturer"
            value={newManufacturer}
            onChange={(e) => setNewManufacturer(e.target.value)}
            placeholder="Enter manufacturer name..."
            className="flex-1"
          />
          <div className="flex items-end">
            <Button
              onClick={handleAddManufacturer}
              disabled={!newManufacturer.trim()}
              size="md"
              icon={Plus}
            >
              Add
            </Button>
          </div>
        </div>
      </div>
    </WizardStep>
  );

  const renderStep2 = () => (
    <WizardStep
      stepNumber={2}
      totalSteps={TOTAL_STEPS}
      title="Number of Bays"
      description="How many bays does this rack have?"
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
        <p className="text-xs text-slate-500">Between 1 and 50 bays</p>
      </div>
    </WizardStep>
  );

  const renderStep3 = () => (
    <WizardStep
      stepNumber={3}
      totalSteps={TOTAL_STEPS}
      title="Rack Name"
      description="Give this rack a name for easy identification."
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Rack Name"
          value={rackData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="Enter rack name..."
          required
        />
        {suggestedName && rackData.name !== suggestedName && (
          <button
            type="button"
            className="text-left text-sm text-blue-400 hover:text-blue-300 transition-colors"
            onClick={() => updateField('name', suggestedName)}
          >
            Suggestion: <span className="font-medium">{suggestedName}</span>
          </button>
        )}
      </div>
    </WizardStep>
  );

  const renderStep4 = () => (
    <WizardStep
      stepNumber={4}
      totalSteps={TOTAL_STEPS}
      title="Bay Length (Beam Selection)"
      description="Select a beam type to define the bay length."
    >
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
                        Length: {beam.length}mm
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">
                        {beam.capacity}kg
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </WizardStep>
  );

  const renderStep5 = () => (
    <WizardStep
      stepNumber={5}
      totalSteps={TOTAL_STEPS}
      title="Rack Elevations"
      description="Configure the vertical layout of your rack levels."
    >
      <div className="flex flex-col gap-4">
        {/* Number of levels */}
        <div className="flex items-center gap-4">
          <label className="text-sm text-slate-400 w-32">Number of Levels</label>
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
          label="First Elevation Height (mm)"
          type="number"
          value={rackData.firstElevation}
          onChange={(e) => updateField('firstElevation', parseInt(e.target.value, 10) || 0)}
          placeholder="0"
        />

        {/* Spacing mode toggle */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-400">Level Heights</label>
          <button
            type="button"
            onClick={() => updateField('useIndividualHeights', false)}
            className={`px-3 py-1 text-xs rounded-l-md border transition-colors ${
              !rackData.useIndividualHeights
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-slate-800 border-slate-600 text-slate-400'
            }`}
          >
            Uniform Spacing
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
            Individual Heights
          </button>
        </div>

        {/* Uniform spacing input */}
        {!rackData.useIndividualHeights && (
          <Input
            label="Level Spacing (mm)"
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
                label={`Level ${i + 1} Height (mm)`}
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
      title="Frame Selection"
      description="Select the upright frame specification."
    >
      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
        {frames.map((frame) => {
          const isSelected = rackData.frameId === frame.id;
          return (
            <div
              key={frame.id}
              onClick={() => handleFrameSelect(frame.id)}
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
                <p className="text-sm font-medium text-white">{frame.name}</p>
                <p className="text-xs text-slate-400">
                  Height: {frame.height}mm | Depth: {frame.depth}mm | Upright: {frame.uprightWidth}mm
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">{frame.capacity}kg</span>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </WizardStep>
  );

  const renderStep7 = () => (
    <WizardStep
      stepNumber={7}
      totalSteps={TOTAL_STEPS}
      title="Summary"
      description="Review your rack configuration before confirming."
    >
      <Card className="!p-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <p className="text-slate-400">Manufacturer</p>
            <p className="text-white font-medium">
              {selectedManufacturer?.name || rackData.manufacturer}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Rack Name</p>
            <p className="text-white font-medium">{rackData.name}</p>
          </div>
          <div>
            <p className="text-slate-400">Number of Bays</p>
            <p className="text-white font-medium">{rackData.numberOfBays}</p>
          </div>
          <div>
            <p className="text-slate-400">Bay Length</p>
            <p className="text-white font-medium">
              {selectedBeam ? `${selectedBeam.name} (${selectedBeam.length}mm)` : `${rackData.bayLength}mm`}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Beam Type</p>
            <p className="text-white font-medium">{rackData.beamType || '-'}</p>
          </div>
          <div>
            <p className="text-slate-400">Number of Levels</p>
            <p className="text-white font-medium">{rackData.levels}</p>
          </div>
          <div>
            <p className="text-slate-400">First Elevation</p>
            <p className="text-white font-medium">{rackData.firstElevation}mm</p>
          </div>
          <div>
            <p className="text-slate-400">Level Spacing</p>
            <p className="text-white font-medium">
              {rackData.useIndividualHeights ? 'Individual' : `${rackData.levelSpacing}mm`}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Frame</p>
            <p className="text-white font-medium">
              {selectedFrame ? selectedFrame.name : '-'}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Frame Dimensions</p>
            <p className="text-white font-medium">
              {selectedFrame
                ? `${selectedFrame.height}mm H x ${selectedFrame.depth}mm D`
                : '-'}
            </p>
          </div>
        </div>
      </Card>
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
      title={isEditing ? 'Edit Rack' : 'Create Rack'}
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
            Back
          </Button>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>

            {currentStep < TOTAL_STEPS ? (
              <Button
                onClick={goNext}
                disabled={!isStepValid(currentStep)}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleConfirm}
                disabled={!isStepValid(currentStep)}
              >
                {isEditing ? 'Update Rack' : 'Create Rack'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
