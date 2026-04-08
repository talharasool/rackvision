import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getNCTypeName, getNCTypeById, resolveElementType } from './ncHelpers';
import { SCOPE_CATEGORIES } from '../data/ncTypes';

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
      Scope: (() => {
        const ncType = getNCTypeById(nc.ncTypeId);
        const cat = ncType?.scopeCategory;
        return SCOPE_CATEGORIES[cat]?.label || 'Other';
      })(),
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
  'Scope',
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

/**
 * Column widths for XLSX export (in characters).
 */
const COL_WIDTHS = [
  { wch: 15 },  // Lot
  { wch: 20 },  // Manufacturer
  { wch: 12 },  // Rack name
  { wch: 12 },  // Reference
  { wch: 8 },   // Level
  { wch: 10 },  // Position
  { wch: 10 },  // Quantity
  { wch: 20 },  // Element
  { wch: 30 },  // Photo
  { wch: 40 },  // Description
  { wch: 30 },  // Anomaly
  { wch: 8 },   // Damage
  { wch: 18 },  // Scope
];

/**
 * Create an XLSX workbook buffer from rows.
 * @param {Array<object>} rows
 * @returns {ArrayBuffer}
 */
function buildXLSXBuffer(rows) {
  const ws = XLSX.utils.json_to_sheet(rows, { header: HEADERS });
  ws['!cols'] = COL_WIDTHS;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Non-Conformities');
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

/**
 * Download rows as an XLSX file.
 * @param {Array<object>} rows
 * @param {string} filename - Should end with .xlsx
 */
export function downloadXLSX(rows, filename) {
  const buf = buildXLSXBuffer(rows);
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, filename);
}

/**
 * Convert a base64 data URI to a Uint8Array.
 * @param {string} dataUri - e.g. "data:image/jpeg;base64,..."
 * @returns {Uint8Array}
 */
function dataUriToUint8Array(dataUri) {
  const base64 = dataUri.split(',')[1];
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

/**
 * Get file extension from a data URI mime type.
 * @param {string} dataUri
 * @returns {string}
 */
function getExtensionFromDataUri(dataUri) {
  const match = dataUri.match(/^data:image\/(\w+)/);
  if (match) {
    const type = match[1].toLowerCase();
    if (type === 'jpeg') return 'jpg';
    return type;
  }
  return 'jpg';
}

/**
 * Download a ZIP bundle containing an XLSX file and photos.
 * @param {Array<object>} rows - Export rows (same as CSV/XLSX)
 * @param {Array<{ncId: string, photos: string[]}>} photos - NC photos as base64 data URIs
 * @param {string} filename - Should end with .zip
 */
export async function downloadZIPBundle(rows, photos, filename) {
  const zip = new JSZip();

  // Add the XLSX file
  const xlsxBuf = buildXLSXBuffer(rows);
  zip.file('inspection.xlsx', xlsxBuf);

  // Add photos folder
  const photosFolder = zip.folder('photos');
  if (Array.isArray(photos)) {
    photos.forEach((ncEntry, ncIndex) => {
      if (!ncEntry?.photos || !Array.isArray(ncEntry.photos)) return;
      const ncNum = String(ncIndex + 1).padStart(5, '0');
      ncEntry.photos.forEach((photoUri, photoIndex) => {
        if (typeof photoUri !== 'string' || !photoUri.startsWith('data:')) return;
        const ext = getExtensionFromDataUri(photoUri);
        const photoName = `NC_${ncNum}_${photoIndex + 1}.${ext}`;
        const bytes = dataUriToUint8Array(photoUri);
        photosFolder.file(photoName, bytes);
      });
    });
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, filename);
}
