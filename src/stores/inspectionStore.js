import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2);

const useInspectionStore = create(
  persist(
    (set, get) => ({
      inspections: [],
      currentInspection: null,

      createInspection: (data) => {
        const inspection = {
          id: generateId(),
          createdAt: new Date().toISOString(),
          status: 'draft',
          reseller: data.reseller || '',
          endCustomer: data.endCustomer || '',
          siteAddress: data.siteAddress || '',
          city: data.city || '',
          contactName: data.contactName || '',
          contactPhone: data.contactPhone || '',
          contactEmail: data.contactEmail || '',
          workingAreas: [],
          ...data,
        };

        set((state) => ({
          inspections: [...state.inspections, inspection],
          currentInspection: inspection,
        }));

        return inspection;
      },

      updateInspection: (id, data) => {
        set((state) => {
          const inspections = state.inspections.map((ins) =>
            ins.id === id ? { ...ins, ...data } : ins
          );
          const currentInspection =
            state.currentInspection?.id === id
              ? { ...state.currentInspection, ...data }
              : state.currentInspection;

          return { inspections, currentInspection };
        });
      },

      setCurrentInspection: (id) => {
        const inspection = get().inspections.find((ins) => ins.id === id) || null;
        set({ currentInspection: inspection });
      },

      addWorkingArea: (inspectionId, area) => {
        const workingArea = {
          id: generateId(),
          name: area.name || '',
          description: area.description || '',
          ...area,
        };

        set((state) => {
          const inspections = state.inspections.map((ins) => {
            if (ins.id !== inspectionId) return ins;
            return { ...ins, workingAreas: [...ins.workingAreas, workingArea] };
          });

          const currentInspection =
            state.currentInspection?.id === inspectionId
              ? {
                  ...state.currentInspection,
                  workingAreas: [
                    ...state.currentInspection.workingAreas,
                    workingArea,
                  ],
                }
              : state.currentInspection;

          return { inspections, currentInspection };
        });

        return workingArea;
      },

      removeWorkingArea: (inspectionId, areaId) => {
        set((state) => {
          const inspections = state.inspections.map((ins) => {
            if (ins.id !== inspectionId) return ins;
            return {
              ...ins,
              workingAreas: ins.workingAreas.filter((a) => a.id !== areaId),
            };
          });

          const currentInspection =
            state.currentInspection?.id === inspectionId
              ? {
                  ...state.currentInspection,
                  workingAreas: state.currentInspection.workingAreas.filter(
                    (a) => a.id !== areaId
                  ),
                }
              : state.currentInspection;

          return { inspections, currentInspection };
        });
      },
    }),
    { name: 'rackvision-inspections' }
  )
);

export default useInspectionStore;
