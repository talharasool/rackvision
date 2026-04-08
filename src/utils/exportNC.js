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
  if (!elementType) return '';
  const resolved = resolveElementType(elementType);
  return ELEMENT_DISPLAY_NAMES[resolved] || resolved;
}

/**
 * Extract level/index info from an elementId string.
 * For bay NCs: level number (e.g., "beam-level-3" -> "3")
 * For frame NCs: element index (e.g., "diagonal-2" -> "2", "brace-1" -> "1")
 */
function extractLevel(elementId, isFrameNC) {
  if (!elementId) return '';
  // Level match
  const levelMatch = elementId.match(/level[- _]?(\d+)/i);
  if (levelMatch) return levelMatch[1];
  // Element index (for frame NCs — diagonal, horizontal brace)
  if (isFrameNC) {
    const indexMatch = elementId.match(/(\d+)/);
    if (indexMatch) return indexMatch[1];
  }
  return '';
}

/**
 * Get Reference column: bay number or frame number.
 */
function getReference(nc, rack) {
  if (!rack) return '';

  if (nc.bayId) {
    const bay = rack.bays?.find((b) => b.id === nc.bayId);
    if (bay) return bay.name || `Bay ${(bay.index ?? 0) + 1}`;
    return '';
  }

  if (nc.frameId) {
    const frame = rack.frames?.find((f) => f.id === nc.frameId);
    if (frame) return frame.name || `Frame ${(frame.index ?? 0) + 1}`;
    return '';
  }

  return '';
}

/**
 * Get Description column: element characteristics from beam/frame data.
 * E.g., "L=1806 Modulblok section 120x45 mm BLUE"
 */
function getDescription(nc, rack) {
  if (!rack) return nc.notes || '';

  const resolved = resolveElementType(nc.elementType);

  // For beam NCs, try to get beam details from the bay's level config
  if (resolved === 'beam' && nc.bayId) {
    const bay = rack.bays?.find((b) => b.id === nc.bayId);
    const levelMatch = nc.elementId?.match(/level[- _]?(\d+)/i);
    if (bay && levelMatch) {
      const levelIdx = parseInt(levelMatch[1], 10);
      const lb = bay.levelBeams?.[levelIdx];
      if (lb?.beamName) return lb.beamName;
    }
    // Fallback to rack-level beam type
    if (rack.beamType) return rack.beamType;
  }

  // For frame NCs, try to get frame details
  if (nc.frameId) {
    const frame = rack.frames?.find((f) => f.id === nc.frameId);
    if (frame?.name || frame?.model) return frame.name || frame.model;
    if (rack.frameType) return rack.frameType;
  }

  // Fallback to notes
  return nc.notes || '';
}

/**
 * Get photo filenames/paths separated by ;
 * In CSV: list of filenames separated by ;
 */
function getPhotoList(nc) {
  const photos = [];
  if (Array.isArray(nc.photos) && nc.photos.length > 0) {
    nc.photos.forEach((p, i) => {
      if (typeof p === 'string' && p.startsWith('data:')) {
        photos.push(`Photo ${i + 1}`);
      } else if (typeof p === 'string') {
        photos.push(p);
      } else if (p?.name) {
        photos.push(p.name);
      } else {
        photos.push(`Photo ${i + 1}`);
      }
    });
  } else if (nc.photo) {
    if (typeof nc.photo === 'string' && nc.photo.startsWith('data:')) {
      photos.push('Photo 1');
    } else {
      photos.push(nc.photo);
    }
  }
  return photos.join('; ');
}

/**
 * Format severity as G/Y/R code.
 */
function formatDamage(severity) {
  if (!severity) return '';
  const map = { green: 'G', yellow: 'Y', red: 'R' };
  return map[severity.toLowerCase()] || severity;
}

/**
 * Build export rows from NC data.
 * Column order per Doc 1 Ch 6.2:
 *   Lot, Manufacturer, Rack name, Reference, Level, Position, Quantity, Element, Photo, Description, Anomaly, Damage
 *
 * @param {object} params - { inspection, areas, racks, nonConformities }
 * @returns {Array<object>} rows with all columns
 */
export function buildExportRows({ inspection, areas, racks, nonConformities }) {
  // Build lookup maps
  const rackMap = {};
  racks.forEach((r) => {
    rackMap[r.id] = r;
  });

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
    const isFrameNC = !!nc.frameId && !nc.bayId;

    return {
      Lot: area?.name || '',
      Manufacturer: rack?.manufacturer || rack?.supplierName || '',
      'Rack name': rack?.name || '',
      Reference: getReference(nc, rack),
      Level: extractLevel(nc.elementId, isFrameNC),
      Position: nc.face ? nc.face.toUpperCase() : '',
      Quantity: nc.quantity || 1,
      Element: getElementDisplayName(nc.elementType),
      Photo: getPhotoList(nc),
      Description: getDescription(nc, rack),
      Anomaly: getNCTypeName(nc.ncTypeId),
      Damage: formatDamage(nc.severity),
    };
  });

  return rows;
}

/**
 * Escape a value for CSV (RFC 4180 compliant).
 */
function escapeCSVField(value) {
  const str = value == null ? '' : String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes(';')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Doc 1 Ch 6.2 column order (left to right).
 */
const HEADERS = [
  'Lot',
  'Manufacturer',
  'Rack name',
  'Reference',
  'Level',
  'Position',
  'Quantity',
  'Element',
  'Photo',
  'Description',
  'Anomaly',
  'Damage',
];

/**
 * Convert rows to CSV string (RFC 4180).
 * @param {Array<object>} rows
 * @returns {string}
 */
export function rowsToCSV(rows) {
  if (!rows || rows.length === 0) return '';

  const lines = [HEADERS.map(escapeCSVField).join(',')];

  rows.forEach((row) => {
    const line = HEADERS.map((h) => escapeCSVField(row[h])).join(',');
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
  const blob = new Blob(['\uFEFF' + content], { type: mimeType + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
