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

const MAX_HISTORY = 50;

const useRackStore = create(
  persist(
    (set, get) => ({
      racks: [],
      currentRack: null,

      // Undo/redo history (session only, excluded from persistence)
      _history: [],
      _historyIndex: -1,

      _pushHistory: () => {
        const { racks, _history, _historyIndex } = get();
        // Truncate any future states if we branched
        const trimmed = _history.slice(0, _historyIndex + 1);
        const snapshot = JSON.parse(JSON.stringify(racks));
        trimmed.push(snapshot);
        if (trimmed.length > MAX_HISTORY) trimmed.shift();
        set({ _history: trimmed, _historyIndex: trimmed.length - 1 });
      },

      undo: () => {
        const { _history, _historyIndex } = get();
        if (_historyIndex <= 0) return;
        const newIndex = _historyIndex - 1;
        const racks = JSON.parse(JSON.stringify(_history[newIndex]));
        const currentRack = get().currentRack
          ? racks.find((r) => r.id === get().currentRack.id) || null
          : null;
        set({ racks, currentRack, _historyIndex: newIndex });
      },

      redo: () => {
        const { _history, _historyIndex } = get();
        if (_historyIndex >= _history.length - 1) return;
        const newIndex = _historyIndex + 1;
        const racks = JSON.parse(JSON.stringify(_history[newIndex]));
        const currentRack = get().currentRack
          ? racks.find((r) => r.id === get().currentRack.id) || null
          : null;
        set({ racks, currentRack, _historyIndex: newIndex });
      },

      canUndo: () => get()._historyIndex > 0,
      canRedo: () => get()._historyIndex < get()._history.length - 1,

      createRack: (areaId, rackData) => {
        get()._pushHistory();
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
          // Doc 4 §4c: upright profile is non-square. Defaults to uprightWidth
          // if not provided (backwards compat).
          uprightDepth: rackData.uprightDepth || rackData.uprightWidth || 100,
          // Doc 4 §4e: brace pattern (Z/D/K/X)
          braceType: rackData.braceType || 'Z',
          position: defaultPos,
          rotation: rackData.rotation || 0,
          // Doc 4 §2.1c: Front side of rack — the side where frame numbers
          // and rack name appear. 'top' = above (default, matches legacy),
          // 'bottom' = below. User toggles via rack context menu.
          frontSide: rackData.frontSide || 'top',
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
        get()._pushHistory();
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
        get()._pushHistory();
        set((state) => ({
          racks: state.racks.filter((r) => r.id !== id),
          currentRack:
            state.currentRack?.id === id ? null : state.currentRack,
        }));
      },

      duplicateRack: (id) => {
        get()._pushHistory();
        const rack = get().racks.find((r) => r.id === id);
        if (!rack) return null;

        const newRackId = generateId();
        const { bays, frames } = generateBaysAndFrames(
          rack.numberOfBays,
          newRackId
        );

        // Offset below the original rack so it doesn't overlap.
        // Use frame depth (mm * 0.1 = px) + padding so the copy is clearly visible.
        const rackHeightPx = (rack.frameDepth || 1000) * 0.1;
        const offsetY = rackHeightPx + 40;

        const duplicate = {
          ...rack,
          id: newRackId,
          name: `${rack.name} (Copy)`,
          position: {
            x: rack.position.x,
            y: rack.position.y + offsetY,
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
       * Clone all racks whose areaId is a key in `areaIdMap` into the mapped
       * target area. Assigns fresh ids to racks, bays, and frames so the
       * original rack stays untouched. Returns an id-mapping object:
       *   { racks: {oldId → newId}, bays: {...}, frames: {...} }
       * so the NC store can replay the clone and keep references in sync.
       * Used by the Renewals workflow (Doc 1 §1.2, §7.4.1).
       */
      cloneRacksForRenewal: (areaIdMap) => {
        const rackIdMap = {};
        const bayIdMap = {};
        const frameIdMap = {};
        const newRacks = [];

        const source = get().racks.filter((r) =>
          Object.prototype.hasOwnProperty.call(areaIdMap, r.areaId)
        );

        source.forEach((rack) => {
          const newRackId = generateId();
          rackIdMap[rack.id] = newRackId;

          const newBays = (rack.bays || []).map((bay) => {
            const newBayId = generateId();
            bayIdMap[bay.id] = newBayId;
            return {
              ...JSON.parse(JSON.stringify(bay)),
              id: newBayId,
              rackId: newRackId,
            };
          });

          const newFrames = (rack.frames || []).map((frame) => {
            const newFrameId = generateId();
            frameIdMap[frame.id] = newFrameId;
            return {
              ...JSON.parse(JSON.stringify(frame)),
              id: newFrameId,
              rackId: newRackId,
            };
          });

          newRacks.push({
            ...JSON.parse(JSON.stringify(rack)),
            id: newRackId,
            areaId: areaIdMap[rack.areaId],
            bays: newBays,
            frames: newFrames,
          });
        });

        set((state) => ({ racks: [...state.racks, ...newRacks] }));

        return { racks: rackIdMap, bays: bayIdMap, frames: frameIdMap };
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
    {
      name: 'rackvision-racks',
      partialize: (state) => {
        const { _history, _historyIndex, ...rest } = state;
        return rest;
      },
    }
  )
);

export default useRackStore;
