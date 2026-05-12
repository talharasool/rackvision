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
  frontImpactGuard: 'Paracolpo_frontale',
  cornerImpactGuard: 'Paracolpo_angolo',
  leftMiddleImpactGuard: 'Paracolpo_mezzo_sx',
  rightMiddleImpactGuard: 'Paracolpo_mezzo_dx',
  guardrail: 'Guard_rail',
  palletSupportBar: 'Rompitratta',
  rearPalletStopBeam: 'Trave_batt_post',
  beamImpactGuard: 'Trave_paracolpo',
  underpassProtection: 'Prot_sottopasso',
  rearSafetyMesh: 'Rete_post',
  deckingPanels: 'Pianetti',
  pallet: 'Pallet',
  palletOnGround: 'Pallet_a_terra',
  entireRackingSystem: 'Intera_scaffalatura',
  neon: 'Neon',
  shelf: 'Mensola',
  aisle: 'Corridoio',
  closedLocation: 'Locazione_chiusa',
  levelNC: 'Livello',
  bay: 'Campata',
  basePlate: 'Basetta',
  loadSign: 'Tabella di portata',
  topTieBeam: 'Trave di sommità',
  footplate: 'Piedino',
  endFrame: 'Spalla_di_testata',
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
  'beam-corrosion': 'Corroso / presenza di ruggine',
  'beam-detached': 'Sganciato/i o parz. Sganciato/i',
  'beam-other': 'Altro (vedi note)',
  // upright
  'upright-damaged': 'Danneggiato/i',
  'upright-missing-anchor-bolt': 'Tassello/i mancante/i o tranciato/i',
  'upright-corrosion': 'Corroso / presenza di ruggine',
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
  'rearpalletstopbeam-detached': 'Sganciato/i o parz. Sganciato/i',
  'rearpalletstopbeam-other': 'Altro (vedi note)',
  // beam impact guard
  'beamimpactguard-damaged': 'Danneggiato/i',
  'beamimpactguard-missing': 'Mancante/i',
  'beamimpactguard-detached': 'Sganciato/i o parz. Sganciato/i',
  'beamimpactguard-other': 'Altro (vedi note)',
  // underpass protection
  'underpassprotection-missing': 'Mancante/i',
  'underpassprotection-other': 'Altro (vedi note)',
  // rear safety mesh
  'rearsafetymesh-damaged': 'Danneggiato/i',
  'rearsafetymesh-missing': 'Mancante/i',
  'rearsafetymesh-detached': 'Sganciato/i o parz. Sganciato/i',
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
  'pallet-800x800': 'formato 800x800',
  'pallet-not-strapped': 'Non reggiato/i bene',
  'pallet-forked-wrong-side': 'Pallet inforcati 800 anziché 1200',
  'pallet-other': 'Altro (vedi note)',
  // pallet on ground
  'palletonground-inspection-difficult': 'Ispezione difficoltosa',
  'palletonground-other': 'Altro (vedi note)',
  // entire racking system
  'entirerackingsystem-dismantled': 'Verrà smontata a breve',
  'entirerackingsystem-not-inspectable': 'Non Ispezionabile',
  'entirerackingsystem-missing-safety-lock': 'Antisgancio mancante/i (100%)',
  'entirerackingsystem-missing-anchor-bolt': 'Tassello/i mancante/i (100%)',
  'entirerackingsystem-h-frame': 'Struttura ad H',
  'entirerackingsystem-other': 'Altro (vedi note)',
  // neon
  'neon-missing': 'Mancante/i',
  'neon-off': 'Spento / non funzionante',
  'neon-damaged': 'Danneggiato/i',
  'neon-other': 'Altro (vedi note)',
  // shelf
  'shelf-damaged': 'Danneggiato/i',
  'shelf-missing': 'Mancante/i',
  // aisle / closed location / level NC
  'aisle-obstructed': 'Chiuso / ostruito / non accessibile',
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
  'baseplate-corrosion': 'Corroso / presenza di ruggine',
  'baseplate-wrong-type': 'Tipo errato',
  'baseplate-shim-missing': 'Spessore mancante/errato',
  // top tie beam
  'toptie-missing': 'Mancante/i',
  'toptie-damaged': 'Danneggiato/i',
  'toptie-loose': 'Sganciato/i o parz. Sganciato/i',
  'toptie-corrosion': 'Corroso / presenza di ruggine',
  'toptie-wrong-type': 'Tipo errato',
  // footplate
  'footplate-missing': 'Mancante/i',
  'footplate-damaged': 'Danneggiato/i',
  'footplate-not-fixed': 'Non fissata a terra',
  'footplate-corrosion': 'Corroso / presenza di ruggine',
  // end frame
  'endframe-verticality': 'Verticalità fuori tolleranza',
  'endframe-too-low': 'Troppo bassa - Manca protezione laterale',
  'endframe-other': 'Altro (vedi note)',
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
 * Format face value: front→ant, rear→post per Allegato B.
 */
function formatFace(face) {
  if (!face) return '';
  return { front: 'ant', rear: 'post' }[face.toLowerCase()] || face;
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
      'Pos.': formatFace(nc.face),
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
 * Column mapping: Italian header labels → internal row keys.
 */
const COLUMN_MAP = [
  { ita: 'Lotto', key: 'Warehouse' },
  { ita: 'Forn.', key: 'Supplier' },
  { ita: 'Scaff.', key: 'Rack Name' },
  { ita: 'Rif.', key: 'Rif.' },
  { ita: 'Liv.', key: 'Liv.' },
  { ita: 'Pos.', key: 'Pos.' },
  { ita: 'Q.tà', key: 'Q.tà' },
  { ita: 'elemento danneggiato', key: 'Damaged item' },
  { ita: 'Foto NC.', key: 'Photo NC.' },
  { ita: 'descr.', key: 'Description' },
  { ita: 'anomalia', key: 'Anomaly' },
  { ita: 'danno', key: 'Lv. Damage' },
  { ita: 'Note', key: 'Note' },
];

export function rowsToCSV(rows) {
  if (!rows || rows.length === 0) return '';
  const lines = [COLUMN_MAP.map((c) => escapeCSVField(c.ita)).join(',')];
  rows.forEach((row) => {
    const line = COLUMN_MAP.map((c) => escapeCSVField(row[c.key])).join(',');
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

/**
 * Inject fonts, fills, and cellXfs into styles.xml for direct cell styling.
 * Returns { stylesXml, baseIndex } where baseIndex is the first new xf index.
 *
 * Style indices (relative to baseIndex):
 *   +0 = bold (title row)
 *   +1 = yellow fill (date row)
 *   +2 = gray fill + bold (header row)
 *   +3 = green fill (v — verde)
 *   +4 = yellow fill (g — giallo)
 *   +5 = red fill (r — rosso)
 */
function injectAllStyles(stylesXml) {
  // 1. Add bold font
  stylesXml = stylesXml.replace(
    /<\/fonts>/,
    '<font><b/><sz val="12"/><name val="Calibri"/></font></fonts>'
  );
  stylesXml = stylesXml.replace(
    /<fonts count="(\d+)">/,
    (_, c) => `<fonts count="${parseInt(c) + 1}">`
  );

  // 2. Add fills: yellow(2), gray(3), green(4), red(5)
  const fills =
    '<fill><patternFill patternType="solid"><fgColor rgb="FFFFFF00"/><bgColor indexed="64"/></patternFill></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFD9D9D9"/><bgColor indexed="64"/></patternFill></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FF00FF00"/><bgColor indexed="64"/></patternFill></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFFF0000"/><bgColor indexed="64"/></patternFill></fill>';
  stylesXml = stylesXml.replace(/<\/fills>/, fills + '</fills>');
  stylesXml = stylesXml.replace(
    /<fills count="(\d+)">/,
    (_, c) => `<fills count="${parseInt(c) + 4}">`
  );

  // 3. Add cellXfs entries
  const baseIndex = parseInt((stylesXml.match(/<cellXfs count="(\d+)">/) || ['', '1'])[1]);
  const boldFont = 1;
  const xfs =
    `<xf numFmtId="0" fontId="${boldFont}" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
    `<xf numFmtId="0" fontId="0" fillId="2" borderId="0" xfId="0" applyFill="1"/>` +
    `<xf numFmtId="0" fontId="${boldFont}" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"/>` +
    `<xf numFmtId="0" fontId="0" fillId="4" borderId="0" xfId="0" applyFill="1"/>` +
    `<xf numFmtId="0" fontId="0" fillId="2" borderId="0" xfId="0" applyFill="1"/>` +
    `<xf numFmtId="0" fontId="0" fillId="5" borderId="0" xfId="0" applyFill="1"/>`;
  stylesXml = stylesXml.replace(/<\/cellXfs>/, xfs + '</cellXfs>');
  stylesXml = stylesXml.replace(
    /<cellXfs count="(\d+)">/,
    (_, c) => `<cellXfs count="${parseInt(c) + 6}">`
  );

  return { stylesXml, baseIndex };
}

/**
 * Apply direct cell styles to sheet XML:
 *   - Row 1 (title): bold
 *   - Row 2 (date/client): yellow fill
 *   - Row 3 (headers): gray + bold
 *   - Column L rows 4+: green/yellow/red fill (cell value cleared — color IS the data)
 */
function applySheetStyles(sheetXml, rows, baseIndex) {
  const S_BOLD = baseIndex;
  const S_YELLOW = baseIndex + 1;
  const S_GRAY_BOLD = baseIndex + 2;
  const S_GREEN = baseIndex + 3;
  const S_YELLOW_DMG = baseIndex + 4;
  const S_RED = baseIndex + 5;

  // Helper: set style on a cell, handling existing s="" attribute
  function setStyle(xml, cellRef, styleId) {
    return xml.replace(
      new RegExp(`(<c r="${cellRef}")([^>]*)`),
      (_, prefix, rest) => {
        rest = rest.replace(/ s="\d+"/, '');
        return `${prefix} s="${styleId}"${rest}`;
      }
    );
  }

  // Row 1: bold title
  sheetXml = setStyle(sheetXml, 'A1', S_BOLD);

  // Row 2: yellow fill on date/client cells
  ['A2', 'E2', 'J2'].forEach((ref) => {
    sheetXml = setStyle(sheetXml, ref, S_YELLOW);
  });

  // Row 3: gray + bold on all header cells
  'ABCDEFGHIJKLM'.split('').forEach((col) => {
    sheetXml = setStyle(sheetXml, `${col}3`, S_GRAY_BOLD);
  });

  // Column L data rows: replace with colored empty cell
  sheetXml = sheetXml.replace(
    /<c r="L(\d+)"[^>]*(?:>.*?<\/c>|\/>)/g,
    (match, rowNum) => {
      const row = parseInt(rowNum);
      if (row < 4) return match;
      const idx = row - 4;
      if (idx >= rows.length) return match;
      const dmg = rows[idx]['Lv. Damage'];
      if (dmg === 'v') return `<c r="L${row}" s="${S_GREEN}"/>`;
      if (dmg === 'g') return `<c r="L${row}" s="${S_YELLOW_DMG}"/>`;
      if (dmg === 'r') return `<c r="L${row}" s="${S_RED}"/>`;
      return match;
    }
  );

  return sheetXml;
}

/**
 * Build an XLSX buffer matching the Allegato B template exactly:
 *   Sheet 1 "Generale ITA": Italian headers
 *   Sheet 2 "Generale ENG": English headers
 *   Both sheets: Row 1 bold title, Row 2 yellow date row, Row 3 gray headers, Row 4+ data
 *   Column L (danno): colored cell fills (green/yellow/red) — no text
 */
async function buildXLSXBuffer(rows, inspection) {
  const wb = XLSX.utils.book_new();
  const COLS = 'ABCDEFGHIJKLM';

  const KEY_TO_COL = {
    'Warehouse':    'A',
    'Supplier':     'B',
    'Rack Name':    'C',
    'Rif.':         'D',
    'Liv.':         'E',
    'Pos.':         'F',
    'Q.tà':         'G',
    'Damaged item': 'H',
    'Photo NC.':    'I',
    'Description':  'J',
    'Anomaly':      'K',
    'Lv. Damage':   'L',
    'Note':         'M',
  };

  function buildSheet(titleText, row2DateLabel, row2ClientPrefix, headerRow) {
    const ws = {};
    // Row 1
    ws['A1'] = { v: titleText, t: 's' };
    // Row 2
    const today = new Date();
    const dateStr = today.toLocaleDateString('it-IT');
    const clientName = inspection?.endCustomer || inspection?.reseller || '';
    ws['A2'] = { v: row2DateLabel, t: 's' };
    ws['E2'] = { v: dateStr, t: 's' };
    ws['J2'] = { v: `${row2ClientPrefix} ${clientName}`, t: 's' };
    // Row 3 headers
    headerRow.forEach((h, i) => { ws[`${COLS[i]}3`] = { v: h, t: 's' }; });
    // Row 4+ data
    rows.forEach((row, idx) => {
      const r = idx + 4;
      Object.entries(KEY_TO_COL).forEach(([key, col]) => {
        const val = row[key];
        ws[`${col}${r}`] = { v: val ?? '', t: key === 'Q.tà' ? 'n' : 's' };
      });
    });
    const lastRow = Math.max(rows.length + 3, 4);
    ws['!ref'] = `A1:M${lastRow}`;
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },   // A1:I1
      { s: { r: 0, c: 9 }, e: { r: 0, c: 11 } },  // J1:L1
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },   // A2:D2
      { s: { r: 1, c: 4 }, e: { r: 1, c: 8 } },   // E2:I2
      { s: { r: 1, c: 9 }, e: { r: 1, c: 11 } },  // J2:L2
    ];
    ws['!cols'] = COL_WIDTHS;
    return ws;
  }

  const ITA_HEADERS = [
    'Lotto', 'Forn.', 'Scaff.', 'Rif.', 'Liv.', 'Pos.', 'Q.tà',
    'elemento danneggiato', 'Foto NC.', 'descr.', 'anomalia', 'danno', 'Note',
  ];
  const ENG_HEADERS = [
    'Warehouse', 'Supplier', 'Rack Name', 'Rif.', 'Liv.', 'Pos.', 'Q.tà',
    'damaged item', 'Photo NC.', 'description', 'anomaly', 'lv. damage', 'Note',
  ];

  const wsITA = buildSheet('ELENCO ANOMALIE', 'Data:', 'Cliente:', ITA_HEADERS);
  const wsENG = buildSheet('NON CONFORMITY LIST', 'DATE', 'Client:', ENG_HEADERS);

  XLSX.utils.book_append_sheet(wb, wsITA, 'Generale ITA');
  XLSX.utils.book_append_sheet(wb, wsENG, 'Generale ENG');

  // Write base xlsx
  const rawArray = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

  // Post-process via JSZip: inject styles + apply to cells
  const zip = await JSZip.loadAsync(rawArray);

  // Inject fonts, fills, cellXfs into styles.xml
  const rawStyles = await zip.file('xl/styles.xml').async('text');
  const { stylesXml, baseIndex } = injectAllStyles(rawStyles);
  zip.file('xl/styles.xml', stylesXml);

  // Apply cell styles to both sheets
  const sheet1Xml = await zip.file('xl/worksheets/sheet1.xml').async('text');
  zip.file('xl/worksheets/sheet1.xml', applySheetStyles(sheet1Xml, rows, baseIndex));

  const sheet2Xml = await zip.file('xl/worksheets/sheet2.xml').async('text');
  zip.file('xl/worksheets/sheet2.xml', applySheetStyles(sheet2Xml, rows, baseIndex));

  return zip.generateAsync({ type: 'uint8array' });
}

export async function downloadXLSX(rows, filename, inspection) {
  const buf = await buildXLSXBuffer(rows, inspection);
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

export async function downloadZIPBundle(rows, photos, filename, inspection) {
  const zip = new JSZip();
  const xlsxBuf = await buildXLSXBuffer(rows, inspection);
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
