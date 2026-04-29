import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Trash2,
} from 'lucide-react';
import Input from '../components/ui/Input';
import PhoneInput from '../components/ui/PhoneInput';
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateStep1(data, t) {
  const errors = {};

  if (!data.endCustomer.trim()) {
    errors.endCustomer = t('inspection.error_end_customer_required');
  } else if (data.endCustomer.trim().length < 2) {
    errors.endCustomer = t('inspection.error_name_too_short');
  }

  if (data.contactEmail && !EMAIL_REGEX.test(data.contactEmail)) {
    errors.contactEmail = t('inspection.error_invalid_email');
  }

  if (data.contactPhone) {
    // Strip country code prefix and spaces/dashes, check remaining digits
    const digits = data.contactPhone.replace(/[\s\-+]/g, '');
    if (digits.length < 7) {
      errors.contactPhone = t('inspection.error_phone_too_short');
    } else if (digits.length > 15) {
      errors.contactPhone = t('inspection.error_phone_too_long');
    }
  }

  if (data.contactName && data.contactName.trim().length < 2) {
    errors.contactName = t('inspection.error_name_too_short');
  }

  if (data.city && data.city.trim().length < 2) {
    errors.city = t('inspection.error_city_too_short');
  }

  return errors;
}

export default function NewInspection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createInspection, addWorkingArea } = useInspectionStore();

  const [step, setStep] = useState(1);
  const [clientData, setClientData] = useState(INITIAL_CLIENT);
  const [areas, setAreas] = useState([]);
  const [areaName, setAreaName] = useState('');
  const [areaDescription, setAreaDescription] = useState('');
  const [errors, setErrors] = useState({});

  const handleClientChange = (field) => (e) => {
    setClientData((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
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

  const handleNextStep1 = () => {
    const stepErrors = validateStep1(clientData, t);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep(2);
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
      <span className="ml-3 text-sm text-slate-400">{t('inspection.step_indicator', { current: step, total: 3 })}</span>
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
          <h1 className="text-2xl font-bold text-white">{t('inspection.new_inspection_title')}</h1>
        </div>

        {stepIndicator}

        {/* Step 1 - Client Data */}
        {step === 1 && (
          <Card>
            <h2 className="text-lg font-semibold text-white mb-6">{t('inspection.step_client_info_title')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('inspection.reseller_name')}
                value={clientData.reseller}
                onChange={handleClientChange('reseller')}
                placeholder={t('inspection.reseller_name_placeholder')}
              />
              <Input
                label={t('inspection.end_customer')}
                value={clientData.endCustomer}
                onChange={handleClientChange('endCustomer')}
                placeholder={t('inspection.end_customer_placeholder')}
                required
                error={errors.endCustomer}
              />
              <Input
                label={t('inspection.site_address')}
                value={clientData.siteAddress}
                onChange={handleClientChange('siteAddress')}
                placeholder={t('inspection.site_address_placeholder')}
                className="sm:col-span-2"
              />
              <Input
                label={t('inspection.city')}
                value={clientData.city}
                onChange={handleClientChange('city')}
                placeholder={t('inspection.city_placeholder')}
                error={errors.city}
              />
              <Input
                label={t('inspection.contact_name')}
                value={clientData.contactName}
                onChange={handleClientChange('contactName')}
                placeholder={t('inspection.contact_name_placeholder')}
                error={errors.contactName}
              />
              <PhoneInput
                label={t('inspection.phone_label')}
                value={clientData.contactPhone}
                onChange={handleClientChange('contactPhone')}
                error={errors.contactPhone}
              />
              <Input
                label={t('inspection.email')}
                value={clientData.contactEmail}
                onChange={handleClientChange('contactEmail')}
                placeholder={t('inspection.email_placeholder')}
                type="email"
                error={errors.contactEmail}
              />
            </div>

            <div className="flex justify-end mt-6">
              <Button onClick={handleNextStep1} icon={ArrowRight}>
                {t('common.next')}
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2 - Working Areas */}
        {step === 2 && (
          <Card>
            <h2 className="text-lg font-semibold text-white mb-6">{t('inspection.step_working_areas_title')}</h2>

            {/* Add area form */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Input
                label={t('inspection.area_name')}
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                placeholder={t('inspection.area_name_placeholder')}
                className="flex-1"
              />
              <Input
                label={t('inspection.area_description')}
                value={areaDescription}
                onChange={(e) => setAreaDescription(e.target.value)}
                placeholder={t('inspection.area_description_placeholder')}
                className="flex-1"
              />
              <div className="flex items-end">
                <Button onClick={handleAddArea} icon={Plus} disabled={!areaName.trim()}>
                  {t('common.add')}
                </Button>
              </div>
            </div>

            {/* Area list */}
            {areas.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-6">
                {t('inspection.no_areas_yet')}
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
                {t('common.back')}
              </Button>
              <Button onClick={() => setStep(3)} icon={ArrowRight} disabled={areas.length === 0}>
                {t('common.next')}
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3 - Summary */}
        {step === 3 && (
          <Card>
            <h2 className="text-lg font-semibold text-white mb-6">{t('inspection.summary_title')}</h2>

            <div className="space-y-4 mb-6">
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-2">{t('inspection.summary_client_heading')}</h3>
                <p className="text-white">{clientData.endCustomer || t('common.n_a')}</p>
                {clientData.reseller && (
                  <p className="text-slate-400 text-sm">{t('inspection.summary_reseller_label', { name: clientData.reseller })}</p>
                )}
                {clientData.siteAddress && (
                  <p className="text-slate-400 text-sm">{clientData.siteAddress}</p>
                )}
                {clientData.city && (
                  <p className="text-slate-400 text-sm">{clientData.city}</p>
                )}
              </div>

              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-2">{t('inspection.summary_contact_heading')}</h3>
                <p className="text-white">{clientData.contactName || t('common.n_a')}</p>
                {clientData.contactPhone && (
                  <p className="text-slate-400 text-sm">{clientData.contactPhone}</p>
                )}
                {clientData.contactEmail && (
                  <p className="text-slate-400 text-sm">{clientData.contactEmail}</p>
                )}
              </div>

              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-slate-400 mb-2">
                  {t('inspection.summary_working_areas_heading', { n: areas.length })}
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
                {t('common.back')}
              </Button>
              <Button onClick={handleCreate} icon={Check}>
                {t('inspection.create_inspection')}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
