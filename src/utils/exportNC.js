import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { resolveElementType } from './ncHelpers';

// Italian element names per Allegato B — Elenchi sheet
const ELEMENT_ITALIAN_NAMES = {
  beam: 'Corrente',
  upright: 'Montante',
  frame: 'Spalla',
  brace: 'Traversino',
  diagonal: 'Diagonale',
  horizontal: 'Traversino',
  crossMember: 'Traversino',
  horizontalBracing: 'cv_orizz',
  verticalBracing: 'cv_vert',
  frontImpactGuard: 'Paracolpo frontale',
  cornerImpactGuard: 'Paracolpo angolo',
  leftMiddleImpactGuard: 'Paracolpo mezzo sx',
  rightMiddleImpactGuard: 'Paracolpo mezzo dx',
  guardrail: 'Guard rail',
  palletSupportBar: 'Rompitratta',
  rearPalletStopBeam: 'Trave batt. post.',
  beamImpactGuard: 'Trave paracolpo',
  underpassProtection: 'Prot. sottopasso',
  rearSafetyMesh: 'Rete post.',
  deckingPanels: 'Pianetti',
  pallet: 'Pallet',
  palletOnGround: 'Pallet a terra',
  entireRackingSystem: 'Intera scaffalatura',
  neon: 'Neon',
  shelf: 'Mensola',
  aisle: 'Corridoio',
  closedLocation: 'Locazione chiusa',
  levelNC: 'Livello',
  bay: 'Campata',
  basePlate: 'Basetta',
  loadSign: 'Tabella di portata',
  topTieBeam: 'Trave di sommità',
  footplate: 'Piedino',
};

// Italian NC type names per Allegato B — Elenchi sheet
const NC_ITALIAN_NAMES = {
  // beam
  'beam-damaged': 'Danneggiato/i',
  'beam-overloaded': 'Sovraccaricato/i',
  'beam-missing-safety-lock': 'Antisgancio mancante/i',
  'beam-missing': 'Mancante/i',
  'beam-wrong-section': 'Sezione sbagliata (inferiore)',
  'beam-different-sections': 'Sezioni diverse tra anteriore e posteriore',
  'beam-corrosion': 'Corroso/presenza di ruggine',
  'beam-detached': 'Sganciato/i o parz. sganciato/i',
  'beam-other': 'Altro (vedi note)',
  // upright
  'upright-damaged': 'Danneggiato/i',
  'upright-missing-anchor-bolt': 'Tassello/i mancante/i o tranciato/i',
  'upright-corrosion': 'Corroso/presenza di ruggine',
  'upright-damaged-foot-plate': 'Piedino danneggiato',
  'upright-twisted': 'Ruotato/i',
  'upright-verticality': 'Verticalità fuori tolleranza',
  'upright-other': 'Altro (vedi note)',
  // frame / brace
  'frame-verticality': 'Verticalità fuori tolleranza',
  'frame-other': 'Altro (vedi note)',
  'brace-damaged': 'Danneggiato/i',
  'brace-other': 'Altro (vedi note)',
  // horizontal/vertical bracing
  'horizontalbracing-damaged': 'Danneggiato/i',
  'horizontalbracing-other': 'Altro (vedi note)',
  'verticalbracing-damaged': 'Danneggiato/i',
  'verticalbracing-other': 'Altro (vedi note)',
  // front impact guard
  'frontimpactguard-damaged': 'Danneggiato/i',
  'frontimpactguard-missing': 'Mancante/i',
  'frontimpactguard-missing-anchor-bolt': 'Tassello/i mancante/i o tranciato/i',
  'frontimpactguard-to-be-refixed': 'Da rifissare',
  'frontimpactguard-other': 'Altro (vedi note)',
  // corner impact guard
  'cornerimpactguard-damaged': 'Danneggiato/i',
  'cornerimpactguard-missing': 'Mancante/i',
  'cornerimpactguard-missing-anchor-bolt': 'Tassello/i mancante/i o tranciato/i',
  'cornerimpactguard-to-be-refixed': 'Da rifissare',
  'cornerimpactguard-other': 'Altro (vedi note)',
  // left middle impact guard
  'leftmiddleimpactguard-damaged': 'Danneggiato/i',
  'leftmiddleimpactguard-missing': 'Mancante/i',
  'leftmiddleimpactguard-to-be-refixed': 'Da rifissare',
  'leftmiddleimpactguard-missing-anchor-bolt': 'Tassello/i mancante/i o tranciato/i',
  'leftmiddleimpactguard-other': 'Altro (vedi note)',
  // right middle impact guard
  'rightmiddleimpactguard-damaged': 'Danneggiato/i',
  'rightmiddleimpactguard-missing': 'Mancante/i',
  'rightmiddleimpactguard-to-be-refixed': 'Da rifissare',
  'rightmiddleimpactguard-missing-anchor-bolt': 'Tassello/i mancante/i o tranciato/i',
  'rightmiddleimpactguard-other': 'Altro (vedi note)',
  // guardrail
  'guardrail-damaged': 'Danneggiato/i',
  'guardrail-missing': 'Mancante/i',
  'guardrail-to-be-refixed': 'Da rifissare',
  'guardrail-missing-anchor-bolt': 'Tassello/i mancante/i o tranciato/i',
  'guardrail-missing-central-beam': 'Manca trave centrale',
  'guardrail-other': 'Altro (vedi note)',
  // pallet support bar
  'palletsupportbar-damaged': 'Danneggiato/i',
  'palletsupportbar-missing': 'Mancante/i',
  'palletsupportbar-to-be-refixed': 'Da rifissare',
  'palletsupportbar-to-be-repositioned': 'Da riposizionare',
  'palletsupportbar-other': 'Altro (vedi note)',
  // rear pallet stop beam
  'rearpalletstopbeam-damaged': 'Danneggiato/i',
  'rearpalletstopbeam-missing': 'Mancante/i',
  'rearpalletstopbeam-detached': 'Sganciato/i o parz. sganciato/i',
  'rearpalletstopbeam-other': 'Altro (vedi note)',
  // beam impact guard
  'beamimpactguard-damaged': 'Danneggiato/i',
  'beamimpactguard-missing': 'Mancante/i',
  'beamimpactguard-detached': 'Sganciato/i o parz. sganciato/i',
  'beamimpactguard-other': 'Altro (vedi note)',
  // underpass protection
  'underpassprotection-missing': 'Mancante/i',
  'underpassprotection-other': 'Altro (vedi note)',
  // rear safety mesh
  'rearsafetymesh-damaged': 'Danneggiato/i',
  'rearsafetymesh-missing': 'Mancante/i',
  'rearsafetymesh-detached': 'Sganciato/i o parz. sganciato/i',
  'rearsafetymesh-insufficient-coverage': "Non copre 2/3 dell'ultimo pallet",
  'rearsafetymesh-other': 'Altro (vedi note)',
  // decking panels
  'deckingpanels-damaged': 'Danneggiato/i',
  'deckingpanels-missing': 'Mancante/i',
  'deckingpanels-other': 'Altro (vedi note)',
  // pallet
  'pallet-damaged': 'Danneggiato/i',
  'pallet-to-be-repositioned': 'Da riposizionare',
  'pallet-improperly-supported': 'Appoggiato male (2 rompitratta)',
  'pallet-800x800': 'Formato 800x800',
  'pallet-not-strapped': 'Non reggiato/i bene',
  'pallet-forked-wrong-side': 'Pallet inforcati 800 anziché 1200',
  'pallet-other': 'Altro (vedi note)',
  // pallet on ground
  'palletonground-inspection-difficult': 'Ispezione difficoltosa',
  'palletonground-other': 'Altro (vedi note)',
  // entire racking system
  'entirerackingsystem-dismantled': 'Verrà smontata a breve',
  'entirerackingsystem-not-inspectable': 'Non ispezionabile',
  'entirerackingsystem-missing-safety-lock': 'Antisgancio mancante/i (100%)',
  'entirerackingsystem-missing-anchor-bolt': 'Tassello/i mancante/i (100%)',
  'entirerackingsystem-h-frame': 'Struttura ad H',
  'entirerackingsystem-other': 'Altro (vedi note)',
  // neon
  'neon-missing': 'Mancante/i',
  'neon-off': 'Spento/non funzionante',
  'neon-damaged': 'Danneggiato/i',
  'neon-other': 'Altro (vedi note)',
  // shelf
  'shelf-damaged': 'Danneggiato/i',
  'shelf-missing': 'Mancante/i',
  // aisle / closed location / level NC
  'aisle-obstructed': 'Chiuso/ostruito/non accessibile',
  'aisle-other': 'Altro (vedi note)',
  'closedlocation-damaged': 'Danneggiato/i',
  'closedlocation-other': 'Altro (vedi note)',
  'levelnc-cannot-load': 'Non caricabile',
  'levelnc-do-not-load-sign': 'Caricato con cartello "non caricare"',
  'levelnc-other': 'Altro (vedi note)',
  // bay
  'bay-obstructed': 'Chiuso/non accessibile',
  'bay-other': 'Altro (vedi note)',
  'bay-h-frame': 'Struttura ad H',
  'bay-missing-safety-lock': 'Antisgancio mancante/i (100%)',
  'bay-missing-anchor-bolt': 'Tassello/i mancante/i (100%)',
  // load sign
  'loadsign-missing': 'Mancante/i',
  'loadsign-to-be-corrected': 'Da correggere',
  'loadsign-obsolete': 'Obsoleta',
  'loadsign-to-be-repositioned': 'Da riposizionare',
  'loadsign-to-be-refixed': 'Da rifissare',
  'loadsign-other': 'Altro (vedi note)',
  // base plate
  'baseplate-missing': 'Mancante/i',
  'baseplate-damaged': 'Danneggiato/i',
  'baseplate-not-fixed': 'Non fissata a terra',
  'baseplate-corrosion': 'Corroso/presenza di ruggine',
  'baseplate-wrong-type': 'Tipo errato',
  'baseplate-shim-missing': 'Spessore mancante/errato',
  // top tie beam
  'toptie-missing': 'Mancante/i',
  'toptie-damaged': 'Danneggiato/i',
  'toptie-loose': 'Sganciato/i o parz. sganciato/i',
  'toptie-corrosion': 'Corroso/presenza di ruggine',
  'toptie-wrong-type': 'Tipo errato',
  // footplate
  'footplate-missing': 'Mancante/i',
  'footplate-damaged': 'Danneggiato/i',
  'footplate-not-fixed': 'Non fissata a terra',
  'footplate-corrosion': 'Corroso/presenza di ruggine',
};

/**
 * Get Italian element name for export.
 */
function getItalianElementName(elementType) {
  if (!elementType) return '';
  const resolved = resolveElementType(elementType);
  return ELEMENT_ITALIAN_NAMES[resolved] || resolved;
}

/**
 * Get Italian NC type name for export.
 */
function getItalianNCName(ncTypeId) {
  if (!ncTypeId) return '';
  return NC_ITALIAN_NAMES[ncTypeId] || ncTypeId;
}

/**
 * Extract level/index info from an elementId string.
 */
function extractLevel(elementId, isFrameNC) {
  if (!elementId) return '';
  const levelMatch = elementId.match(/level[- _]?(\d+)/i);
  if (levelMatch) return levelMatch[1];
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
    if (bay) return bay.name || `${(bay.index ?? 0) + 1}`;
    return '';
  }
  if (nc.frameId) {
    const frame = rack.frames?.find((f) => f.id === nc.frameId);
    if (frame) return frame.name || `${(frame.index ?? 0) + 1}`;
    return '';
  }
  return '';
}

/**
 * Get Description column: element characteristics from beam/frame data.
 * Per Allegato B spiegato ENG: populated for all NCs of damaged/missing elements.
 */
function getDescription(nc, rack) {
  if (!rack) return nc.notes || '';
  const resolved = resolveElementType(nc.elementType);

  if (resolved === 'beam' && nc.bayId) {
    const bay = rack.bays?.find((b) => b.id === nc.bayId);
    const levelMatch = nc.elementId?.match(/level[- _]?(\d+)/i);
    if (bay && levelMatch) {
      const levelIdx = parseInt(levelMatch[1], 10);
      const lb = bay.levelBeams?.[levelIdx];
      if (lb?.beamName) return lb.beamName;
    }
    if (rack.beamType) return rack.beamType;
  }

  if (nc.frameId) {
    const frame = rack.frames?.find((f) => f.id === nc.frameId);
    if (frame?.name || frame?.model) return frame.name || frame.model;
    if (rack.frameType) return rack.frameType;
  }

  return nc.notes || '';
}

/**
 * Get photo filenames separated by ;
 */
function getPhotoList(nc) {
  const photos = [];
  if (Array.isArray(nc.photos) && nc.photos.length > 0) {
    nc.photos.forEach((p, i) => {
      if (typeof p === 'string' && p.startsWith('data:')) {
        photos.push(`Foto ${i + 1}`);
      } else if (typeof p === 'string') {
        photos.push(p);
      } else if (p?.name) {
        photos.push(p.name);
      } else {
        photos.push(`Foto ${i + 1}`);
      }
    });
  } else if (nc.photo) {
    if (typeof nc.photo === 'string' && nc.photo.startsWith('data:')) {
      photos.push('Foto 1');
    } else {
      photos.push(nc.photo);
    }
  }
  return photos.join('; ');
}

/**
 * Format severity as v/g/r (verde/giallo/rosso) per Allegato B.
 */
function formatDamage(severity) {
  if (!severity) return '';
  const map = { green: 'v', yellow: 'g', red: 'r' };
  return map[severity.toLowerCase()] || severity;
}

/**
 * Build export rows matching Allegato B column structure exactly.
 */
export function buildExportRows({ inspection, areas, racks, nonConformities }) {
  const rackMap = {};
  racks.forEach((r) => { rackMap[r.id] = r; });

  const areaMap = {};
  if (Array.isArray(areas)) {
    areas.forEach((a) => { areaMap[a.id] = a; });
  }

  const areaIds = new Set(areas.map((a) => a.id));
  const relevantRackIds = new Set(
    racks.filter((r) => areaIds.has(r.areaId)).map((r) => r.id)
  );

  const filteredNCs = nonConformities.filter(
    (nc) => nc.rackId && relevantRackIds.has(nc.rackId)
  );

  const rows = filteredNCs.map((nc) => {
    const rack = rackMap[nc.rackId];
    const area = rack ? areaMap[rack.areaId] : null;
    const isFrameNC = !!nc.frameId && !nc.bayId;

    return {
      Warehouse: area?.name || inspection?.siteAddress || '',
      Supplier: rack?.supplierName || rack?.manufacturer || '',
      'Rack Name': rack?.name || '',
      'Rif.': getReference(nc, rack),
      'Liv.': extractLevel(nc.elementId, isFrameNC),
      'Pos.': nc.face ? nc.face.toUpperCase() : '',
      'Q.tà': nc.quantity || 1,
      'Damaged item': getItalianElementName(nc.elementType),
      'Photo NC.': getPhotoList(nc),
      Description: getDescription(nc, rack),
      Anomaly: getItalianNCName(nc.ncTypeId),
      'Lv. Damage': formatDamage(nc.severity),
      Note: nc.notes || '',
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
 * Column order per Allegato B.
 */
const HEADERS = [
  'Warehouse',
  'Supplier',
  'Rack Name',
  'Rif.',
  'Liv.',
  'Pos.',
  'Q.tà',
  'Damaged item',
  'Photo NC.',
  'Description',
  'Anomaly',
  'Lv. Damage',
  'Note',
];

export function rowsToCSV(rows) {
  if (!rows || rows.length === 0) return '';
  const lines = [HEADERS.map(escapeCSVField).join(',')];
  rows.forEach((row) => {
    const line = HEADERS.map((h) => escapeCSVField(row[h])).join(',');
    lines.push(line);
  });
  return lines.join('\r\n');
}

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

const COL_WIDTHS = [
  { wch: 18 },  // Warehouse
  { wch: 18 },  // Supplier
  { wch: 14 },  // Rack Name
  { wch: 8 },   // Rif.
  { wch: 6 },   // Liv.
  { wch: 8 },   // Pos.
  { wch: 6 },   // Q.tà
  { wch: 22 },  // Damaged item
  { wch: 12 },  // Photo NC.
  { wch: 40 },  // Description
  { wch: 38 },  // Anomaly
  { wch: 10 },  // Lv. Damage
  { wch: 30 },  // Note
];

function buildXLSXBuffer(rows) {
  const ws = XLSX.utils.json_to_sheet(rows, { header: HEADERS });
  ws['!cols'] = COL_WIDTHS;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Elenco Anomalie');
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

export function downloadXLSX(rows, filename) {
  const buf = buildXLSXBuffer(rows);
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, filename);
}

function dataUriToUint8Array(dataUri) {
  const base64 = dataUri.split(',')[1];
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

function getExtensionFromDataUri(dataUri) {
  const match = dataUri.match(/^data:image\/(\w+)/);
  if (match) {
    const type = match[1].toLowerCase();
    if (type === 'jpeg') return 'jpg';
    return type;
  }
  return 'jpg';
}

export async function downloadZIPBundle(rows, photos, filename) {
  const zip = new JSZip();
  const xlsxBuf = buildXLSXBuffer(rows);
  zip.file('ispezione.xlsx', xlsxBuf);
  const photosFolder = zip.folder('foto');
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
