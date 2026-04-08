import { getNCTypeName, resolveElementType } from './ncHelpers';

// Map element type keys to display names
const ELEMENT_DISPLAY_NAMES = {
  beam: 'Beam',
  upright: 'Upright',
  frame: 'Frame',
  brace: 'Brace',
  horizontalBracing: 'Horizontal Bracing',
  verticalBracing: 'Vertical Bracing',
  frontImpactGuard: 'Front Impact Guard',
  cornerImpactGuard: 'Corner Impact Guard',
  guardrail: 'Guardrail',
  palletSupportBar: 'Pallet Support Bar',
  rearPalletStopBeam: 'Rear Pallet Stop Beam',
  underpassProtection: 'Underpass Protection',
  rearSafetyMesh: 'Rear Safety Mesh',
  deckingPanels: 'Decking Panels',
  pallet: 'Pallet',
  entireRackingSystem: 'Entire Racking System',
  bay: 'Bay',
  aisle: 'Aisle',
  basePlate: 'Base Plate',
  loadSign: 'Load Sign',
  topTieBeam: 'Top Tie Beam',
  footplate: 'Footplate',
  diagonal: 'Diagonal',
  crossMember: 'Cross Member',
  horizontal: 'Horizontal Brace',
};

/**
 * Get display name for an element type, resolving old types.
 */
function getElementDisplayName(elementType) {
  if (!elementType) return '-';
  const resolved = resolveElementType(elementType);
  return ELEMENT_DISPLAY_NAMES[resolved] || resolved;
}

/**
 * Extract level info from an elementId string.
 * Examples:
 *   "beam-level-3" -> "L3"
 *   "upright-left"  -> "-"
 *   "brace-2"       -> "-"
 */
function extractLevel(elementId) {
  if (!elementId) return '-';
  const match = elementId.match(/level[- _]?(\d+)/i);
  if (match) return `L${match[1]}`;
  return '-';
}

/**
 * Find the bay or frame label for an NC based on its bayId/frameId
 * and the rack's bays/frames arrays.
 */
function getBayFrameLabel(nc, rack) {
  if (!rack) return '-';

  if (nc.bayId) {
    const bay = rack.bays?.find((b) => b.id === nc.bayId);
    if (bay) return bay.name || `Bay ${bay.index + 1}`;
    return 'Bay ?';
  }

  if (nc.frameId) {
    const frame = rack.frames?.find((f) => f.id === nc.frameId);
    if (frame) return frame.name || `Frame ${frame.index + 1}`;
    return 'Frame ?';
  }

  return '-';
}

/**
 * Format an ISO date string as YYYY-MM-DD.
 */
function formatDate(isoString) {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '-';
    return d.toISOString().slice(0, 10);
  } catch {
    return '-';
  }
}

/**
 * Count photos attached to an NC.
 */
function countPhotos(nc) {
  let count = 0;
  if (Array.isArray(nc.photos)) count += nc.photos.length;
  if (nc.photo && !nc.photos?.length) count += 1;
  return count;
}

/**
 * Build export rows from NC data.
 * @param {object} params - { inspection, areas, racks, nonConformities }
 *   areas: array of working area objects (each with id, name)
 *   racks: array of rack objects
 *   nonConformities: array of all NCs
 * @returns {Array<object>} rows with all columns
 */
export function buildExportRows({ inspection, areas, racks, nonConformities }) {
  // Build lookup maps
  const rackMap = {};
  racks.forEach((r) => {
    rackMap[r.id] = r;
  });

  // Build area lookup: rackId -> area
  // A rack's areaId links to an area
  const areaMap = {};
  if (Array.isArray(areas)) {
    areas.forEach((a) => {
      areaMap[a.id] = a;
    });
  }

  // Determine which rack IDs belong to the given areas
  const areaIds = new Set(areas.map((a) => a.id));
  const relevantRackIds = new Set(
    racks.filter((r) => areaIds.has(r.areaId)).map((r) => r.id)
  );

  // Filter NCs: only those belonging to relevant racks
  const filteredNCs = nonConformities.filter(
    (nc) => nc.rackId && relevantRackIds.has(nc.rackId)
  );

  const rows = filteredNCs.map((nc) => {
    const rack = rackMap[nc.rackId];
    const area = rack ? areaMap[rack.areaId] : null;

    return {
      Area: area?.name || '-',
      Rack: rack?.name || '-',
      'Bay/Frame': getBayFrameLabel(nc, rack),
      Level: extractLevel(nc.elementId),
      Element: getElementDisplayName(nc.elementType),
      Position: nc.face ? nc.face.toUpperCase() : '-',
      Quantity: nc.quantity || 1,
      'NC Type': getNCTypeName(nc.ncTypeId),
      Severity: nc.severity || '-',
      Notes: nc.notes || '',
      Photos: countPhotos(nc),
      Date: formatDate(nc.createdAt),
    };
  });

  return rows;
}

/**
 * Escape a value for CSV (RFC 4180 compliant).
 * Wraps in double quotes if the value contains commas, double quotes, or newlines.
 * Double quotes within are escaped by doubling them.
 */
function escapeCSVField(value) {
  const str = value == null ? '' : String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Convert rows to CSV string (RFC 4180).
 * @param {Array<object>} rows
 * @returns {string}
 */
export function rowsToCSV(rows) {
  if (!rows || rows.length === 0) return '';

  const headers = [
    'Area',
    'Rack',
    'Bay/Frame',
    'Level',
    'Element',
    'Position',
    'Quantity',
    'NC Type',
    'Severity',
    'Notes',
    'Photos',
    'Date',
  ];

  const lines = [headers.map(escapeCSVField).join(',')];

  rows.forEach((row) => {
    const line = headers.map((h) => escapeCSVField(row[h])).join(',');
    lines.push(line);
  });

  return lines.join('\r\n');
}

/**
 * Trigger browser download of a string as a file.
 * @param {string} content
 * @param {string} filename
 * @param {string} mimeType
 */
export function downloadFile(content, filename, mimeType = 'text/csv') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
