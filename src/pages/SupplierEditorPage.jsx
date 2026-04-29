import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, Pencil, Trash2, Palette } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import useSupplierStore from '../stores/supplierStore';

const PRESET_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#eab308', '#a855f7',
  '#ec4899', '#f97316', '#06b6d4', '#64748b', '#84cc16',
  '#14b8a6', '#f43f5e', '#8b5cf6', '#0ea5e9', '#d946ef',
];

export default function SupplierEditorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useSupplierStore();

  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [error, setError] = useState('');

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setColor('#3b82f6');
    setError('');
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError(t('editors.error_supplier_name_required'));
      return;
    }

    const duplicate = suppliers.find(
      (s) => s.name.toLowerCase() === name.trim().toLowerCase() && s.id !== editingId
    );
    if (duplicate) {
      setError(t('editors.error_supplier_name_duplicate'));
      return;
    }

    if (editingId) {
      updateSupplier(editingId, { name: name.trim(), color });
    } else {
      addSupplier({ name: name.trim(), color });
    }
    resetForm();
  };

  const handleEdit = (supplier) => {
    setEditingId(supplier.id);
    setName(supplier.name);
    setColor(supplier.color);
    setError('');
  };

  const handleDelete = (id) => {
    if (editingId === id) resetForm();
    deleteSupplier(id);
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">{t('editors.supplier_editor_title')}</h1>
            <p className="text-sm text-slate-400">{t('editors.supplier_editor_subtitle')}</p>
          </div>
        </div>

        {/* Form */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            {editingId ? t('editors.edit_supplier_form_title') : t('editors.new_supplier_form_title')}
          </h2>
          <div className="flex flex-col gap-4">
            <Input
              label={t('editors.supplier_name_label')}
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder={t('editors.supplier_name_placeholder')}
              required
              error={error}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-slate-400">{t('editors.layout_color_label')}</label>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg border-2 border-slate-600 shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-md border-2 transition-all ${
                        color === c ? 'border-white scale-110' : 'border-slate-600 hover:border-slate-400'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <label className="text-xs text-slate-500">{t('editors.custom_color_label')}</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-6 rounded cursor-pointer bg-transparent border-0"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave}>
                {editingId ? t('editors.update_supplier') : t('editors.add_supplier')}
              </Button>
              {editingId && (
                <Button variant="ghost" onClick={resetForm}>{t('common.cancel')}</Button>
              )}
            </div>
          </div>
        </Card>

        {/* List */}
        <h2 className="text-lg font-semibold text-white mb-3">
          {t('editors.suppliers_list_heading', { n: suppliers.length })}
        </h2>
        {suppliers.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-slate-500">{t('editors.no_suppliers_yet')}</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {suppliers.map((supplier) => (
              <Card key={supplier.id} className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg border border-slate-600"
                    style={{ backgroundColor: supplier.color }}
                  />
                  <span className="text-white font-medium">{supplier.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(supplier)}>
                    <Pencil size={14} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(supplier.id)}>
                    <Trash2 size={14} className="text-red-400" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
