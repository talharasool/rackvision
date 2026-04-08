/**
 * Groups NCs by their element key (elementType + elementId).
 * Each group represents one marker position on the canvas/view.
 *
 * @param {Array} ncs - Array of NC objects
 * @returns {Object} Map of groupKey -> { elementType, elementId, ncs: [...] }
 */
export function groupNCsByElement(ncs) {
  const groups = {};

  for (const nc of ncs) {
    const key = `${nc.elementType}-${nc.elementId}`;
    if (!groups[key]) {
      groups[key] = {
        key,
        elementType: nc.elementType,
        elementId: nc.elementId,
        ncs: [],
      };
    }
    groups[key].ncs.push(nc);
  }

  return groups;
}

/**
 * Determines the severity color for a pie-chart arc segment.
 * Returns SVG/CSS hex colors.
 */
export const SEVERITY_COLORS = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
};

/**
 * Returns the worst severity in a group of NCs (red > yellow > green).
 * Useful for the marker outline color.
 */
export function worstSeverity(ncs) {
  if (ncs.some(nc => nc.severity === 'red')) return 'red';
  if (ncs.some(nc => nc.severity === 'yellow')) return 'yellow';
  return 'green';
}
