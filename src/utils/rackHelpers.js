/**
 * Rack-related computed helpers.
 */

/**
 * Get the effective length of a bay (custom length override or rack default).
 */
export function getBayLength(rack, bay) {
  if (bay?.bayConfig?.customLength != null) return bay.bayConfig.customLength;
  return rack?.bayLength || 0;
}

/**
 * Build the synthetic "Bay Description" string for a rack (Doc 1 §3.1.1).
 * Groups consecutive bays of the same length.
 *
 * Example: 3 bays at 2700, 1 bay at 1800, 1 bay at 2700
 *   → "3x2700+1x1800+1x2700"
 *
 * Returns an empty string if the rack has no bays.
 */
export function getBayDescription(rack) {
  if (!rack || !Array.isArray(rack.bays) || rack.bays.length === 0) return '';

  const groups = [];
  let current = null;

  for (const bay of rack.bays) {
    const len = getBayLength(rack, bay);
    if (current && current.length === len) {
      current.count += 1;
    } else {
      current = { length: len, count: 1 };
      groups.push(current);
    }
  }

  return groups.map((g) => `${g.count}x${g.length}`).join('+');
}
