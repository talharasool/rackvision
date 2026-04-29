import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, RefreshCw, Check, AlertCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import useInspectionStore from '../stores/inspectionStore';
import useRackStore from '../stores/rackStore';
import useNCStore from '../stores/ncStore';

/**
 * Renewals page (Doc 1 §1.2, §7.4.1).
 *
 * Lists every existing inspection and lets the user kick off a "renewal":
 * a brand-new inspection that deep-copies the source inspection's metadata,
 * working areas, racks (with fresh bay/frame ids), and non-conformities.
 * The original inspection stays untouched. The user is then redirected to
 * the new renewal's working-area list to start the walkthrough.
 */
export default function RenewalsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { inspections, createRenewal } = useInspectionStore();
  const { racks, cloneRacksForRenewal } = useRackStore();
  const { nonConformities, cloneNCsWithIdMap } = useNCStore();

  const [pendingSource, setPendingSource] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Sort inspections by most recent first
  const sorted = useMemo(
    () =>
      [...inspections].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      ),
    [inspections]
  );

  // Pre-compute counts per inspection so the user sees what they are copying
  const statsById = useMemo(() => {
    const map = {};
    inspections.forEach((ins) => {
      const areaIds = new Set((ins.workingAreas || []).map((a) => a.id));
      const insRacks = racks.filter((r) => areaIds.has(r.areaId));
      const rackIds = new Set(insRacks.map((r) => r.id));
      const insNCs = nonConformities.filter((nc) => rackIds.has(nc.rackId));
      map[ins.id] = {
        areaCount: ins.workingAreas?.length || 0,
        rackCount: insRacks.length,
        ncCount: insNCs.length,
      };
    });
    return map;
  }, [inspections, racks, nonConformities]);

  const handleRenew = (inspection) => {
    setPendingSource(inspection);
    setError(null);
  };

  const handleConfirm = () => {
    if (!pendingSource || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = createRenewal(pendingSource.id);
      if (!result) throw new Error(t('renewals.failed_to_create_renewal'));

      const { inspection: renewal, areaIdMap } = result;

      // Deep-copy racks → map of old→new ids
      const idMap = cloneRacksForRenewal(areaIdMap);
      // Replay NCs using the id map so they land on the new racks
      cloneNCsWithIdMap(idMap);

      setPendingSource(null);
      navigate(`/inspection/${renewal.id}/areas`);
    } catch (err) {
      console.error('Renewal failed', err);
      setError(err.message || t('renewals.renewal_failed_generic'));
    } finally {
      setBusy(false);
    }
  };

  const pendingStats = pendingSource ? statsById[pendingSource.id] : null;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{t('renewals.renewals_title')}</h1>
            <p className="text-sm text-slate-400">
              {t('renewals.renewals_subtitle')}
            </p>
          </div>
        </div>

        {sorted.length === 0 ? (
          <Card className="text-center py-12">
            <RefreshCw size={40} className="text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-1">{t('renewals.no_inspections_yet')}</p>
            <p className="text-slate-500 text-sm">
              {t('renewals.create_first_hint')}
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-sm font-medium text-slate-400 px-6 py-3">
                    {t('renewals.table_col_customer')}
                  </th>
                  <th className="text-left text-sm font-medium text-slate-400 px-6 py-3">
                    {t('renewals.table_col_site')}
                  </th>
                  <th className="text-center text-sm font-medium text-slate-400 px-6 py-3">
                    {t('renewals.table_col_areas')}
                  </th>
                  <th className="text-center text-sm font-medium text-slate-400 px-6 py-3">
                    {t('renewals.table_col_racks')}
                  </th>
                  <th className="text-center text-sm font-medium text-slate-400 px-6 py-3">
                    {t('renewals.table_col_ncs')}
                  </th>
                  <th className="text-left text-sm font-medium text-slate-400 px-6 py-3">
                    {t('renewals.table_col_created')}
                  </th>
                  <th className="text-right text-sm font-medium text-slate-400 px-6 py-3">
                    {t('renewals.table_col_actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((ins) => {
                  const stats = statsById[ins.id] || {};
                  return (
                    <tr
                      key={ins.id}
                      className="border-b border-slate-800 last:border-b-0 hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-white font-medium">
                        <div className="flex items-center gap-2">
                          {ins.endCustomer || 'Unnamed'}
                          {ins.parentInspectionId && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                              {t('renewals.renewal_badge')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-sm">
                        {ins.siteAddress || ins.city || '--'}
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-center">
                        {stats.areaCount ?? 0}
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-center">
                        {stats.rackCount ?? 0}
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-center">
                        {stats.ncCount ?? 0}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {ins.createdAt
                          ? new Date(ins.createdAt).toLocaleDateString()
                          : '--'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          icon={RefreshCw}
                          onClick={() => handleRenew(ins)}
                          disabled={stats.areaCount === 0}
                        >
                          {t('renewals.renew_button')}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {/* Confirmation modal */}
      <Modal
        isOpen={!!pendingSource}
        onClose={() => (busy ? null : setPendingSource(null))}
        title={t('renewals.modal_title')}
        size="sm"
      >
        {pendingSource && (
          <>
            <p className="text-slate-300 mb-4">
              {t('renewals.modal_body', { customer: pendingSource.endCustomer || 'this customer' })}
            </p>
            <ul className="text-sm text-slate-300 space-y-1.5 mb-4">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-green-400" />
                {t('renewals.modal_areas', { n: pendingStats?.areaCount || 0 })}
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-green-400" />
                {t('renewals.modal_racks', { n: pendingStats?.rackCount || 0 })}
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-green-400" />
                {t('renewals.modal_ncs', { n: pendingStats?.ncCount || 0 })}
              </li>
            </ul>
            <p className="text-xs text-slate-400 mb-6">
              {t('renewals.modal_disclaimer')}
            </p>
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-200 text-sm mb-4">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setPendingSource(null)}
                disabled={busy}
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={busy}
                icon={RefreshCw}
              >
                {busy ? t('renewals.creating_renewal') : t('renewals.create_renewal_button')}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
