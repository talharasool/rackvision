import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Settings,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Button from '../components/ui/Button';
import useInspectionStore from '../stores/inspectionStore';
import useRackStore from '../stores/rackStore';
import useNCStore from '../stores/ncStore';
import NCSummaryBadge from '../components/ui/NCSummaryBadge';
import NCSummaryPanel from '../components/ui/NCSummaryPanel';
import BayFrontView from '../components/BayEditor/BayFrontView';
import BayConfig from '../components/BayEditor/BayConfig';
import BayInspection from '../components/BayEditor/BayInspection';

export default function BayEditorPage() {
  const { inspectionId, areaId, rackId, bayId } = useParams();
  const navigate = useNavigate();
  const { inspections } = useInspectionStore();
  const { racks, updateRack } = useRackStore();
  const { nonConformities, addNC, removeNC } = useNCStore();

  const [activeTab, setActiveTab] = useState('config');
  const [showNCPanel, setShowNCPanel] = useState(false);

  const inspection = inspections.find((i) => i.id === inspectionId);
  const rack = racks.find((r) => r.id === rackId);
  const bayIndex = rack?.bays?.findIndex((b) => b.id === bayId) ?? -1;
  const bay = bayIndex >= 0 ? rack.bays[bayIndex] : null;

  // Bay navigation
  const totalBays = rack?.bays?.length || 0;
  const hasPrev = bayIndex > 0;
  const hasNext = bayIndex < totalBays - 1;

  const navigateToBay = (index) => {
    if (!rack?.bays?.[index]) return;
    navigate(
      `/inspection/${inspectionId}/area/${areaId}/rack/${rackId}/bay/${rack.bays[index].id}`,
      { replace: true }
    );
  };

  if (!inspection || !rack || !bay) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Bay not found.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  const bayNCs = nonConformities.filter((nc) => nc.bayId === bayId);

  const handleAddNC = (ncData) => {
    addNC({ ...ncData, rackId, bayId });
  };

  const handleUpdateBay = (data) => {
    updateRack(rackId, data);
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-slate-950 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() =>
              navigate(`/inspection/${inspectionId}/area/${areaId}/layout`)
            }
            className="text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white">{bay.name}</h1>
            <p className="text-xs text-slate-400">
              {rack.name} -- {inspection.endCustomer}
            </p>
          </div>
        </div>

        {/* Bay Navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateToBay(bayIndex - 1)}
            disabled={!hasPrev}
            className={`p-1.5 rounded-lg transition-colors ${
              hasPrev
                ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Previous bay"
          >
            <ChevronLeft size={18} />
          </button>

          <select
            value={bayId}
            onChange={(e) => {
              const idx = rack.bays.findIndex((b) => b.id === e.target.value);
              if (idx >= 0) navigateToBay(idx);
            }}
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500 cursor-pointer min-w-[120px]"
          >
            {rack.bays.map((b, i) => (
              <option key={b.id} value={b.id}>
                {b.name || `Bay ${i + 1}`}
              </option>
            ))}
          </select>

          <button
            onClick={() => navigateToBay(bayIndex + 1)}
            disabled={!hasNext}
            className={`p-1.5 rounded-lg transition-colors ${
              hasNext
                ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Next bay"
          >
            <ChevronRight size={18} />
          </button>

          <span className="text-xs text-slate-500 ml-1">
            {bayIndex + 1} / {totalBays}
          </span>
        </div>

        {/* NC Badge */}
        <div className="flex items-center">
          <NCSummaryBadge ncs={bayNCs} />
        </div>
      </div>

      {/* Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Bay Front View (60%) */}
        <div className="w-[60%] border-r border-slate-700 bg-slate-900/50 flex items-center justify-center p-4 overflow-auto">
          <BayFrontView
            rack={rack}
            bay={bay}
            bayIndex={bayIndex}
            ncs={bayNCs}
            onElementClick={(elementType, elementId) => {
              // Clicking an upright opens that frame's editor.
              // Bay N is bounded by frames[N] (left) and frames[N+1] (right).
              if (elementType === 'upright') {
                const frameIdx =
                  elementId === 'left-upright'
                    ? bayIndex
                    : elementId === 'right-upright'
                    ? bayIndex + 1
                    : -1;
                const targetFrame = rack.frames?.[frameIdx];
                if (targetFrame) {
                  navigate(
                    `/inspection/${inspectionId}/area/${areaId}/rack/${rackId}/frame/${targetFrame.id}`
                  );
                  return;
                }
              }
              setActiveTab('inspection');
            }}
          />
        </div>

        {/* Right Panel - Config / Inspection Tabs (40%) */}
        <div className="w-[40%] flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-700 shrink-0">
            <button
              onClick={() => setActiveTab('config')}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'config'
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Settings size={16} />
              Configuration
            </button>
            <button
              onClick={() => setActiveTab('inspection')}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'inspection'
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ClipboardCheck size={16} />
              Inspection
            </button>
          </div>

          {/* Collapsible NC Summary */}
          {bayNCs.length > 0 && (
            <div className="border-b border-slate-700 shrink-0">
              <button
                onClick={() => setShowNCPanel(!showNCPanel)}
                className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                <span>NC Summary</span>
                <span>{showNCPanel ? '\u25B2' : '\u25BC'}</span>
              </button>
              {showNCPanel && (
                <div className="px-4 pb-3">
                  <NCSummaryPanel ncs={bayNCs} title={`${bay.name} NCs`} />
                </div>
              )}
            </div>
          )}

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'config' ? (
              <BayConfig
                rack={rack}
                bay={bay}
                bayIndex={bayIndex}
                onUpdate={handleUpdateBay}
              />
            ) : (
              <BayInspection
                rack={rack}
                bay={bay}
                bayIndex={bayIndex}
                rackId={rackId}
                bayId={bayId}
                ncs={bayNCs}
                onAddNC={handleAddNC}
                onRemoveNC={removeNC}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
