import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, MapPin, Trash2, Download, ChevronDown } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import useInspectionStore from '../stores/inspectionStore';
import useRackStore from '../stores/rackStore';
import useNCStore from '../stores/ncStore';
import NCSummaryBadge from '../components/ui/NCSummaryBadge';
import { buildExportRows, rowsToCSV, downloadFile, downloadXLSX, downloadZIPBundle } from '../utils/exportNC';

export default function WorkingAreas() {
  const { inspectionId } = useParams();
  const navigate = useNavigate();
  const { inspections, setCurrentInspection, addWorkingArea, removeWorkingArea } =
    useInspectionStore();
  const { racks } = useRackStore();
  const { nonConformities } = useNCStore();

  // Helper: get NCs for all racks in an area
  const getAreaNCs = (areaId) => {
    const areaRackIds = new Set(racks.filter((r) => r.areaId === areaId).map((r) => r.id));
    return nonConformities.filter((nc) => areaRackIds.has(nc.rackId));
  };

  const inspection = inspections.find((i) => i.id === inspectionId);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    }
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showExportMenu]);

  const handleExportAllNCs = (format = 'csv') => {
    setShowExportMenu(false);
    if (!inspection) return;
    const allAreas = inspection.workingAreas || [];
    const allAreaIds = new Set(allAreas.map((a) => a.id));
    const allAreaRacks = racks.filter((r) => allAreaIds.has(r.areaId));

    const rows = buildExportRows({
      inspection,
      areas: allAreas,
      racks: allAreaRacks,
      nonConformities,
    });
    if (rows.length === 0) {
      alert('No non-conformities to export.');
      return;
    }
    const date = new Date().toISOString().slice(0, 10);
    const customerSlug = (inspection.endCustomer || 'inspection').replace(/\s+/g, '-');
    const baseName = `${customerSlug}-All-NCs-${date}`;

    if (format === 'csv') {
      const csv = rowsToCSV(rows);
      downloadFile(csv, `${baseName}.csv`);
    } else if (format === 'xlsx') {
      downloadXLSX(rows, `${baseName}.xlsx`);
    } else if (format === 'zip') {
      const allNCs = nonConformities.filter((nc) =>
        allAreaRacks.some((r) => r.id === nc.rackId)
      );
      const photos = allNCs
        .filter((nc) => (Array.isArray(nc.photos) && nc.photos.length > 0) || nc.photo)
        .map((nc) => ({
          ncId: nc.id,
          photos: Array.isArray(nc.photos) ? nc.photos : nc.photo ? [nc.photo] : [],
        }));
      downloadZIPBundle(rows, photos, `${baseName}.zip`);
    }
  };

  const [showForm, setShowForm] = useState(false);
  const [areaName, setAreaName] = useState('');
  const [areaDescription, setAreaDescription] = useState('');

  useEffect(() => {
    if (inspectionId) {
      setCurrentInspection(inspectionId);
    }
  }, [inspectionId, setCurrentInspection]);

  if (!inspection) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Inspection not found.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  const handleAdd = () => {
    if (!areaName.trim()) return;
    addWorkingArea(inspectionId, {
      name: areaName.trim(),
      description: areaDescription.trim(),
    });
    setAreaName('');
    setAreaDescription('');
    setShowForm(false);
  };

  const handleDelete = (e, areaId) => {
    e.stopPropagation();
    removeWorkingArea(inspectionId, areaId);
  };

  const areas = inspection.workingAreas || [];

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Working Areas</h1>
              <p className="text-sm text-slate-400">
                {inspection.endCustomer || 'Untitled'} -- {inspection.city || 'No city'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {import.meta.env.DEV && (
              <div className="relative" ref={exportMenuRef}>
                <Button
                  variant="secondary"
                  onClick={() => setShowExportMenu((v) => !v)}
                  icon={Download}
                >
                  Export All NCs
                  <ChevronDown size={12} className="ml-1" />
                </Button>
                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-1">
                    <button
                      onClick={() => handleExportAllNCs('csv')}
                      className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      Export CSV
                    </button>
                    <button
                      onClick={() => handleExportAllNCs('xlsx')}
                      className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      Export XLSX
                    </button>
                    <button
                      onClick={() => handleExportAllNCs('zip')}
                      className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      Export ZIP (with photos)
                    </button>
                  </div>
                )}
              </div>
            )}
            <Button onClick={() => setShowForm(!showForm)} icon={Plus}>
              Add Working Area
            </Button>
          </div>
        </div>

        {/* Inline Add Form */}
        {showForm && (
          <Card className="mb-6">
            <h3 className="text-white font-medium mb-4">New Working Area</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                label="Area Name"
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                placeholder="e.g. Warehouse A"
                required
                className="flex-1"
              />
              <Input
                label="Description"
                value={areaDescription}
                onChange={(e) => setAreaDescription(e.target.value)}
                placeholder="Optional description"
                className="flex-1"
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={!areaName.trim()} icon={Plus}>
                Add
              </Button>
            </div>
          </Card>
        )}

        {/* Areas Grid */}
        {areas.length === 0 ? (
          <Card className="text-center py-12">
            <MapPin size={40} className="text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No working areas yet.</p>
            <p className="text-slate-500 text-sm mt-1">
              Click "Add Working Area" to get started.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {areas.map((area) => (
              <Card
                key={area.id}
                hover
                onClick={() =>
                  navigate(`/inspection/${inspectionId}/area/${area.id}/racks`)
                }
                className="relative group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                      <MapPin size={20} className="text-blue-400" />
                    </div>
                    <h3 className="text-white font-semibold text-lg">{area.name}</h3>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, area.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {area.description && (
                  <p className="text-slate-400 text-sm mt-1">{area.description}</p>
                )}
                <div className="mt-3">
                  <NCSummaryBadge ncs={getAreaNCs(area.id)} compact />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
