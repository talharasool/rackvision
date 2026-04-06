import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardPlus, RefreshCw, ChevronRight, Calendar, MapPin, Database, Columns3, Frame, Truck, Package, Upload } from 'lucide-react';
import Card from '../components/ui/Card';
import useInspectionStore from '../stores/inspectionStore';

export default function HomePage() {
  const navigate = useNavigate();
  const { inspections } = useInspectionStore();

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
            className="flex flex-col items-center justify-center py-6 gap-2 opacity-40 cursor-not-allowed"
          >
            <Package size={24} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-500">Accessories</span>
            <span className="text-[10px] text-slate-600">Coming Soon</span>
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
                <div className="flex flex-col gap-1">
                  <span className="text-white font-medium">
                    {inspection.endCustomer || 'Untitled Inspection'}
                  </span>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    {inspection.city && (
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {inspection.city}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(inspection.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
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
                  <ChevronRight size={18} className="text-slate-500" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
