import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, Pencil, Trash2, Copy } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Card from '../components/ui/Card';
import useFrameDatabaseStore, { FRAME_TYPES, generateFrameName } from '../stores/frameDatabaseStore';
import { FINISH_TYPES } from '../stores/beamDatabaseStore';
import useSupplierStore from '../stores/supplierStore';

const emptyForm = {
  customName: '',
  description: '',
  supplierId: '',
  supplierName: '',
  frameType: 'welded',
  uprightDescription: '',
  uprightHeight: '',
  uprightWidth: '',
  uprightDepth: '',
  braceType: 'Z',
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
  const { t } = useTranslation();
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
      customName: frame.customName || '',
      description: frame.description || '',
      supplierId: frame.supplierId,
      supplierName: frame.supplierName,
      frameType: frame.frameType,
      uprightDescription: frame.uprightDescription || '',
      uprightHeight: frame.uprightHeight || '',
      uprightWidth: frame.uprightWidth || '',
      uprightDepth: frame.uprightDepth || frame.uprightWidth || '',
      braceType: frame.braceType || 'Z',
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
      errs.supplierId = t('editors.error_frame_supplier_required');
    }

    if (!form.uprightHeight || uprightHeight <= 0) {
      errs.uprightHeight = t('editors.error_upright_height_required');
    } else if (uprightHeight > 20000) {
      errs.uprightHeight = t('editors.error_upright_height_too_large');
    }

    if (!form.uprightWidth || uprightWidth <= 0) {
      errs.uprightWidth = t('editors.error_upright_width_required');
    } else if (uprightWidth > 500) {
      errs.uprightWidth = t('editors.error_upright_width_too_large');
    }

    const uprightDepth = Number(form.uprightDepth);
    if (form.uprightDepth && (uprightDepth <= 0 || uprightDepth > 500)) {
      errs.uprightDepth = t('editors.error_upright_depth_range');
    }

    if (!form.depth || depth <= 0) {
      errs.depth = t('editors.error_frame_depth_required');
    } else if (depth > 5000) {
      errs.depth = t('editors.error_frame_depth_too_large');
    }

    if (form.diagonalQty && (diagonalQty < 0 || !Number.isInteger(diagonalQty))) {
      errs.diagonalQty = t('editors.error_diagonal_qty');
    }

    if (form.crossMemberQty && (crossMemberQty < 0 || !Number.isInteger(crossMemberQty))) {
      errs.crossMemberQty = t('editors.error_cross_member_qty');
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
      uprightDepth: Number(form.uprightDepth) || Number(form.uprightWidth) || 0,
      braceType: form.braceType || 'Z',
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
              title={showForm ? t('editors.back_to_frame_list_title') : t('editors.back_to_home_title')}
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('editors.frame_database_editor_title')}</h1>
              <p className="text-sm text-slate-400">{t('editors.frame_database_editor_subtitle')}</p>
            </div>
          </div>
          {!showForm && (
            <Button onClick={handleNew} icon={Plus}>{t('editors.new_frame_button')}</Button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              {editingId ? t('editors.edit_frame_form_title') : t('editors.new_frame_form_title')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label={t('editors.frame_name_label')}
                  value={form.customName}
                  onChange={(e) => setField('customName', e.target.value)}
                  placeholder={generateFrameName({
                    frameType: form.frameType,
                    height: form.uprightHeight || '...',
                    depth: form.depth || '...',
                    supplierName: form.supplierName,
                  })}
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  {t('editors.frame_name_autogenerate_hint')}
                </p>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">{t('common.description')}</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder={t('editors.frame_description_placeholder')}
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
                label={t('editors.frame_type_label')}
                value={form.frameType}
                onChange={(e) => setField('frameType', e.target.value)}
                options={FRAME_TYPES}
                required
              />

              {/* Upright section */}
              <div className="sm:col-span-2">
                <p className="text-sm text-slate-400 mb-2 font-medium">{t('editors.upright_section_label')}</p>
              </div>
              <Input
                label={t('common.description')}
                value={form.uprightDescription}
                onChange={(e) => setField('uprightDescription', e.target.value)}
                placeholder={t('editors.upright_description_placeholder')}
                className="sm:col-span-2"
              />
              <Input
                label={t('editors.upright_height_mm_label')}
                type="number"
                value={form.uprightHeight}
                onChange={(e) => setField('uprightHeight', e.target.value)}
                placeholder={t('editors.upright_height_mm_placeholder')}
                required
                min={1}
                max={20000}
                error={formErrors.uprightHeight}
              />
              <Input
                label={t('editors.upright_width_label')}
                type="number"
                value={form.uprightWidth}
                onChange={(e) => setField('uprightWidth', e.target.value)}
                placeholder={t('editors.upright_width_placeholder')}
                required
                min={1}
                max={500}
                error={formErrors.uprightWidth}
              />
              <Input
                label={t('editors.upright_depth_label')}
                type="number"
                value={form.uprightDepth}
                onChange={(e) => setField('uprightDepth', e.target.value)}
                placeholder={t('editors.upright_depth_placeholder')}
                min={1}
                max={500}
                error={formErrors.uprightDepth}
              />

              {/* Frame dimensions */}
              <div className="sm:col-span-2">
                <p className="text-sm text-slate-400 mb-2 font-medium">{t('editors.frame_dimensions_section')}</p>
              </div>
              <Input
                label={t('editors.frame_height_equals_upright')}
                type="number"
                value={form.uprightHeight}
                disabled
              />
              <Input
                label={t('editors.frame_depth_mm_label')}
                type="number"
                value={form.depth}
                onChange={(e) => setField('depth', e.target.value)}
                placeholder={t('editors.frame_depth_mm_placeholder')}
                required
                min={1}
                max={5000}
                error={formErrors.depth}
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
                  placeholder={t('editors.paint_color_ral_placeholder')}
                />
              )}

              {/* Diagonals & Cross Members */}
              <div className="sm:col-span-2">
                <p className="text-sm text-slate-400 mb-2 font-medium">{t('editors.bracing_section')}</p>
              </div>
              <Select
                label={t('editors.brace_pattern_label')}
                value={form.braceType}
                onChange={(e) => setField('braceType', e.target.value)}
                options={[
                  { value: 'Z', label: t('editors.brace_z') },
                  { value: 'D', label: t('editors.brace_d') },
                  { value: 'K', label: t('editors.brace_k') },
                  { value: 'X', label: t('editors.brace_x') },
                ]}
              />
              <Input
                label={t('editors.diagonal_qty_label')}
                type="number"
                value={form.diagonalQty}
                onChange={(e) => setField('diagonalQty', e.target.value)}
                placeholder={t('editors.diagonal_qty_placeholder')}
                min={0}
                error={formErrors.diagonalQty}
              />
              <Input
                label={t('editors.diagonal_details_label')}
                value={form.diagonalDetails}
                onChange={(e) => setField('diagonalDetails', e.target.value)}
                placeholder={t('editors.diagonal_details_placeholder')}
              />
              <Input
                label={t('editors.cross_member_qty_label')}
                type="number"
                value={form.crossMemberQty}
                onChange={(e) => setField('crossMemberQty', e.target.value)}
                placeholder={t('editors.cross_member_qty_placeholder')}
                min={0}
                error={formErrors.crossMemberQty}
              />
              <Input
                label={t('editors.cross_member_details_label')}
                value={form.crossMemberDetails}
                onChange={(e) => setField('crossMemberDetails', e.target.value)}
                placeholder={t('editors.cross_member_details_placeholder')}
              />

              <Input
                label={t('editors.supplier_code_label')}
                value={form.supplierCode}
                onChange={(e) => setField('supplierCode', e.target.value)}
                placeholder={t('common.supplier_code_placeholder')}
              />
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={handleSave}>
                {editingId ? t('editors.update_frame') : t('editors.save_frame')}
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
                placeholder={t('editors.search_frames_placeholder')}
              />
            </div>

            <h2 className="text-lg font-semibold text-white mb-3">
              {t('editors.frames_list_heading', { n: filteredFrames.length })}
            </h2>

            {filteredFrames.length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-slate-500">
                  {frames.length === 0
                    ? t('editors.no_frames_db')
                    : t('editors.no_frames_search')}
                </p>
              </Card>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredFrames.map((frame) => (
                  <Card key={frame.id} className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white font-medium">{frame.name}</span>
                        {frame.description && (
                          <span className="text-xs text-slate-500 line-clamp-1">{frame.description}</span>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                          <span>{frameTypeLabel(frame.frameType)}</span>
                          <span>{frame.height}×{frame.depth} mm</span>
                          <span>{t('editors.upright_section_label')}: {frame.uprightWidth}mm</span>
                          {frame.supplierName && <span>{frame.supplierName}</span>}
                          {frame.diagonalQty > 0 && <span>{frame.diagonalQty} diag.</span>}
                          {frame.crossMemberQty > 0 && <span>{frame.crossMemberQty} cross</span>}
                          {frame.supplierCode && <span>{t('common.code_label')} {frame.supplierCode}</span>}
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
