import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2);

const ACCESSORY_CATEGORIES = [
  { value: 'pallet-support-bar', label: 'Pallet Support Bar' },
  { value: 'rear-pallet-stop', label: 'Rear Pallet Stop Beam' },
  { value: 'decking-panel', label: 'Decking Panel' },
  { value: 'safety-mesh', label: 'Safety Mesh' },
  { value: 'underpass-protection', label: 'Underpass Protection' },
  { value: 'guardrail', label: 'Guardrail' },
  { value: 'front-impact-guard', label: 'Front Impact Guard' },
  { value: 'corner-impact-guard', label: 'Corner Impact Guard' },
  { value: 'load-sign', label: 'Load Sign' },
  { value: 'top-tie-beam', label: 'Top Tie Beam' },
  { value: 'other', label: 'Other' },
];

const useAccessoryDatabaseStore = create(
  persist(
    (set, get) => ({
      accessories: [],

      addAccessory: (data) => {
        const accessory = {
          id: generateId(),
          name: (data.name || '').trim(),
          description: (data.description || '').trim(),
          category: data.category || 'other',
          supplierId: data.supplierId || '',
          supplierName: data.supplierName || '',
          supplierCode: data.supplierCode || '',
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          accessories: [...state.accessories, accessory],
        }));
        return accessory;
      },

      updateAccessory: (id, data) => {
        set((state) => ({
          accessories: state.accessories.map((a) => {
            if (a.id !== id) return a;
            return {
              ...a,
              ...data,
              name: (data.name ?? a.name ?? '').trim(),
              description: (data.description ?? a.description ?? '').trim(),
            };
          }),
        }));
      },

      deleteAccessory: (id) => {
        set((state) => ({
          accessories: state.accessories.filter((a) => a.id !== id),
        }));
      },

      duplicateAccessory: (id) => {
        const acc = get().accessories.find((a) => a.id === id);
        if (!acc) return null;
        const duplicate = {
          ...acc,
          id: generateId(),
          name: `${acc.name} (Copy)`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          accessories: [...state.accessories, duplicate],
        }));
        return duplicate;
      },

      getAccessoryById: (id) => {
        return get().accessories.find((a) => a.id === id) || null;
      },

      getFilteredAccessories: (supplierId) => {
        return get().accessories.filter(
          (a) => !supplierId || a.supplierId === supplierId
        );
      },
    }),
    { name: 'rackvision-accessory-database' }
  )
);

export { ACCESSORY_CATEGORIES };
export default useAccessoryDatabaseStore;
