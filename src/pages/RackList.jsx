import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Copy,
  Trash2,
  Eye,
  PackageOpen,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import useInspectionStore from '../stores/inspectionStore';
import useRackStore from '../stores/rackStore';
import useNCStore from '../stores/ncStore';
import NCSummaryBadge from '../components/ui/NCSummaryBadge';
import RackWizard from '../components/Wizard/RackWizard';
import { getBayDescription } from '../utils/rackHelpers';

export default function RackList() {
  const { t } = useTranslation();
  const { inspectionId, areaId } = useParams();
  const navigate = useNavigate();
  const { inspections } = useInspectionStore();
  const { racks, deleteRack, duplicateRack } = useRackStore();
  const { nonConformities } = useNCStore();

  const [showWizard, setShowWizard] = useState(false);
  const [editingRack, setEditingRack] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const inspection = inspections.find((i) => i.id === inspectionId);
  const area = inspection?.workingAreas?.find((a) => a.id === areaId);
  const areaRacks = racks.filter((r) => r.areaId === areaId);

  if (!inspection || !area) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">{t('rack_list.area_not_found')}</p>
          <Button onClick={() => navigate('/')}>{t('common.go_home')}</Button>
        </div>
      </div>
    );
  }

  const handleDuplicate = (rackId) => {
    duplicateRack(rackId);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteRack(deleteTarget);
      setDeleteTarget(null);
    }
  };

  const handleEditRack = (rack) => {
    setEditingRack(rack);
    setShowWizard(true);
  };

  const handleWizardClose = () => {
    setShowWizard(false);
    setEditingRack(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/inspection/${inspectionId}/areas`)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">{area.name}</h1>
              <p className="text-sm text-slate-400">
                {inspection.endCustomer} -- {t('inspection.rack_configuration_subtitle')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() =>
                navigate(
                  `/inspection/${inspectionId}/area/${areaId}/layout`
                )
              }
              icon={Eye}
            >
              {t('rack_list.view_layout')}
            </Button>
            <Button onClick={() => setShowWizard(true)} icon={Plus}>
              {t('rack_list.create_new_rack')}
            </Button>
          </div>
        </div>

        {/* Rack Table */}
        {areaRacks.length === 0 ? (
          <Card className="text-center py-12">
            <PackageOpen size={40} className="text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">{t('rack_list.no_racks_in_area')}</p>
            <p className="text-slate-500 text-sm mt-1">
              {t('rack_list.no_racks_click_hint')}
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-sm font-medium text-slate-400 px-6 py-3">
                    {t('rack_list.table_col_name')}
                  </th>
                  <th className="text-left text-sm font-medium text-slate-400 px-6 py-3">
                    {t('rack_list.table_col_manufacturer')}
                  </th>
                  <th className="text-center text-sm font-medium text-slate-400 px-6 py-3">
                    {t('rack_list.table_col_bays')}
                  </th>
                  <th className="text-center text-sm font-medium text-slate-400 px-6 py-3">
                    {t('rack_list.table_col_bay_description')}
                  </th>
                  <th className="text-center text-sm font-medium text-slate-400 px-6 py-3">
                    {t('rack_list.table_col_levels')}
                  </th>
                  <th className="text-center text-sm font-medium text-slate-400 px-6 py-3">
                    {t('rack_list.table_col_ncs')}
                  </th>
                  <th className="text-right text-sm font-medium text-slate-400 px-6 py-3">
                    {t('rack_list.table_col_actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {areaRacks.map((rack) => (
                  <tr
                    key={rack.id}
                    className="border-b border-slate-800 last:border-b-0 hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-white font-medium">
                      {rack.name || t('rack_list.unnamed_rack')}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {rack.manufacturer || '--'}
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-center">
                      {rack.numberOfBays}
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-center font-mono text-xs">
                      {getBayDescription(rack) || `${rack.bayLength} mm`}
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-center">
                      {rack.levels}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <NCSummaryBadge
                        ncs={nonConformities.filter((nc) => nc.rackId === rack.id)}
                        compact
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditRack(rack)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                          title={t('rack_list.action_edit_title')}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDuplicate(rack.id)}
                          className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 rounded-lg transition-colors"
                          title={t('rack_list.action_duplicate_title')}
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(rack.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                          title={t('rack_list.action_delete_title')}
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          onClick={() =>
                            navigate(
                              `/inspection/${inspectionId}/area/${areaId}/layout`
                            )
                          }
                          className="p-2 text-slate-400 hover:text-green-400 hover:bg-slate-700 rounded-lg transition-colors"
                          title={t('rack_list.action_view_layout_title')}
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {/* Rack Wizard Modal */}
      <RackWizard
        isOpen={showWizard}
        areaId={areaId}
        editRack={editingRack}
        onClose={handleWizardClose}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t('rack_list.delete_rack_modal_title')}
        size="sm"
      >
        <p className="text-slate-300 mb-6">
          {t('rack_list.delete_rack_confirmation')}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={handleDelete} icon={Trash2}>
            {t('common.delete')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
