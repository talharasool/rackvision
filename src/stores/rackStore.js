import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2);

/**
 * Auto-generate bays and frames arrays for a rack.
 * Frames = numberOfBays + 1 (one frame between each bay, plus one at each end).
 */
function generateBaysAndFrames(numberOfBays, rackId) {
  const bays = [];
  const frames = [];

  for (let i = 0; i < numberOfBays; i++) {
    bays.push({
      id: generateId(),
      rackId,
      index: i,
      name: `Bay ${i + 1}`,
      bayConfig: {
        beamSelections: [],
        accessories: [],
        customLength: null,
        leftFrameDbId: '',
        rightFrameDbId: '',
      },
    });
  }

  const frameCount = numberOfBays + 1;
  for (let i = 0; i < frameCount; i++) {
    frames.push({
      id: generateId(),
      rackId,
      index: i,
      name: `Frame ${i + 1}`,
    });
  }

  return { bays, frames };
}

/**
 * Ensure a bay has the bayConfig structure (backward compatibility).
 */
function ensureBayConfig(bay) {
  if (!bay.bayConfig) {
    return {
      ...bay,
      bayConfig: {
        beamSelections: [],
        accessories: [],
        customLength: null,
        leftFrameDbId: '',
        rightFrameDbId: '',
      },
    };
  }
  return bay;
}

const useRackStore = create(
  persist(
    (set, get) => ({
      racks: [],
      currentRack: null,

      createRack: (areaId, rackData) => {
        const rackId = generateId();
        const numberOfBays = rackData.numberOfBays || 1;
        const { bays, frames } = generateBaysAndFrames(numberOfBays, rackId);

        // Offset new racks so they don't all stack at origin
        const existingAreaRacks = get().racks.filter((r) => r.areaId === areaId);
        const defaultPos = rackData.position || {
          x: 100 + existingAreaRacks.length * 50,
          y: 100 + existingAreaRacks.length * 150,
        };

        const rack = {
          id: rackId,
          areaId,
          name: rackData.name || '',
          manufacturer: rackData.manufacturer || '',
          supplierId: rackData.supplierId || '',
          supplierName: rackData.supplierName || '',
          numberOfBays,
          bayLength: rackData.bayLength || 2700,
          beamType: rackData.beamType || '',
          levels: rackData.levels || 3,
          firstElevation: rackData.firstElevation || 0,
          levelSpacing: rackData.levelSpacing || 1500,
          frameHeight: rackData.frameHeight || 6000,
          frameDepth: rackData.frameDepth || 1000,
          uprightWidth: rackData.uprightWidth || 100,
          position: defaultPos,
          rotation: rackData.rotation || 0,
          bays,
          frames,
          ...rackData,
          // Ensure generated bays/frames override any passed-in values
          id: rackId,
          areaId,
        };

        // Re-assign bays/frames in case ...rackData overwrote them
        rack.bays = bays;
        rack.frames = frames;

        set((state) => ({
          racks: [...state.racks, rack],
          currentRack: rack,
        }));

        return rack;
      },

      updateRack: (id, data) => {
        set((state) => {
          let updatedRack = null;

          const racks = state.racks.map((rack) => {
            if (rack.id !== id) return rack;

            const merged = { ...rack, ...data };

            // Regenerate bays/frames if numberOfBays changed
            if (
              data.numberOfBays !== undefined &&
              data.numberOfBays !== rack.numberOfBays
            ) {
              const { bays, frames } = generateBaysAndFrames(
                data.numberOfBays,
                id
              );
              merged.bays = bays;
              merged.frames = frames;
            }

            updatedRack = merged;
            return merged;
          });

          const currentRack =
            state.currentRack?.id === id
              ? updatedRack
              : state.currentRack;

          return { racks, currentRack };
        });
      },

      deleteRack: (id) => {
        set((state) => ({
          racks: state.racks.filter((r) => r.id !== id),
          currentRack:
            state.currentRack?.id === id ? null : state.currentRack,
        }));
      },

      duplicateRack: (id) => {
        const rack = get().racks.find((r) => r.id === id);
        if (!rack) return null;

        const newRackId = generateId();
        const { bays, frames } = generateBaysAndFrames(
          rack.numberOfBays,
          newRackId
        );

        const duplicate = {
          ...rack,
          id: newRackId,
          name: `${rack.name} (Copy)`,
          position: {
            x: rack.position.x + 50,
            y: rack.position.y + 50,
          },
          bays,
          frames,
        };

        set((state) => ({
          racks: [...state.racks, duplicate],
        }));

        return duplicate;
      },

      setCurrentRack: (id) => {
        const rack = get().racks.find((r) => r.id === id) || null;
        set({ currentRack: rack });
      },

      /**
       * Update a specific bay's config within a rack.
       * bayData is merged into the bay object; if bayData.bayConfig is provided,
       * it is merged into the existing bayConfig.
       */
      updateBay: (rackId, bayId, bayData) => {
        set((state) => {
          let updatedRack = null;

          const racks = state.racks.map((rack) => {
            if (rack.id !== rackId) return rack;

            const updatedBays = rack.bays.map((bay) => {
              if (bay.id !== bayId) return bay;
              const safeBay = ensureBayConfig(bay);

              // If bayData contains bayConfig, merge it into existing
              if (bayData.bayConfig) {
                return {
                  ...safeBay,
                  ...bayData,
                  bayConfig: {
                    ...safeBay.bayConfig,
                    ...bayData.bayConfig,
                  },
                };
              }

              return { ...safeBay, ...bayData };
            });

            updatedRack = { ...rack, bays: updatedBays };
            return updatedRack;
          });

          const currentRack =
            state.currentRack?.id === rackId
              ? updatedRack
              : state.currentRack;

          return { racks, currentRack };
        });
      },

      /**
       * Copy the bayConfig from sourceBayId to all targetBayIds within the same rack.
       */
      duplicateBayConfig: (rackId, sourceBayId, targetBayIds) => {
        set((state) => {
          let updatedRack = null;

          const racks = state.racks.map((rack) => {
            if (rack.id !== rackId) return rack;

            const sourceBay = rack.bays.find((b) => b.id === sourceBayId);
            if (!sourceBay) return rack;

            const safeSrc = ensureBayConfig(sourceBay);
            const configCopy = JSON.parse(JSON.stringify(safeSrc.bayConfig));

            const updatedBays = rack.bays.map((bay) => {
              if (!targetBayIds.includes(bay.id)) return bay;
              const safeBay = ensureBayConfig(bay);
              return {
                ...safeBay,
                bayConfig: { ...configCopy },
              };
            });

            updatedRack = { ...rack, bays: updatedBays };
            return updatedRack;
          });

          const currentRack =
            state.currentRack?.id === rackId
              ? updatedRack
              : state.currentRack;

          return { racks, currentRack };
        });
      },
    }),
    { name: 'rackvision-racks' }
  )
);

export default useRackStore;
