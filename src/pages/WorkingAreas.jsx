import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, MapPin, Trash2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import useInspectionStore from '../stores/inspectionStore';

export default function WorkingAreas() {
  const { inspectionId } = useParams();
  const navigate = useNavigate();
  const { inspections, setCurrentInspection, addWorkingArea, removeWorkingArea } =
    useInspectionStore();

  const inspection = inspections.find((i) => i.id === inspectionId);

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
          <Button onClick={() => setShowForm(!showForm)} icon={Plus}>
            Add Working Area
          </Button>
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
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
