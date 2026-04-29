import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, ClipboardCheck } from 'lucide-react';
import Button from '../components/ui/Button';
import useInspectionStore from '../stores/inspectionStore';
import useRackStore from '../stores/rackStore';
import useNCStore from '../stores/ncStore';
import FrameView from '../components/FrameEditor/FrameView';
import FrameConfig from '../components/FrameEditor/FrameConfig';
import FrameInspection from '../components/FrameEditor/FrameInspection';

export default function FrameEditorPage() {
  const { inspectionId, areaId, rackId, frameId } = useParams();
  const navigate = useNavigate();
  const { inspections } = useInspectionStore();
  const { racks } = useRackStore();
  const { nonConformities, addNC, removeNC } = useNCStore();

  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('config');

  const inspection = inspections.find((i) => i.id === inspectionId);
  const rack = racks.find((r) => r.id === rackId);
  const frameIndex = rack?.frames?.findIndex((f) => f.id === frameId) ?? -1;
  const frame = frameIndex >= 0 ? rack.frames[frameIndex] : null;

  if (!inspection || !rack || !frame) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">{t('frame.frame_not_found')}</p>
          <Button onClick={() => navigate('/')}>{t('common.go_home')}</Button>
        </div>
      </div>
    );
  }

  const frameNCs = nonConformities.filter((nc) => nc.frameId === frameId);

  const handleAddNC = (ncData) => {
    addNC({ ...ncData, rackId, frameId });
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
            <h1 className="text-lg font-semibold text-white">{frame.name}</h1>
            <p className="text-xs text-slate-400">
              {rack.name} -- {inspection.endCustomer}
            </p>
          </div>
        </div>

        {frameNCs.length > 0 && (
          <span className="bg-red-500/20 text-red-400 text-xs font-medium px-3 py-1 rounded-full">
            {t('nc.nc_count', { n: frameNCs.length })}
          </span>
        )}
      </div>

      {/* Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Frame View (60%) */}
        <div className="w-[60%] border-r border-slate-700 bg-slate-900/50 flex items-center justify-center p-4 overflow-auto">
          <FrameView
            rack={rack}
            frame={frame}
            frameIndex={frameIndex}
            ncs={frameNCs}
            onElementClick={(elementType, elementId) => {
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
              {t('frame.tab_configuration')}
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
              {t('frame.tab_inspection')}
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'config' ? (
              <FrameConfig
                rack={rack}
                frame={frame}
                frameIndex={frameIndex}
              />
            ) : (
              <FrameInspection
                rack={rack}
                frame={frame}
                frameIndex={frameIndex}
                rackId={rackId}
                frameId={frameId}
                ncs={frameNCs}
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
