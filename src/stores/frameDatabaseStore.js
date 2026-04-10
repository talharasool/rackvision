import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2);

const FRAME_TYPES = [
  { value: 'welded', label: 'Welded' },
  { value: 'bolted', label: 'Bolted' },
];

function generateFrameName(frame) {
  const typeLabels = {
    welded: 'Welded',
    bolted: 'Bolted',
  };
  const typeName = typeLabels[frame.frameType] || frame.frameType;
  const dims = `${frame.height}x${frame.depth}`;
  const supplier = frame.supplierName ? ` - ${frame.supplierName}` : '';
  return `${typeName} ${dims}${supplier}`;
}

const useFrameDatabaseStore = create(
  persist(
    (set, get) => ({
      frames: [],

      addFrame: (data) => {
        const frame = {
          id: generateId(),
          name: '',
          supplierId: data.supplierId || '',
          supplierName: data.supplierName || '',
          frameType: data.frameType || 'welded',
          uprightDescription: data.uprightDescription || '',
          uprightHeight: data.uprightHeight || 0,
          uprightWidth: data.uprightWidth || 0,
          // Doc 4 §4c: upright profile is non-square. uprightWidth is the
          // front-view dimension; uprightDepth is the side-view dimension.
          // Default to uprightWidth for backwards compatibility.
          uprightDepth: data.uprightDepth || data.uprightWidth || 0,
          // Doc 4 §4e: brace pattern — Z, D, K, X. Defaults to Z.
          braceType: data.braceType || 'Z',
          height: data.uprightHeight || 0,
          depth: data.depth || 0,
          finish: data.finish || 'painted',
          finishColor: data.finishColor || '',
          diagonalQty: data.diagonalQty || 0,
          diagonalDetails: data.diagonalDetails || '',
          crossMemberQty: data.crossMemberQty || 0,
          crossMemberDetails: data.crossMemberDetails || '',
          supplierCode: data.supplierCode || '',
          createdAt: new Date().toISOString(),
        };
        frame.name = generateFrameName(frame);
        set((state) => ({
          frames: [...state.frames, frame],
        }));
        return frame;
      },

      updateFrame: (id, data) => {
        set((state) => ({
          frames: state.frames.map((f) => {
            if (f.id !== id) return f;
            const updated = { ...f, ...data };
            // Keep height in sync with uprightHeight
            if (data.uprightHeight !== undefined) {
              updated.height = data.uprightHeight;
            }
            updated.name = generateFrameName(updated);
            return updated;
          }),
        }));
      },

      deleteFrame: (id) => {
        set((state) => ({
          frames: state.frames.filter((f) => f.id !== id),
        }));
      },

      duplicateFrame: (id) => {
        const frame = get().frames.find((f) => f.id === id);
        if (!frame) return null;
        const duplicate = {
          ...frame,
          id: generateId(),
          name: `${frame.name} (Copy)`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          frames: [...state.frames, duplicate],
        }));
        return duplicate;
      },

      getFrameById: (id) => {
        return get().frames.find((f) => f.id === id) || null;
      },

      // Supplier-only strict filter. Depth and minHeight are no longer
      // filters — BayConfig shows depth/height inline so the user can pick
      // the right frame, and selecting one drives rack.frameDepth.
      getFilteredFrames: (supplierId) => {
        return get().frames.filter(
          (f) => !supplierId || f.supplierId === supplierId
        );
      },
    }),
    { name: 'rackvision-frame-database' }
  )
);

export { FRAME_TYPES, generateFrameName };
export default useFrameDatabaseStore;
