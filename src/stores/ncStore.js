import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NC_ID_MIGRATION, ELEMENT_TYPE_MIGRATION } from '../data/ncTypes';

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2);

const useNCStore = create(
  persist(
    (set, get) => ({
      nonConformities: [],
      _ncMigrationVersion: 2,

      addNC: (data) => {
        const nc = {
          id: generateId(),
          rackId: data.rackId || '',
          bayId: data.bayId || '',
          frameId: data.frameId || '',
          elementType: data.elementType || '',
          elementId: data.elementId || '',
          ncTypeId: data.ncTypeId || '',
          severity: data.severity || 'green',
          notes: data.notes || '',
          photo: data.photo || null,
          // Phase 3 new fields
          face: data.face || '',
          quantity: data.quantity || 1,
          photos: data.photos || [],
          // Custom marker position on layout canvas (null = auto-placement)
          markerX: data.markerX ?? null,
          markerY: data.markerY ?? null,
          createdAt: new Date().toISOString(),
          ...data,
        };

        // Ensure the generated id is preserved
        nc.id = nc.id || generateId();
        nc.createdAt = nc.createdAt || new Date().toISOString();

        // Backward compatibility: ensure new fields have defaults
        // even if spread data didn't include them
        if (nc.face === undefined) nc.face = '';
        if (nc.quantity === undefined || nc.quantity < 1) nc.quantity = 1;
        if (!Array.isArray(nc.photos)) nc.photos = [];

        set((state) => ({
          nonConformities: [...state.nonConformities, nc],
        }));

        return nc;
      },

      updateNC: (id, data) => {
        set((state) => ({
          nonConformities: state.nonConformities.map((nc) =>
            nc.id === id ? { ...nc, ...data } : nc
          ),
        }));
      },

      removeNC: (id) => {
        set((state) => ({
          nonConformities: state.nonConformities.filter((nc) => nc.id !== id),
        }));
      },

      getNCsForElement: (elementType, elementId) => {
        return get().nonConformities.filter(
          (nc) => nc.elementType === elementType && nc.elementId === elementId
        );
      },

      getNCsForRack: (rackId) => {
        return get().nonConformities.filter((nc) => nc.rackId === rackId);
      },

      getNCsForBay: (bayId) => {
        return get().nonConformities.filter((nc) => nc.bayId === bayId);
      },

      getNCsForFrame: (frameId) => {
        return get().nonConformities.filter((nc) => nc.frameId === frameId);
      },
    }),
    {
      name: 'rackvision-ncs',
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state._ncMigrationVersion >= 2) return;

        // Migrate all NCs
        const migrated = state.nonConformities.map((nc) => {
          const newNcTypeId = NC_ID_MIGRATION[nc.ncTypeId] || nc.ncTypeId;
          const newElementType = ELEMENT_TYPE_MIGRATION[nc.elementType] || nc.elementType;
          if (newNcTypeId !== nc.ncTypeId || newElementType !== nc.elementType) {
            return { ...nc, ncTypeId: newNcTypeId, elementType: newElementType };
          }
          return nc;
        });

        state.nonConformities = migrated;
        state._ncMigrationVersion = 2;
      },
    }
  )
);

export default useNCStore;
