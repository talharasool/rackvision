import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardPlus, RefreshCw, ChevronRight, Calendar, MapPin, Database, Columns3, Frame, Truck, Package, Upload, Trash2, User, Building, AlertTriangle } from 'lucide-react';
import Card from '../components/ui/Card';
import useInspectionStore from '../stores/inspectionStore';
import useRackStore from '../stores/rackStore';
import useNCStore from '../stores/ncStore';

export default function HomePage() {
  const navigate = useNavigate();
  const { inspections, deleteInspection } = useInspectionStore();
  const { racks, deleteRack } = useRackStore();
  const { nonConformities, removeNC } = useNCStore();
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const recentInspections = [...inspections]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center px-4 py-16">
      {/* Branding */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3">
          RackVision
        </h1>
        <p className="text-slate-400 text-lg">
          Warehouse Racking Inspection Platform
        </p>
      </div>

      {/* CTA Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl mb-12">
        <Card
          hover
          onClick={() => navigate('/new-inspection')}
          className="flex flex-col items-center justify-center py-10 gap-4"
        >
          <div className="w-14 h-14 rounded-full bg-blue-600/20 flex items-center justify-center">
            <ClipboardPlus size={28} className="text-blue-400" />
          </div>
          <span className="text-lg font-semibold text-white">New Inspection</span>
          <span className="text-sm text-slate-400">Start a new racking inspection</span>
        </Card>

        <Card
          hover
          onClick={() => navigate('/renewals')}
          className="flex flex-col items-center justify-center py-10 gap-4"
        >
          <div className="w-14 h-14 rounded-full bg-cyan-600/20 flex items-center justify-center">
            <RefreshCw size={28} className="text-cyan-400" />
          </div>
          <span className="text-lg font-semibold text-white">Renewals</span>
          <span className="text-sm text-slate-400">Manage renewal inspections</span>
        </Card>
      </div>

      {/* Database Editors */}
      <div className="w-full max-w-2xl mb-12">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Database size={18} className="text-slate-400" />
          Database Editors
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card
            hover
            onClick={() => navigate('/editors/beams')}
            className="flex flex-col items-center justify-center py-6 gap-2"
          >
            <Columns3 size={24} className="text-blue-400" />
            <span className="text-sm font-medium text-white">Beams</span>
          </Card>
          <Card
            hover
            onClick={() => navigate('/editors/frames')}
            className="flex flex-col items-center justify-center py-6 gap-2"
          >
            <Frame size={24} className="text-purple-400" />
            <span className="text-sm font-medium text-white">Frames</span>
          </Card>
          <Card
            hover
            onClick={() => navigate('/editors/suppliers')}
            className="flex flex-col items-center justify-center py-6 gap-2"
          >
            <Truck size={24} className="text-green-400" />
            <span className="text-sm font-medium text-white">Suppliers</span>
          </Card>
          <Card
            hover
            onClick={() => navigate('/editors/accessories')}
            className="flex flex-col items-center justify-center py-6 gap-2"
          >
            <Package size={24} className="text-orange-400" />
            <span className="text-sm font-medium text-white">Accessories</span>
          </Card>
          <Card
            className="flex flex-col items-center justify-center py-6 gap-2 opacity-40 cursor-not-allowed"
          >
            <Upload size={24} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-500">Import DB</span>
            <span className="text-[10px] text-slate-600">Coming Soon</span>
          </Card>
        </div>
      </div>

      {/* Recent Inspections */}
      <div className="w-full max-w-2xl">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Inspections</h2>

        {recentInspections.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-slate-500">No inspections yet. Create your first one above.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {recentInspections.map((inspection) => (
              <Card
                key={inspection.id}
                hover
                onClick={() => {
                  navigate(`/inspection/${inspection.id}/areas`);
                }}
                className="flex items-center justify-between"
              >
                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                  <span className="text-white font-medium">
                    {inspection.endCustomer || 'Untitled Inspection'}
                  </span>
                  {inspection.reseller && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Building size={12} />
                      {inspection.reseller}
                    </span>
                  )}
                  <div className="flex items-center gap-3 text-sm text-slate-400 flex-wrap">
                    {inspection.city && (
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {inspection.city}
                      </span>
                    )}
                    {inspection.contactName && (
                      <span className="flex items-center gap-1">
                        <User size={14} />
                        {inspection.contactName}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(inspection.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {inspection.siteAddress && (
                    <span className="text-xs text-slate-500 truncate">
                      {inspection.siteAddress}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      inspection.status === 'draft'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : inspection.status === 'completed'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {inspection.status}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const areaIds = (inspection.workingAreas || []).map(a => a.id);
                      const inspRacks = racks.filter(r => areaIds.includes(r.areaId));
                      const inspNCs = nonConformities.filter(nc => inspRacks.some(r => r.id === nc.rackId));
                      setDeleteConfirm({
                        id: inspection.id,
                        name: inspection.endCustomer || 'Untitled',
                        areaCount: areaIds.length,
                        rackCount: inspRacks.length,
                        ncCount: inspNCs.length,
                      });
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <ChevronRight size={18} className="text-slate-500" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      {/* Delete Inspection Confirmation Modal */}
      {deleteConfirm && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/60" onClick={() => setDeleteConfirm(null)} />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-600 rounded-2xl shadow-2xl p-5 max-w-sm w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-red-500/15">
                  <AlertTriangle size={20} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Delete Inspection?</h3>
                  <p className="text-xs text-slate-400">{deleteConfirm.name}</p>
                </div>
              </div>
              <div className="bg-slate-800/60 rounded-lg p-3 mb-4 text-sm text-slate-300">
                <p className="mb-2">This will permanently delete:</p>
                <ul className="space-y-1 text-xs text-slate-400">
                  <li>- {deleteConfirm.areaCount} working area{deleteConfirm.areaCount !== 1 ? 's' : ''}</li>
                  <li>- {deleteConfirm.rackCount} rack{deleteConfirm.rackCount !== 1 ? 's' : ''}</li>
                  {deleteConfirm.ncCount > 0 && (
                    <li className="text-red-400 font-medium">
                      - {deleteConfirm.ncCount} recorded NC{deleteConfirm.ncCount !== 1 ? 's' : ''}
                    </li>
                  )}
                </ul>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const areaIds = (inspections.find(i => i.id === deleteConfirm.id)?.workingAreas || []).map(a => a.id);
                    const inspRacks = racks.filter(r => areaIds.includes(r.areaId));
                    // Delete NCs for these racks
                    nonConformities
                      .filter(nc => inspRacks.some(r => r.id === nc.rackId))
                      .forEach(nc => removeNC(nc.id));
                    // Delete racks
                    inspRacks.forEach(r => deleteRack(r.id));
                    // Delete inspection
                    deleteInspection(deleteConfirm.id);
                    setDeleteConfirm(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Delete Everything
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
