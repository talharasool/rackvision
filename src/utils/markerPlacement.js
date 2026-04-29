/**
 * Compute a default marker position for an NC based on its element type.
 * Only used when markerX/markerY are null (no custom drag position).
 *
 * @param {string} elementType - The element type (e.g., 'beam', 'upright', 'aisle')
 * @param {object} geometry - { bayWidth, bayDepth, frameWidth } in canvas pixels
 * @param {number} ncIndex - Index of this NC within its group (0-based)
 * @param {number} ncCount - Total NCs in the group
 * @param {string} [face] - 'front' or 'rear' — used for upright/frame markers
 * @returns {{ x: number, y: number }} position relative to the bay/frame origin
 */
export function computeMarkerPosition(elementType, geometry, ncIndex, ncCount, face) {
  const { bayWidth = 100, bayDepth = 50, frameWidth = 10 } = geometry;
  const spacing = (ncIndex + 1) / (ncCount + 1);

  switch (elementType) {
    // Inside bay, distributed horizontally
    case 'beam':
    case 'palletSupportBar':
    case 'deckingPanels':
    case 'pallet':
      return { x: bayWidth * spacing, y: bayDepth / 2 + 12 };

    // Inside bay area, left side
    case 'underpassProtection':
      return { x: bayWidth * 0.15, y: bayDepth / 2 + ncIndex * 12 };

    // Center of bay
    case 'horizontalBracing':
    case 'bay':
      return { x: bayWidth / 2, y: bayDepth / 2 };

    // Rear outside bay (offset above)
    case 'verticalBracing':
    case 'rearPalletStopBeam':
    case 'rearSafetyMesh':
      return { x: bayWidth * spacing, y: -10 - ncIndex * 12 };

    // At/near frame — front vs rear based on face property
    case 'upright':
    case 'frame':
      if (face === 'rear') {
        return { x: frameWidth / 2, y: bayDepth + 10 + ncIndex * 12 };
      }
      return { x: frameWidth / 2, y: -10 - ncIndex * 12 };

    // Brace — slightly offset from upright center
    case 'brace':
      return { x: frameWidth / 2 + 8, y: bayDepth * spacing };

    // Footplate / base plate — at floor level
    case 'basePlate':
    case 'footplate':
      return { x: frameWidth / 2, y: bayDepth - 5 + ncIndex * 12 };

    // At/near frame - guards
    case 'frontImpactGuard':
      return { x: frameWidth / 2, y: bayDepth + 10 + ncIndex * 12 };

    case 'cornerImpactGuard':
      return { x: -8 - ncIndex * 12, y: -8 };

    // Guardrail (end-of-aisle) — left edge of bay area
    case 'guardrail':
      return { x: -8 - ncIndex * 12, y: bayDepth / 2 };

    // Entire racking system — above center of bay
    case 'entireRackingSystem':
      return { x: bayWidth / 2, y: -20 - ncIndex * 12 };

    // In front of rack
    case 'aisle':
      return { x: bayWidth / 2, y: bayDepth + 20 + ncIndex * 12 };

    // Load sign, top tie beam
    case 'loadSign':
    case 'topTieBeam':
      return { x: frameWidth / 2, y: -25 - ncIndex * 12 };

    // Default: distribute inside bay
    default:
      return { x: bayWidth * spacing, y: bayDepth / 2 + 12 };
  }
}
