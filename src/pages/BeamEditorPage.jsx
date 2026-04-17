import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, Copy, Search } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Card from '../components/ui/Card';
import useBeamDatabaseStore, { BEAM_TYPES, FINISH_TYPES, generateBeamName } from '../stores/beamDatabaseStore';
import useSupplierStore from '../stores/supplierStore';

const emptyForm = {
  customName: '',
  description: '',
  supplierId: '',
  supplierName: '',
  beamType: 'standard-double-c',
  length: '',
  height: '',
  depth: '',
  thickness: '',
  finish: 'painted',
  finishColor: '',
  feature1: '',
  feature2: '',
  feature3: '',
  supplierCode: '',
};

export default function BeamEditorPage() {
  const navigate = useNavigate();
  const { beams, addBeam, updateBeam, deleteBeam, duplicateBeam } = useBeamDatabaseStore();
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

  const handleEdit = (beam) => {
    setEditingId(beam.id);
    setForm({
      customName: beam.customName || '',
      description: beam.description || '',
      supplierId: beam.supplierId,
      supplierName: beam.supplierName,
      beamType: beam.beamType,
      length: beam.length || '',
      height: beam.height || '',
      depth: beam.depth || '',
      thickness: beam.thickness || '',
      finish: beam.finish,
      finishColor: beam.finishColor || '',
      feature1: beam.feature1 || '',
      feature2: beam.feature2 || '',
      feature3: beam.feature3 || '',
      supplierCode: beam.supplierCode || '',
    });
    setShowForm(true);
  };

  const handleDuplicate = (beam) => {
    const dup = duplicateBeam(beam.id);
    if (dup) handleEdit(dup);
  };

  const validateBeamForm = () => {
    const errs = {};
    const length = Number(form.length);
    const height = Number(form.height);
    const depth = Number(form.depth);
    const thickness = Number(form.thickness);

    if (!form.supplierId) {
      errs.supplierId = 'Supplier is required';
    }

    if (!form.length || length <= 0) {
      errs.length = 'Length is required and must be > 0';
    } else if (length > 10000) {
      errs.length = 'Length cannot exceed 10000mm';
    }

    if (!form.height || height <= 0) {
      errs.height = 'Height is required and must be > 0';
    } else if (height > 500) {
      errs.height = 'Height cannot exceed 500mm';
    }

    if (!form.depth || depth <= 0) {
      errs.depth = 'Depth is required and must be > 0';
    } else if (depth > 500) {
      errs.depth = 'Depth cannot exceed 500mm';
    }

    if (!form.thickness || thickness <= 0) {
      errs.thickness = 'Thickness is required and must be > 0';
    } else if (thickness > 50) {
      errs.thickness = 'Thickness cannot exceed 50mm';
    }

    return errs;
  };

  const handleSave = () => {
    const errs = validateBeamForm();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    const data = {
      ...form,
      length: Number(form.length) || 0,
      height: Number(form.height) || 0,
      depth: Number(form.depth) || 0,
      thickness: Number(form.thickness) || 0,
    };

    if (editingId) {
      updateBeam(editingId, data);
    } else {
      addBeam(data);
    }
    resetForm();
  };

  const handleSupplierChange = (supplierId) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    setField('supplierId', supplierId);
    setField('supplierName', supplier?.name || '');
  };

  const filteredBeams = beams.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.supplierName?.toLowerCase().includes(search.toLowerCase())
  );

  const supplierOptions = suppliers.map((s) => ({ value: s.id, label: s.name }));

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
              title={showForm ? 'Back to beam list' : 'Back to home'}
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Beam Editor</h1>
              <p className="text-sm text-slate-400">Manage beam database</p>
            </div>
          </div>
          {!showForm && (
            <Button onClick={handleNew} icon={Plus}>New Beam</Button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              {editingId ? 'Edit Beam' : 'New Beam'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Beam Name"
                  value={form.customName}
                  onChange={(e) => setField('customName', e.target.value)}
                  placeholder={generateBeamName({
                    beamType: form.beamType,
                    length: form.length || '...',
                    height: form.height || '...',
                    supplierName: form.supplierName,
                  })}
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Leave blank to auto-generate from type, dimensions, and supplier
                </p>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Optional beam description or notes"
                  rows={2}
                  className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 bg-slate-800 border border-slate-600 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-y"
                />
              </div>
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
                label="Beam Type"
                value={form.beamType}
                onChange={(e) => setField('beamType', e.target.value)}
                options={BEAM_TYPES}
                required
              />

              <Input
                label="Length (mm)"
                type="number"
                value={form.length}
                onChange={(e) => setField('length', e.target.value)}
                placeholder="e.g. 2700"
                required
                min={1}
                max={10000}
                error={formErrors.length}
              />
              <Input
                label="Height (mm)"
                type="number"
                value={form.height}
                onChange={(e) => setField('height', e.target.value)}
                placeholder="e.g. 50"
                required
                min={1}
                max={500}
                error={formErrors.height}
              />
              <Input
                label="Depth (mm)"
                type="number"
                value={form.depth}
                onChange={(e) => setField('depth', e.target.value)}
                placeholder="e.g. 40"
                required
                min={1}
                max={500}
                error={formErrors.depth}
              />
              <Input
                label="Thickness (mm)"
                type="number"
                value={form.thickness}
                onChange={(e) => setField('thickness', e.target.value)}
                placeholder="e.g. 1.5"
                required
                min={0.1}
                max={50}
                step={0.1}
                error={formErrors.thickness}
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
                  placeholder="e.g. RAL 5010 Blue"
                />
              )}

              <div className="sm:col-span-2">
                <p className="text-sm text-slate-400 mb-2">Optional Features / Accessories</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    value={form.feature1}
                    onChange={(e) => setField('feature1', e.target.value)}
                    placeholder="e.g. Shelf support angle"
                  />
                  <Input
                    value={form.feature2}
                    onChange={(e) => setField('feature2', e.target.value)}
                    placeholder="e.g. Tie rod plate"
                  />
                  <Input
                    value={form.feature3}
                    onChange={(e) => setField('feature3', e.target.value)}
                    placeholder="e.g. Bracing plate"
                  />
                </div>
              </div>

              <Input
                label="Supplier Code"
                value={form.supplierCode}
                onChange={(e) => setField('supplierCode', e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={handleSave}>
                {editingId ? 'Update Beam' : 'Save Beam'}
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
                placeholder="Search beams..."
              />
            </div>

            <h2 className="text-lg font-semibold text-white mb-3">
              Beams ({filteredBeams.length})
            </h2>

            {filteredBeams.length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-slate-500">
                  {beams.length === 0
                    ? 'No beams in database. Create your first one.'
                    : 'No beams match your search.'}
                </p>
              </Card>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredBeams.map((beam) => (
                  <Card key={beam.id} className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white font-medium">{beam.name}</span>
                        {beam.description && (
                          <span className="text-xs text-slate-500 line-clamp-1">{beam.description}</span>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                          <span>{beam.length}×{beam.height}×{beam.depth} mm</span>
                          {beam.supplierName && <span>{beam.supplierName}</span>}
                          <span className="capitalize">{beam.finish}{beam.finishColor ? ` (${beam.finishColor})` : ''}</span>
                          {beam.supplierCode && <span>Code: {beam.supplierCode}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleDuplicate(beam)}>
                          <Copy size={14} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(beam)}>
                          <Pencil size={14} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteBeam(beam.id)}>
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
