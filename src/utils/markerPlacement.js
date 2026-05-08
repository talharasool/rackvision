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
    case 'beam':
    case 'palletSupportBar':
    case 'deckingPanels':
    case 'pallet':
      return { x: bayWidth * spacing, y: bayDepth / 2 + 12 };

    case 'underpassProtection':
      return { x: bayWidth * 0.15, y: bayDepth / 2 + ncIndex * 12 };

    case 'horizontalBracing':
    case 'bay':
      return { x: bayWidth / 2, y: bayDepth / 2 };

    case 'verticalBracing':
    case 'rearPalletStopBeam':
    case 'rearSafetyMesh':
      return { x: bayWidth * spacing, y: -10 - ncIndex * 12 };

    case 'upright':
    case 'frame':
      if (face === 'rear') {
        return { x: frameWidth / 2, y: bayDepth + 10 + ncIndex * 12 };
      }
      return { x: frameWidth / 2, y: -10 - ncIndex * 12 };

    case 'brace':
      return { x: frameWidth / 2 + 8, y: bayDepth * spacing };

    case 'basePlate':
    case 'footplate':
      return { x: frameWidth / 2, y: bayDepth - 5 + ncIndex * 12 };

    case 'frontImpactGuard':
    case 'beamImpactGuard':
      return { x: frameWidth / 2, y: bayDepth + 10 + ncIndex * 12 };

    case 'cornerImpactGuard':
    case 'leftMiddleImpactGuard':
      return { x: -8 - ncIndex * 12, y: -8 };

    case 'rightMiddleImpactGuard':
      return { x: bayWidth + 8 + ncIndex * 12, y: -8 };

    case 'guardrail':
      return { x: -8 - ncIndex * 12, y: bayDepth / 2 };

    case 'entireRackingSystem':
      return { x: bayWidth / 2, y: -20 - ncIndex * 12 };

    case 'aisle':
      return { x: bayWidth / 2, y: bayDepth + 20 + ncIndex * 12 };

    case 'loadSign':
    case 'topTieBeam':
      return { x: frameWidth / 2, y: -25 - ncIndex * 12 };

    case 'palletOnGround':
      return { x: bayWidth * spacing, y: bayDepth + 30 + ncIndex * 12 };

    case 'neon':
      return { x: bayWidth / 2, y: -35 - ncIndex * 12 };

    case 'shelf':
    case 'closedLocation':
    case 'levelNC':
      return { x: bayWidth * spacing, y: bayDepth / 2 - 12 };

    default:
      return { x: bayWidth * spacing, y: bayDepth / 2 + 12 };
  }
}
