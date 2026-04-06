import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Trash2,
} from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import useInspectionStore from '../stores/inspectionStore';

const INITIAL_CLIENT = {
  reseller: '',
  endCustomer: '',
  siteAddress: '',
  city: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
};

export default function NewInspection() {
  const navigate = useNavigate();
  const { createInspection, addWorkingArea } = useInspectionStore();

  const [step, setStep] = useState(1);
  const [clientData, setClientData] = useState(INITIAL_CLIENT);
  const [areas, setAreas] = useState([]);
  const [areaName, setAreaName] = useState('');
  const [areaDescription, setAreaDescription] = useState('');

  const handleClientChange = (field) => (e) => {
    setClientData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleAddArea = () => {
    if (!areaName.trim()) return;
    setAreas((prev) => [
      ...prev,
      { tempId: Date.now(), name: areaName.trim(), description: areaDescription.trim() },
    ]);
    setAreaName('');
    setAreaDescription('');
  };

  const handleRemoveArea = (tempId) => {
    setAreas((prev) => prev.filter((a) => a.tempId !== tempId));
  };

  const handleCreate = () => {
    const inspection = createInspection(clientData);
    areas.forEach((area) => {
      addWorkingArea(inspection.id, { name: area.name, description: area.description });
    });
    navigate(`/inspection/${inspection.id}/areas`);
  };

  const stepIndicator = (
    <div className="flex items-center gap-3 mb-8">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              s === step
                ? 'bg-blue-600 text-white'
                : s < step
                ? 'bg-blue-600/30 text-blue-400'
                : 'bg-slate-700 text-slate-500'
            }`}
          >
            {s < step ? <Check size={16} /> : s}
          </div>
          {s < 3 && (
            <div
              className={`w-12 h-0.5 ${
                s < step ? 'bg-blue-600/50' : 'bg-slate-700'
              }`}
            />
          )}
        </div>
      ))}
      <span className="ml-3 text-sm text-slate-400">Step {step} of 3</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : navigate('/'))}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-white">New Inspection</h1>
        </div>

        {stepIndicator}

        {/* Step 1 - Client Data */}
        {step === 1 && (
          <Card>
            <h2 className="text-lg font-semibold text-white mb-6">Client Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Reseller Name"
                value={clientData.reseller}
                onChange={handleClientChange('reseller')}
                placeholder="Reseller company"
              />
              <Input
                label="End Customer"
                value={clientData.endCustomer}
                onChange={handleClientChange('endCustomer')}
                placeholder="End customer name"
                required
              />
              <Input
                label="Site Address"
                value={clientData.siteAddress}
                onChange={handleClientChange('siteAddress')}
                placeholder="Full site address"
                className="sm:col-span-2"
              />
              <Input
                label="City"
                value={clientData.city}
                onChange={handleClientChange('city')}
                placeholder="City"
              />
              <Input
                label="Contact Name"
                value={clientData.contactName}
                onChange={handleClientChange('contactName')}
                placeholder="Contact person"
              />
              <Input
                label="Phone"
                value={clientData.contactPhone}
                onChange={handleClientChange('contactPhone')}
                placeholder="+44 ..."
                type="tel"
              />
              <Input
                label="Email"
                value={clientData.contactEmail}
                onChange={handleClientChange('contactEmail')}
                placeholder="email@example.com"
                type="email"
              />
            </div>

            <div className="flex justify-end mt-6">
              <Button onClick={() => setStep(2)} icon={ArrowRight}>
                Next
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2 - Working Areas */}
        {step === 2 && (
          <Card>
            <h2 className="text-lg font-semibold text-white mb-6">Working Areas</h2>

            {/* Add area form */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Input
                label="Area Name"
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                placeholder="e.g. Warehouse A"
                className="flex-1"
              />
              <Input
                label="Description"
                value={areaDescription}
                onChange={(e) => setAreaDescription(e.target.value)}
                placeholder="Optional description"
                className="flex-1"
              />
              <div className="flex items-end">
                <Button onClick={handleAddArea} icon={Plus} disabled={!areaName.trim()}>
                  Add
                </Button>
              </div>
            </div>

            {/* Area list */}
            {areas.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">
                No working areas added yet. Add at least one area to continue.
              </p>
            ) : (
              <div className="flex flex-col gap-2 mb-6">
                {areas.map((area) => (
                  <div
                    key={area.tempId}
                    className="flex items-center justify-between bg-slate-800 rounded-lg px-4 py-3"
                  >
                    <div>
                      <span className="text-white font-medium">{area.name}</span>
                      {area.description && (
                        <span className="text-slate-400 text-sm ml-3">
                          {area.description}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveArea(area.tempId)}
                      className="text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between mt-4">
              <Button variant="secondary" onClick={() => setStep(1)} icon={ArrowLeft}>
                Back
              </Button>
              <Button onClick={() => setStep(3)} icon={ArrowRight} disabled={areas.length === 0}>
                Next
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3 - Summary */}
        {step === 3 && (
          <Card>
            <h2 className="text-lg font-semibold text-white mb-6">Summary</h2>

            <div className="space-y-4 mb-6">
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Client</h3>
                <p className="text-white">{clientData.endCustomer || 'N/A'}</p>
                {clientData.reseller && (
                  <p className="text-slate-400 text-sm">Reseller: {clientData.reseller}</p>
                )}
                {clientData.siteAddress && (
                  <p className="text-slate-400 text-sm">{clientData.siteAddress}</p>
                )}
                {clientData.city && (
                  <p className="text-slate-400 text-sm">{clientData.city}</p>
                )}
              </div>

              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Contact</h3>
                <p className="text-white">{clientData.contactName || 'N/A'}</p>
                {clientData.contactPhone && (
                  <p className="text-slate-400 text-sm">{clientData.contactPhone}</p>
                )}
                {clientData.contactEmail && (
                  <p className="text-slate-400 text-sm">{clientData.contactEmail}</p>
                )}
              </div>

              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-2">
                  Working Areas ({areas.length})
                </h3>
                <ul className="space-y-1">
                  {areas.map((area) => (
                    <li key={area.tempId} className="text-white text-sm">
                      {area.name}
                      {area.description && (
                        <span className="text-slate-400"> -- {area.description}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setStep(2)} icon={ArrowLeft}>
                Back
              </Button>
              <Button onClick={handleCreate} icon={Check}>
                Create Inspection
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
