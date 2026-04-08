/**
 * Compute a default marker position for an NC based on its element type.
 * Only used when markerX/markerY are null (no custom drag position).
 *
 * @param {string} elementType - The element type (e.g., 'beam', 'upright', 'aisle')
 * @param {object} geometry - { bayWidth, bayDepth, frameWidth } in canvas pixels
 * @param {number} ncIndex - Index of this NC within its group (0-based)
 * @param {number} ncCount - Total NCs in the group
 * @returns {{ x: number, y: number }} position relative to the bay/frame origin
 */
export function computeMarkerPosition(elementType, geometry, ncIndex, ncCount) {
  const { bayWidth = 100, bayDepth = 50, frameWidth = 10 } = geometry;
  const spacing = (ncIndex + 1) / (ncCount + 1);

  switch (elementType) {
    // Inside bay, distributed horizontally
    case 'beam':
    case 'palletSupportBar':
    case 'deckingPanels':
    case 'pallet':
    case 'underpassProtection':
      return { x: bayWidth * spacing, y: bayDepth / 2 + 12 };

    // Center of bay
    case 'horizontalBracing':
    case 'bay':
      return { x: bayWidth / 2, y: bayDepth / 2 };

    // Rear outside bay (offset above)
    case 'verticalBracing':
    case 'rearPalletStopBeam':
    case 'rearSafetyMesh':
      return { x: bayWidth * spacing, y: -10 - ncIndex * 12 };

    // At/near frame (left side)
    case 'upright':
    case 'frame':
    case 'brace':
    case 'basePlate':
    case 'footplate':
      return { x: frameWidth / 2, y: -12 - ncIndex * 14 };

    // At/near frame - guards
    case 'frontImpactGuard':
      return { x: frameWidth / 2, y: bayDepth + 10 + ncIndex * 12 };

    case 'cornerImpactGuard':
      return { x: -8 - ncIndex * 12, y: -8 };

    // Edge of rack
    case 'guardrail':
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
