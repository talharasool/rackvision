import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2);

const BEAM_TYPES = [
  { value: 'standard-double-c', label: 'Standard Double C' },
  { value: 'step-beam', label: 'Step Beam' },
  { value: 'other', label: 'Other' },
];

const FINISH_TYPES = [
  { value: 'painted', label: 'Painted' },
  { value: 'galvanized-cold', label: 'Galvanized (Cold-dip)' },
  { value: 'galvanized-hot', label: 'Galvanized (Hot-dip)' },
];

function generateBeamName(beam) {
  const typeLabels = {
    'standard-double-c': 'Double C',
    'step-beam': 'Step',
    'other': 'Other',
  };
  const typeName = typeLabels[beam.beamType] || beam.beamType;
  const dims = `${beam.length}x${beam.height}`;
  const supplier = beam.supplierName ? ` - ${beam.supplierName}` : '';
  return `${typeName} ${dims}${supplier}`;
}

const useBeamDatabaseStore = create(
  persist(
    (set, get) => ({
      beams: [],

      addBeam: (data) => {
        const beam = {
          id: generateId(),
          name: '', // auto-generated below
          supplierId: data.supplierId || '',
          supplierName: data.supplierName || '',
          beamType: data.beamType || 'standard-double-c',
          length: data.length || 0,
          height: data.height || 0,
          depth: data.depth || 0,
          thickness: data.thickness || 0,
          finish: data.finish || 'painted',
          finishColor: data.finishColor || '',
          feature1: data.feature1 || '',
          feature2: data.feature2 || '',
          feature3: data.feature3 || '',
          supplierCode: data.supplierCode || '',
          createdAt: new Date().toISOString(),
        };
        beam.name = generateBeamName(beam);
        set((state) => ({
          beams: [...state.beams, beam],
        }));
        return beam;
      },

      updateBeam: (id, data) => {
        set((state) => ({
          beams: state.beams.map((b) => {
            if (b.id !== id) return b;
            const updated = { ...b, ...data };
            updated.name = generateBeamName(updated);
            return updated;
          }),
        }));
      },

      deleteBeam: (id) => {
        set((state) => ({
          beams: state.beams.filter((b) => b.id !== id),
        }));
      },

      duplicateBeam: (id) => {
        const beam = get().beams.find((b) => b.id === id);
        if (!beam) return null;
        const duplicate = {
          ...beam,
          id: generateId(),
          name: `${beam.name} (Copy)`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          beams: [...state.beams, duplicate],
        }));
        return duplicate;
      },

      getBeamById: (id) => {
        return get().beams.find((b) => b.id === id) || null;
      },

      getBeamsBySupplier: (supplierId) => {
        return get().beams.filter((b) => b.supplierId === supplierId);
      },

      getBeamsByLength: (length) => {
        return get().beams.filter((b) => b.length === length);
      },

      getFilteredBeams: (supplierId, length) => {
        return get().beams.filter(
          (b) =>
            (!supplierId || b.supplierId === supplierId) &&
            (!length || b.length === length)
        );
      },
    }),
    { name: 'rackvision-beam-database' }
  )
);

export { BEAM_TYPES, FINISH_TYPES, generateBeamName };
export default useBeamDatabaseStore;
