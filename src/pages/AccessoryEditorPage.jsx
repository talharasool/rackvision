import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, Copy, Search } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Card from '../components/ui/Card';
import useAccessoryDatabaseStore, { ACCESSORY_CATEGORIES } from '../stores/accessoryDatabaseStore';
import useSupplierStore from '../stores/supplierStore';

const emptyForm = {
  name: '',
  description: '',
  category: 'other',
  supplierId: '',
  supplierName: '',
  supplierCode: '',
};

export default function AccessoryEditorPage() {
  const navigate = useNavigate();
  const { accessories, addAccessory, updateAccessory, deleteAccessory, duplicateAccessory } = useAccessoryDatabaseStore();
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

  const handleEdit = (acc) => {
    setEditingId(acc.id);
    setForm({
      name: acc.name || '',
      description: acc.description || '',
      category: acc.category || 'other',
      supplierId: acc.supplierId || '',
      supplierName: acc.supplierName || '',
      supplierCode: acc.supplierCode || '',
    });
    setShowForm(true);
  };

  const handleDuplicate = (acc) => {
    const dup = duplicateAccessory(acc.id);
    if (dup) handleEdit(dup);
  };

  const validateForm = () => {
    const errs = {};
    if (!form.name.trim()) {
      errs.name = 'Name is required';
    }
    if (!form.supplierId) {
      errs.supplierId = 'Supplier is required';
    }
    return errs;
  };

  const handleSave = () => {
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    if (editingId) {
      updateAccessory(editingId, form);
    } else {
      addAccessory(form);
    }
    resetForm();
  };

  const handleSupplierChange = (supplierId) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    setField('supplierId', supplierId);
    setField('supplierName', supplier?.name || '');
  };

  const filteredAccessories = accessories.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.supplierName?.toLowerCase().includes(search.toLowerCase()) ||
    a.category?.toLowerCase().includes(search.toLowerCase())
  );

  const supplierOptions = suppliers.map((s) => ({ value: s.id, label: s.name }));
  const categoryLabel = (cat) => ACCESSORY_CATEGORIES.find((c) => c.value === cat)?.label || cat;

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
              title={showForm ? 'Back to accessory list' : 'Back to home'}
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Accessory Editor</h1>
              <p className="text-sm text-slate-400">Manage accessory database</p>
            </div>
          </div>
          {!showForm && (
            <Button onClick={handleNew} icon={Plus}>New Accessory</Button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              {editingId ? 'Edit Accessory' : 'New Accessory'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Name"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="e.g. Pallet Support Bar 2700mm"
                  required
                  error={formErrors.name}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Optional description or notes"
                  rows={2}
                  className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 bg-slate-800 border border-slate-600 outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-y"
                />
              </div>
              <Select
                label="Category"
                value={form.category}
                onChange={(e) => setField('category', e.target.value)}
                options={ACCESSORY_CATEGORIES}
              />
              <Select
                label="Supplier"
                value={form.supplierId}
                onChange={(e) => handleSupplierChange(e.target.value)}
                options={supplierOptions}
                placeholder="Select supplier"
                required
                error={formErrors.supplierId}
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
                {editingId ? 'Update Accessory' : 'Save Accessory'}
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
                placeholder="Search accessories..."
              />
            </div>

            <h2 className="text-lg font-semibold text-white mb-3">
              Accessories ({filteredAccessories.length})
            </h2>

            {filteredAccessories.length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-slate-500">
                  {accessories.length === 0
                    ? 'No accessories in database. Create your first one.'
                    : 'No accessories match your search.'}
                </p>
              </Card>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredAccessories.map((acc) => (
                  <Card key={acc.id} className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white font-medium">{acc.name}</span>
                        {acc.description && (
                          <span className="text-xs text-slate-500 line-clamp-1">{acc.description}</span>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                          <span>{categoryLabel(acc.category)}</span>
                          {acc.supplierName && <span>{acc.supplierName}</span>}
                          {acc.supplierCode && <span>Code: {acc.supplierCode}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleDuplicate(acc)}>
                          <Copy size={14} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(acc)}>
                          <Pencil size={14} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteAccessory(acc.id)}>
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
