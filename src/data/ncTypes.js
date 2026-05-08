export const SCOPE_CATEGORIES = {
  missing: { id: 'missing', label: 'Missing', color: '#ef4444' },
  to_be_corrected: { id: 'to_be_corrected', label: 'To be corrected', color: '#f59e0b' },
  to_be_repositioned: { id: 'to_be_repositioned', label: 'To be repositioned', color: '#3b82f6' },
  other: { id: 'other', label: 'Other', color: '#6b7280' },
};

function scope(name) {
  const n = name.toLowerCase();
  if (n.includes('missing')) return 'missing';
  if (
    n.includes('damaged') ||
    n.includes('corroded') ||
    n.includes('corrosion') ||
    n.includes('twisted') ||
    n.includes('verticality') ||
    n.includes('detached') ||
    n.includes('overloaded') ||
    n.includes('wrong section') ||
    n.includes('wrong type') ||
    n.includes('to be refixed') ||
    n.includes('not fixed') ||
    n.includes('illegible') ||
    n.includes('loose') ||
    n.includes('off/not') ||
    n.includes('different sections') ||
    n.includes('cannot be loaded') ||
    n.includes('loaded with')
  )
    return 'to_be_corrected';
  if (
    n.includes('to be repositioned') ||
    n.includes('improperly supported') ||
    n.includes('forked wrong side') ||
    n.includes('not properly strapped') ||
    n.includes('wrong position')
  )
    return 'to_be_repositioned';
  return 'other';
}

function withScope(entries) {
  return entries.map((e) => ({ ...e, scopeCategory: scope(e.name) }));
}

const ncTypes = {
  beam: withScope([
    { id: 'beam-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'beam-overloaded', name: 'Overloaded', severities: ['yellow', 'red'] },
    { id: 'beam-missing-safety-lock', name: 'Missing safety lock', severities: ['yellow', 'red'] },
    { id: 'beam-missing', name: 'Missing', severities: ['red'] },
    { id: 'beam-wrong-section', name: 'Wrong section (smaller)', severities: ['yellow', 'red'] },
    { id: 'beam-different-sections', name: 'Different sections front/rear', severities: ['yellow', 'red'] },
    { id: 'beam-corrosion', name: 'Corroded/presence of rust', severities: ['green', 'yellow', 'red'] },
    { id: 'beam-detached', name: 'Detached or partially detached', severities: ['yellow', 'red'] },
    { id: 'beam-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ]),

  upright: withScope([
    { id: 'upright-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'upright-missing-anchor-bolt', name: 'Missing or sheared anchor bolt', severities: ['yellow', 'red'] },
    { id: 'upright-corrosion', name: 'Corroded/presence of rust', severities: ['green', 'yellow', 'red'] },
    { id: 'upright-damaged-foot-plate', name: 'Damaged foot plate', severities: ['green', 'yellow', 'red'] },
    { id: 'upright-twisted', name: 'Twisted', severities: ['green', 'yellow', 'red'] },
    { id: 'upright-verticality', name: 'Verticality out of tolerance', severities: ['green', 'yellow', 'red'] },
    { id: 'upright-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ]),

  frame: withScope([
    { id: 'frame-verticality', name: 'Verticality out of tolerance', severities: ['green', 'yellow', 'red'] },
    { id: 'frame-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ]),

  brace: withScope([
    { id: 'brace-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'brace-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ]),

  horizontalBracing: withScope([
    { id: 'horizontalbracing-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'horizontalbracing-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ]),

  verticalBracing: withScope([
    { id: 'verticalbracing-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'verticalbracing-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ]),

  frontImpactGuard: withScope([
    { id: 'frontimpactguard-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'frontimpactguard-missing', name: 'Missing', severities: ['yellow', 'red'] },
    { id: 'frontimpactguard-missing-anchor-bolt', name: 'Missing or sheared anchor bolt', severities: ['yellow', 'red'] },
    { id: 'frontimpactguard-to-be-refixed', name: 'To be refixed', severities: ['yellow', 'red'] },
    { id: 'frontimpactguard-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ]),

  cornerImpactGuard: withScope([
    { id: 'cornerimpactguard-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'cornerimpactguard-missing', name: 'Missing', severities: ['yellow', 'red'] },
    { id: 'cornerimpactguard-missing-anchor-bolt', name: 'Missing or sheared anchor bolt', severities: ['yellow', 'red'] },
    { id: 'cornerimpactguard-to-be-refixed', name: 'To be refixed', severities: ['yellow', 'red'] },
    { id: 'cornerimpactguard-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ]),

  leftMiddleImpactGuard: withScope([
    { id: 'leftmiddleimpactguard-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'leftmiddleimpactguard-missing', name: 'Missing', severities: ['yellow', 'red'] },
    { id: 'leftmiddleimpactguard-to-be-refixed', name: 'To be refixed', severities: ['yellow', 'red'] },
    { id: 'leftmiddleimpactguard-missing-anchor-bolt', name: 'Missing or sheared anchor bolt', severities: ['yellow', 'red'] },
    { id: 'leftmiddleimpactguard-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ]),

  rightMiddleImpactGuard: withScope([
    { id: 'rightmiddleimpactguard-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'rightmiddleimpactguard-missing', name: 'Missing', severities: ['yellow', 'red'] },
    { id: 'rightmiddleimpactguard-to-be-refixed', name: 'To be refixed', severities: ['yellow', 'red'] },
    { id: 'rightmiddleimpactguard-missing-anchor-bolt', name: 'Missing or sheared anchor bolt', severities: ['yellow', 'red'] },
    { id: 'rightmiddleimpactguard-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ]),

  guardrail: withScope([
    { id: 'guardrail-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'guardrail-missing', name: 'Missing', severities: ['yellow', 'red'] },
    { id: 'guardrail-to-be-refixed', name: 'To be refixed', severities: ['yellow', 'red'] },
    { id: 'guardrail-missing-anchor-bolt', name: 'Missing or sheared anchor bolt', severities: ['yellow', 'red'] },
    { id: 'guardrail-missing-central-beam', name: 'Missing central beam', severities: ['yellow', 'red'] },
    { id: 'guardrail-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ]),

  palletSupportBar: withScope([
    { id: 'palletsupportbar-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'palletsupportbar-missing', name: 'Missing', severities: ['yellow', 'red'] },
    { id: 'palletsupportbar-to-be-refixed', name: 'To be refixed', severities: ['yellow', 'red'] },
    { id: 'palletsupportbar-to-be-repositioned', name: 'To be repositioned', severities: ['yellow', 'red'] },
    { id: 'palletsupportbar-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ]),

  rearPalletStopBeam: withScope([
    { id: 'rearpalletstopbeam-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'rearpalletstopbeam-missing', name: 'Missing', severities: ['yellow', 'red'] },
    { id: 'rearpalletstopbeam-detached', name: 'Detached or partially detached', severities: ['yellow', 'red'] },
    { id: 'rearpalletstopbeam-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ]),

  beamImpactGuard: withScope([
    { id: 'beamimpactguard-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'beamimpactguard-missing', name: 'Missing', severities: ['yellow', 'red'] },
    { id: 'beamimpactguard-detached', name: 'Detached or partially detached', severities: ['yellow', 'red'] },
    { id: 'beamimpactguard-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ]),

  underpassProtection: withScope([
    { id: 'underpassprotection-missing', name: 'Missing', severities: ['yellow', 'red'] },
    { id: 'underpassprotection-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ]),

  rearSafetyMesh: withScope([
    { id: 'rearsafetymesh-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'rearsafetymesh-missing', name: 'Missing', severities: ['yellow', 'red'] },
    { id: 'rearsafetymesh-detached', name: 'Detached or partially detached', severities: ['yellow', 'red'] },
    { id: 'rearsafetymesh-insufficient-coverage', name: 'Does not cover 2/3 of last pallet', severities: ['yellow', 'red'] },
    { id: 'rearsafetymesh-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ]),

  deckingPanels: withScope([
    { id: 'deckingpanels-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'deckingpanels-missing', name: 'Missing', severities: ['yellow', 'red'] },
    { id: 'deckingpanels-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ]),

  pallet: withScope([
    { id: 'pallet-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'pallet-to-be-repositioned', name: 'To be repositioned', severities: ['yellow', 'red'] },
    { id: 'pallet-improperly-supported', name: 'Improperly supported', severities: ['yellow', 'red'] },
    { id: 'pallet-800x800', name: '800x800 format', severities: ['yellow'] },
    { id: 'pallet-not-strapped', name: 'Not properly strapped', severities: ['yellow', 'red'] },
    { id: 'pallet-forked-wrong-side', name: 'Forked wrong side', severities: ['yellow', 'red'] },
    { id: 'pallet-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ]),

  palletOnGround: withScope([
    { id: 'palletonground-inspection-difficult', name: 'Inspection difficult', severities: ['yellow'] },
    { id: 'palletonground-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ]),

  entireRackingSystem: withScope([
    { id: 'entirerackingsystem-dismantled', name: 'Will be dismantled shortly', severities: ['yellow'] },
    { id: 'entirerackingsystem-not-inspectable', name: 'Not inspectable', severities: ['yellow'] },
    { id: 'entirerackingsystem-missing-safety-lock', name: '100% missing safety lock', severities: ['red'] },
    { id: 'entirerackingsystem-missing-anchor-bolt', name: '100% missing anchor bolt', severities: ['red'] },
    { id: 'entirerackingsystem-h-frame', name: 'H-frame structure', severities: ['yellow'] },
    { id: 'entirerackingsystem-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ]),

  neon: withScope([
    { id: 'neon-missing', name: 'Missing', severities: ['yellow', 'red'] },
    { id: 'neon-off', name: 'Off/not working', severities: ['yellow'] },
    { id: 'neon-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'neon-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ]),

  shelf: withScope([
    { id: 'shelf-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'shelf-missing', name: 'Missing', severities: ['yellow', 'red'] },
  ]),

  bay: withScope([
    { id: 'bay-obstructed', name: 'Obstructed/not accessible', severities: ['yellow'] },
    { id: 'bay-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
    { id: 'bay-h-frame', name: 'H-frame structure', severities: ['yellow'] },
    { id: 'bay-missing-safety-lock', name: '100% missing safety lock', severities: ['red'] },
    { id: 'bay-missing-anchor-bolt', name: '100% missing anchor bolt', severities: ['red'] },
  ]),

  aisle: withScope([
    { id: 'aisle-obstructed', name: 'Closed/obstructed/not accessible', severities: ['yellow'] },
    { id: 'aisle-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ]),

  closedLocation: withScope([
    { id: 'closedlocation-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'closedlocation-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ]),

  levelNC: withScope([
    { id: 'levelnc-cannot-load', name: 'Cannot be loaded', severities: ['yellow', 'red'] },
    { id: 'levelnc-do-not-load-sign', name: 'Loaded with "do not load" sign', severities: ['yellow'] },
    { id: 'levelnc-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ]),

  basePlate: withScope([
    { id: 'baseplate-missing', name: 'Missing', severities: ['red'], description: 'Base plate is missing from the upright foot.' },
    { id: 'baseplate-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'], description: 'Base plate is bent, cracked, or otherwise damaged.' },
    { id: 'baseplate-not-fixed', name: 'Not Fixed to Floor', severities: ['yellow', 'red'], description: 'Base plate is not bolted or anchored to the floor.' },
    { id: 'baseplate-corrosion', name: 'Corrosion', severities: ['green', 'yellow', 'red'], description: 'Corrosion on the base plate or anchor bolt area.' },
    { id: 'baseplate-wrong-type', name: 'Wrong Type', severities: ['yellow', 'red'], description: 'Base plate does not match the specified system or upright.' },
    { id: 'baseplate-shim-missing', name: 'Shim Missing / Incorrect', severities: ['green', 'yellow'], description: 'Levelling shim is missing or incorrectly positioned.' },
  ]),

  loadSign: withScope([
    { id: 'loadsign-missing', name: 'Missing', severities: ['yellow', 'red'] },
    { id: 'loadsign-to-be-corrected', name: 'To be corrected', severities: ['yellow', 'red'] },
    { id: 'loadsign-obsolete', name: 'Obsolete', severities: ['yellow'] },
    { id: 'loadsign-to-be-repositioned', name: 'To be repositioned', severities: ['yellow'] },
    { id: 'loadsign-to-be-refixed', name: 'To be refixed', severities: ['yellow', 'red'] },
    { id: 'loadsign-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ]),

  topTieBeam: withScope([
    { id: 'toptie-missing', name: 'Missing', severities: ['yellow', 'red'], description: 'Top tie beam is missing where required by design.' },
    { id: 'toptie-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'], description: 'Top tie beam has visible damage.' },
    { id: 'toptie-loose', name: 'Loose / Detached', severities: ['yellow', 'red'], description: 'Top tie beam is loose or partially detached.' },
    { id: 'toptie-corrosion', name: 'Corrosion', severities: ['green', 'yellow', 'red'], description: 'Corrosion affecting the top tie beam.' },
    { id: 'toptie-wrong-type', name: 'Wrong Type', severities: ['yellow', 'red'], description: 'Top tie beam type does not match the specification.' },
  ]),

  footplate: withScope([
    { id: 'footplate-missing', name: 'Missing', severities: ['red'], description: 'Footplate is missing from the upright base.' },
    { id: 'footplate-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'], description: 'Footplate is bent, cracked, or otherwise damaged.' },
    { id: 'footplate-not-fixed', name: 'Not Fixed to Floor', severities: ['yellow', 'red'], description: 'Footplate is not bolted or anchored to the floor.' },
    { id: 'footplate-corrosion', name: 'Corrosion', severities: ['green', 'yellow', 'red'], description: 'Corrosion on the footplate or its anchor bolt area.' },
  ]),
};

export const NC_ID_MIGRATION = {
  'beam-bent': 'beam-damaged',
  'beam-missing-connector': 'beam-missing-safety-lock',
  'beam-unhooked': 'beam-detached',
  'beam-weld-failure': 'beam-damaged',
  'beam-wrong-type': 'beam-wrong-section',
  'beam-deflection': 'beam-damaged',
  'upright-bent': 'upright-damaged',
  'upright-out-of-plumb': 'upright-verticality',
  'upright-perforations': 'upright-damaged',
  'upright-splice': 'upright-damaged',
  'upright-corrosion': 'upright-corrosion',
  'frame-out-of-plumb': 'frame-verticality',
  'frame-damaged': 'frame-other',
  'frame-overloaded': 'frame-other',
  'frame-wrong-type': 'frame-other',
  'frame-missing': 'frame-other',
  'frame-corrosion': 'frame-other',
  'brace-bent': 'brace-damaged',
  'brace-missing': 'brace-damaged',
  'brace-loose': 'brace-damaged',
  'brace-corrosion': 'brace-damaged',
  'brace-weld-failure': 'brace-damaged',
  'guardrail-wrong-height': 'guardrail-other',
  'guardrail-not-fixed': 'guardrail-to-be-refixed',
  'guardrail-corrosion': 'guardrail-other',
  'frontguard-missing': 'frontimpactguard-missing',
  'frontguard-damaged': 'frontimpactguard-damaged',
  'frontguard-wrong-height': 'frontimpactguard-other',
  'frontguard-not-fixed': 'frontimpactguard-to-be-refixed',
  'frontguard-corrosion': 'frontimpactguard-other',
  'cornerguard-missing': 'cornerimpactguard-missing',
  'cornerguard-damaged': 'cornerimpactguard-damaged',
  'cornerguard-wrong-height': 'cornerimpactguard-other',
  'cornerguard-not-fixed': 'cornerimpactguard-to-be-refixed',
  'cornerguard-corrosion': 'cornerimpactguard-other',
  // loadSign migration: old IDs → new Allegato B aligned IDs
  'loadsign-damaged': 'loadsign-to-be-corrected',
  'loadsign-illegible': 'loadsign-to-be-corrected',
  'loadsign-wrong-position': 'loadsign-to-be-repositioned',
};

export const ELEMENT_TYPE_MIGRATION = {
  'frontGuard': 'frontImpactGuard',
  'cornerGuard': 'cornerImpactGuard',
};

export default ncTypes;
