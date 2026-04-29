import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      errs.supplierId = t('editors.error_supplier_required');
    }

    if (!form.length || length <= 0) {
      errs.length = t('editors.error_length_required');
    } else if (length > 10000) {
      errs.length = t('editors.error_length_too_large');
    }

    if (!form.height || height <= 0) {
      errs.height = t('editors.error_height_required');
    } else if (height > 500) {
      errs.height = t('editors.error_height_too_large');
    }

    if (!form.depth || depth <= 0) {
      errs.depth = t('editors.error_depth_required');
    } else if (depth > 500) {
      errs.depth = t('editors.error_depth_too_large');
    }

    if (!form.thickness || thickness <= 0) {
      errs.thickness = t('editors.error_thickness_required');
    } else if (thickness > 50) {
      errs.thickness = t('editors.error_thickness_too_large');
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
              title={showForm ? t('editors.back_to_beam_list_title') : t('editors.back_to_home_title')}
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('editors.beam_editor_title')}</h1>
              <p className="text-sm text-slate-400">{t('editors.beam_editor_subtitle')}</p>
            </div>
          </div>
          {!showForm && (
            <Button onClick={handleNew} icon={Plus}>{t('editors.new_beam_button')}</Button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              {editingId ? t('editors.edit_beam_form_title') : t('editors.new_beam_form_title')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label={t('editors.beam_name_label')}
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
                  {t('editors.beam_name_autogenerate_hint')}
                </p>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">{t('editors.beam_description_label')}</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder={t('editors.beam_description_placeholder')}
                  rows={2}
                  className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 bg-slate-800 border border-slate-600 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-y"
                />
              </div>
              <Select
                label={t('common.supplier')}
                value={form.supplierId}
                onChange={(e) => handleSupplierChange(e.target.value)}
                options={supplierOptions}
                placeholder={t('common.select_supplier_placeholder')}
                required
                error={formErrors.supplierId}
              />
              <Select
                label={t('editors.beam_type_label')}
                value={form.beamType}
                onChange={(e) => setField('beamType', e.target.value)}
                options={BEAM_TYPES}
                required
              />

              <Input
                label={t('editors.length_mm_label')}
                type="number"
                value={form.length}
                onChange={(e) => setField('length', e.target.value)}
                placeholder={t('editors.length_mm_placeholder')}
                required
                min={1}
                max={10000}
                error={formErrors.length}
              />
              <Input
                label={t('editors.height_mm_label')}
                type="number"
                value={form.height}
                onChange={(e) => setField('height', e.target.value)}
                placeholder={t('editors.height_mm_placeholder')}
                required
                min={1}
                max={500}
                error={formErrors.height}
              />
              <Input
                label={t('editors.depth_mm_label')}
                type="number"
                value={form.depth}
                onChange={(e) => setField('depth', e.target.value)}
                placeholder={t('editors.depth_mm_placeholder')}
                required
                min={1}
                max={500}
                error={formErrors.depth}
              />
              <Input
                label={t('editors.thickness_mm_label')}
                type="number"
                value={form.thickness}
                onChange={(e) => setField('thickness', e.target.value)}
                placeholder={t('editors.thickness_mm_placeholder')}
                required
                min={0.1}
                max={50}
                step={0.1}
                error={formErrors.thickness}
              />

              <Select
                label={t('editors.finish_label')}
                value={form.finish}
                onChange={(e) => setField('finish', e.target.value)}
                options={FINISH_TYPES}
              />
              {form.finish === 'painted' && (
                <Input
                  label={t('editors.paint_color_label')}
                  value={form.finishColor}
                  onChange={(e) => setField('finishColor', e.target.value)}
                  placeholder={t('editors.paint_color_placeholder_beam')}
                />
              )}

              <div className="sm:col-span-2">
                <p className="text-sm text-slate-400 mb-2">{t('editors.optional_features_label')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    value={form.feature1}
                    onChange={(e) => setField('feature1', e.target.value)}
                    placeholder={t('editors.feature1_placeholder')}
                  />
                  <Input
                    value={form.feature2}
                    onChange={(e) => setField('feature2', e.target.value)}
                    placeholder={t('editors.feature2_placeholder')}
                  />
                  <Input
                    value={form.feature3}
                    onChange={(e) => setField('feature3', e.target.value)}
                    placeholder={t('editors.feature3_placeholder')}
                  />
                </div>
              </div>

              <Input
                label={t('editors.supplier_code_label')}
                value={form.supplierCode}
                onChange={(e) => setField('supplierCode', e.target.value)}
                placeholder={t('common.supplier_code_placeholder')}
              />
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={handleSave}>
                {editingId ? t('editors.update_beam') : t('editors.save_beam')}
              </Button>
              <Button variant="ghost" onClick={resetForm}>{t('common.cancel')}</Button>
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
                placeholder={t('editors.search_beams_placeholder')}
              />
            </div>

            <h2 className="text-lg font-semibold text-white mb-3">
              {t('editors.beams_list_heading', { n: filteredBeams.length })}
            </h2>

            {filteredBeams.length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-slate-500">
                  {beams.length === 0
                    ? t('editors.no_beams_db')
                    : t('editors.no_beams_search')}
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
                          {beam.supplierCode && <span>{t('common.code_label')} {beam.supplierCode}</span>}
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
