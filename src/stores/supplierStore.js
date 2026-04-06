import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2);

const useSupplierStore = create(
  persist(
    (set, get) => ({
      suppliers: [],

      addSupplier: (data) => {
        const supplier = {
          id: generateId(),
          name: data.name || '',
          color: data.color || '#3b82f6',
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          suppliers: [...state.suppliers, supplier],
        }));
        return supplier;
      },

      updateSupplier: (id, data) => {
        set((state) => ({
          suppliers: state.suppliers.map((s) =>
            s.id === id ? { ...s, ...data } : s
          ),
        }));
      },

      deleteSupplier: (id) => {
        set((state) => ({
          suppliers: state.suppliers.filter((s) => s.id !== id),
        }));
      },

      getSupplierById: (id) => {
        return get().suppliers.find((s) => s.id === id) || null;
      },

      getSupplierByName: (name) => {
        return get().suppliers.find((s) => s.name === name) || null;
      },
    }),
    { name: 'rackvision-suppliers' }
  )
);

export default useSupplierStore;
