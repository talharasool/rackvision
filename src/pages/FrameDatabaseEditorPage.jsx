import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, Copy } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Card from '../components/ui/Card';
import useFrameDatabaseStore, { FRAME_TYPES } from '../stores/frameDatabaseStore';
import { FINISH_TYPES } from '../stores/beamDatabaseStore';
import useSupplierStore from '../stores/supplierStore';

const emptyForm = {
  supplierId: '',
  supplierName: '',
  frameType: 'welded',
  uprightDescription: '',
  uprightHeight: '',
  uprightWidth: '',
  depth: '',
  finish: 'painted',
  finishColor: '',
  diagonalQty: '',
  diagonalDetails: '',
  crossMemberQty: '',
  crossMemberDetails: '',
  supplierCode: '',
};

export default function FrameDatabaseEditorPage() {
  const navigate = useNavigate();
  const { frames, addFrame, updateFrame, deleteFrame, duplicateFrame } = useFrameDatabaseStore();
  const { suppliers } = useSupplierStore();

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const setField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const handleEdit = (frame) => {
    setEditingId(frame.id);
    setForm({
      supplierId: frame.supplierId,
      supplierName: frame.supplierName,
      frameType: frame.frameType,
      uprightDescription: frame.uprightDescription || '',
      uprightHeight: frame.uprightHeight || '',
      uprightWidth: frame.uprightWidth || '',
      depth: frame.depth || '',
      finish: frame.finish,
      finishColor: frame.finishColor || '',
      diagonalQty: frame.diagonalQty || '',
      diagonalDetails: frame.diagonalDetails || '',
      crossMemberQty: frame.crossMemberQty || '',
      crossMemberDetails: frame.crossMemberDetails || '',
      supplierCode: frame.supplierCode || '',
    });
    setShowForm(true);
  };

  const handleDuplicate = (frame) => {
    const dup = duplicateFrame(frame.id);
    if (dup) handleEdit(dup);
  };

  const validateFrameForm = () => {
    const errs = {};
    const uprightHeight = Number(form.uprightHeight);
    const uprightWidth = Number(form.uprightWidth);
    const depth = Number(form.depth);
    const diagonalQty = Number(form.diagonalQty);
    const crossMemberQty = Number(form.crossMemberQty);

    if (!form.supplierId) {
      errs.supplierId = 'Supplier is required';
    }

    if (!form.uprightHeight || uprightHeight <= 0) {
      errs.uprightHeight = 'Upright height is required and must be > 0';
    } else if (uprightHeight > 20000) {
      errs.uprightHeight = 'Height cannot exceed 20000mm';
    }

    if (!form.uprightWidth || uprightWidth <= 0) {
      errs.uprightWidth = 'Upright width is required and must be > 0';
    } else if (uprightWidth > 500) {
      errs.uprightWidth = 'Width cannot exceed 500mm';
    }

    if (!form.depth || depth <= 0) {
      errs.depth = 'Depth is required and must be > 0';
    } else if (depth > 5000) {
      errs.depth = 'Depth cannot exceed 5000mm';
    }

    if (form.diagonalQty && (diagonalQty < 0 || !Number.isInteger(diagonalQty))) {
      errs.diagonalQty = 'Must be a whole number >= 0';
    }

    if (form.crossMemberQty && (crossMemberQty < 0 || !Number.isInteger(crossMemberQty))) {
      errs.crossMemberQty = 'Must be a whole number >= 0';
    }

    return errs;
  };

  const handleSave = () => {
    const errs = validateFrameForm();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    const data = {
      ...form,
      uprightHeight: Number(form.uprightHeight) || 0,
      uprightWidth: Number(form.uprightWidth) || 0,
      depth: Number(form.depth) || 0,
      diagonalQty: Number(form.diagonalQty) || 0,
      crossMemberQty: Number(form.crossMemberQty) || 0,
    };

    if (editingId) {
      updateFrame(editingId, data);
    } else {
      addFrame(data);
    }
    resetForm();
  };

  const handleSupplierChange = (supplierId) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    setField('supplierId', supplierId);
    setField('supplierName', supplier?.name || '');
  };

  const filteredFrames = frames.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.supplierName?.toLowerCase().includes(search.toLowerCase())
  );

  const supplierOptions = suppliers.map((s) => ({ value: s.id, label: s.name }));
  const frameTypeLabel = (type) => FRAME_TYPES.find((t) => t.value === type)?.label || type;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (showForm ? resetForm() : navigate('/'))}
              title={showForm ? 'Back to frame list' : 'Back to home'}
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Frame Editor</h1>
              <p className="text-sm text-slate-400">Manage frame database</p>
            </div>
          </div>
          {!showForm && (
            <Button onClick={handleNew} icon={Plus}>New Frame</Button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              {editingId ? 'Edit Frame' : 'New Frame'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Supplier"
                value={form.supplierId}
                onChange={(e) => handleSupplierChange(e.target.value)}
                options={supplierOptions}
                placeholder="Select supplier"
                required
                error={formErrors.supplierId}
              />
              <Select
                label="Frame Type"
                value={form.frameType}
                onChange={(e) => setField('frameType', e.target.value)}
                options={FRAME_TYPES}
                required
              />

              {/* Upright section */}
              <div className="sm:col-span-2">
                <p className="text-sm text-slate-400 mb-2 font-medium">Upright</p>
              </div>
              <Input
                label="Description"
                value={form.uprightDescription}
                onChange={(e) => setField('uprightDescription', e.target.value)}
                placeholder="Optional description"
                className="sm:col-span-2"
              />
              <Input
                label="Height (mm)"
                type="number"
                value={form.uprightHeight}
                onChange={(e) => setField('uprightHeight', e.target.value)}
                placeholder="e.g. 6000"
                required
                min={1}
                max={20000}
                error={formErrors.uprightHeight}
              />
              <Input
                label="Width (mm)"
                type="number"
                value={form.uprightWidth}
                onChange={(e) => setField('uprightWidth', e.target.value)}
                placeholder="e.g. 100"
                required
                min={1}
                max={500}
                error={formErrors.uprightWidth}
              />

              {/* Frame dimensions */}
              <div className="sm:col-span-2">
                <p className="text-sm text-slate-400 mb-2 font-medium">Frame Dimensions</p>
              </div>
              <Input
                label="Frame Height (= Upright Height)"
                type="number"
                value={form.uprightHeight}
                disabled
              />
              <Input
                label="Depth (mm)"
                type="number"
                value={form.depth}
                onChange={(e) => setField('depth', e.target.value)}
                placeholder="e.g. 1000"
                required
                min={1}
                max={5000}
                error={formErrors.depth}
              />

              <Select
                label="Finish"
                value={form.finish}
                onChange={(e) => setField('finish', e.target.value)}
                options={FINISH_TYPES}
              />
              {form.finish === 'painted' && (
                <Input
                  label="Paint Color"
                  value={form.finishColor}
                  onChange={(e) => setField('finishColor', e.target.value)}
                  placeholder="e.g. RAL 7035 Grey"
                />
              )}

              {/* Diagonals & Cross Members */}
              <div className="sm:col-span-2">
                <p className="text-sm text-slate-400 mb-2 font-medium">Bracing</p>
              </div>
              <Input
                label="Diagonal Quantity"
                type="number"
                value={form.diagonalQty}
                onChange={(e) => setField('diagonalQty', e.target.value)}
                placeholder="e.g. 5"
                min={0}
                error={formErrors.diagonalQty}
              />
              <Input
                label="Diagonal Details"
                value={form.diagonalDetails}
                onChange={(e) => setField('diagonalDetails', e.target.value)}
                placeholder="Center distance, length, type..."
              />
              <Input
                label="Cross Member Quantity"
                type="number"
                value={form.crossMemberQty}
                onChange={(e) => setField('crossMemberQty', e.target.value)}
                placeholder="e.g. 3"
                min={0}
                error={formErrors.crossMemberQty}
              />
              <Input
                label="Cross Member Details"
                value={form.crossMemberDetails}
                onChange={(e) => setField('crossMemberDetails', e.target.value)}
                placeholder="Details..."
              />

              <Input
                label="Supplier Code"
                value={form.supplierCode}
                onChange={(e) => setField('supplierCode', e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={handleSave}>
                {editingId ? 'Update Frame' : 'Save Frame'}
              </Button>
              <Button variant="ghost" onClick={resetForm}>Cancel</Button>
            </div>
          </Card>
        )}

        {/* Search & List */}
        {!showForm && (
          <>
            <div className="mb-4">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search frames..."
              />
            </div>

            <h2 className="text-lg font-semibold text-white mb-3">
              Frames ({filteredFrames.length})
            </h2>

            {filteredFrames.length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-slate-500">
                  {frames.length === 0
                    ? 'No frames in database. Create your first one.'
                    : 'No frames match your search.'}
                </p>
              </Card>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredFrames.map((frame) => (
                  <Card key={frame.id} className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white font-medium">{frame.name}</span>
                        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                          <span>{frameTypeLabel(frame.frameType)}</span>
                          <span>{frame.height}×{frame.depth} mm</span>
                          <span>Upright: {frame.uprightWidth}mm</span>
                          {frame.supplierName && <span>{frame.supplierName}</span>}
                          {frame.diagonalQty > 0 && <span>{frame.diagonalQty} diag.</span>}
                          {frame.crossMemberQty > 0 && <span>{frame.crossMemberQty} cross</span>}
                          {frame.supplierCode && <span>Code: {frame.supplierCode}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleDuplicate(frame)}>
                          <Copy size={14} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(frame)}>
                          <Pencil size={14} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteFrame(frame.id)}>
                          <Trash2 size={14} className="text-red-400" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
