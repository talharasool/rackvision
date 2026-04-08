const ncTypes = {
  beam: [
    { id: 'beam-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'beam-overloaded', name: 'Overloaded', severities: ['yellow', 'red'] },
    { id: 'beam-missing-safety-lock', name: 'Missing safety lock', severities: ['yellow', 'red'] },
    { id: 'beam-missing', name: 'Missing', severities: ['red'] },
    { id: 'beam-wrong-section', name: 'Wrong section (smaller)', severities: ['yellow', 'red'] },
    { id: 'beam-corrosion', name: 'Corroded/presence of rust', severities: ['green', 'yellow', 'red'] },
    { id: 'beam-detached', name: 'Detached or partially detached', severities: ['yellow', 'red'] },
  ],

  upright: [
    { id: 'upright-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'upright-missing-anchor-bolt', name: 'Missing or sheared anchor bolt', severities: ['yellow', 'red'] },
    { id: 'upright-corrosion', name: 'Corroded/presence of rust', severities: ['green', 'yellow', 'red'] },
    { id: 'upright-damaged-foot-plate', name: 'Damaged foot plate', severities: ['green', 'yellow', 'red'] },
    { id: 'upright-twisted', name: 'Twisted', severities: ['green', 'yellow', 'red'] },
    { id: 'upright-verticality', name: 'Verticality out of tolerance', severities: ['green', 'yellow', 'red'] },
  ],

  frame: [
    { id: 'frame-verticality', name: 'Verticality out of tolerance', severities: ['green', 'yellow', 'red'] },
    { id: 'frame-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ],

  brace: [
    { id: 'brace-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'brace-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ],

  horizontalBracing: [
    { id: 'horizontalbracing-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'horizontalbracing-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ],

  verticalBracing: [
    { id: 'verticalbracing-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'verticalbracing-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ],

  frontImpactGuard: [
    { id: 'frontimpactguard-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'frontimpactguard-missing', name: 'Missing', severities: ['yellow', 'red'] },
    { id: 'frontimpactguard-missing-anchor-bolt', name: 'Missing or sheared anchor bolt', severities: ['yellow', 'red'] },
    { id: 'frontimpactguard-to-be-refixed', name: 'To be refixed', severities: ['yellow', 'red'] },
    { id: 'frontimpactguard-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ],

  cornerImpactGuard: [
    { id: 'cornerimpactguard-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'cornerimpactguard-missing', name: 'Missing', severities: ['yellow', 'red'] },
    { id: 'cornerimpactguard-missing-anchor-bolt', name: 'Missing or sheared anchor bolt', severities: ['yellow', 'red'] },
    { id: 'cornerimpactguard-to-be-refixed', name: 'To be refixed', severities: ['yellow', 'red'] },
    { id: 'cornerimpactguard-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ],

  guardrail: [
    { id: 'guardrail-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'guardrail-missing', name: 'Missing', severities: ['yellow', 'red'] },
    { id: 'guardrail-to-be-refixed', name: 'To be refixed', severities: ['yellow', 'red'] },
    { id: 'guardrail-missing-anchor-bolt', name: 'Missing or sheared anchor bolt', severities: ['yellow', 'red'] },
    { id: 'guardrail-missing-central-beam', name: 'Missing central beam', severities: ['yellow', 'red'] },
    { id: 'guardrail-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ],

  palletSupportBar: [
    { id: 'palletsupportbar-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'palletsupportbar-missing', name: 'Missing', severities: ['yellow', 'red'] },
    { id: 'palletsupportbar-to-be-refixed', name: 'To be refixed', severities: ['yellow', 'red'] },
  ],

  rearPalletStopBeam: [
    { id: 'rearpalletstopbeam-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'rearpalletstopbeam-missing', name: 'Missing', severities: ['yellow', 'red'] },
    { id: 'rearpalletstopbeam-detached', name: 'Detached or partially detached', severities: ['yellow', 'red'] },
    { id: 'rearpalletstopbeam-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ],

  underpassProtection: [
    { id: 'underpassprotection-missing', name: 'Missing', severities: ['yellow', 'red'] },
    { id: 'underpassprotection-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ],

  rearSafetyMesh: [
    { id: 'rearsafetymesh-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'rearsafetymesh-missing', name: 'Missing', severities: ['yellow', 'red'] },
    { id: 'rearsafetymesh-detached', name: 'Detached or partially detached', severities: ['yellow', 'red'] },
    { id: 'rearsafetymesh-insufficient-coverage', name: 'Does not cover 2/3 of last pallet', severities: ['yellow', 'red'] },
    { id: 'rearsafetymesh-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ],

  deckingPanels: [
    { id: 'deckingpanels-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'deckingpanels-missing', name: 'Missing', severities: ['yellow', 'red'] },
    { id: 'deckingpanels-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ],

  pallet: [
    { id: 'pallet-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'] },
    { id: 'pallet-to-be-repositioned', name: 'To be repositioned', severities: ['yellow', 'red'] },
    { id: 'pallet-improperly-supported', name: 'Improperly supported', severities: ['yellow', 'red'] },
    { id: 'pallet-800x800', name: '800x800 format', severities: ['yellow'] },
    { id: 'pallet-not-strapped', name: 'Not properly strapped', severities: ['yellow', 'red'] },
    { id: 'pallet-forked-wrong-side', name: 'Forked wrong side', severities: ['yellow', 'red'] },
    { id: 'pallet-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ],

  entireRackingSystem: [
    { id: 'entirerackingsystem-dismantled', name: 'Will be dismantled shortly', severities: ['yellow'] },
    { id: 'entirerackingsystem-not-inspectable', name: 'Not inspectable', severities: ['yellow'] },
    { id: 'entirerackingsystem-missing-safety-lock', name: '100% missing safety lock', severities: ['red'] },
    { id: 'entirerackingsystem-missing-anchor-bolt', name: '100% missing anchor bolt', severities: ['red'] },
    { id: 'entirerackingsystem-h-frame', name: 'H-frame structure', severities: ['yellow'] },
    { id: 'entirerackingsystem-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ],

  bay: [
    { id: 'bay-obstructed', name: 'Obstructed/not accessible', severities: ['yellow'] },
    { id: 'bay-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
    { id: 'bay-h-frame', name: 'H-frame structure', severities: ['yellow'] },
    { id: 'bay-missing-safety-lock', name: '100% missing safety lock', severities: ['red'] },
    { id: 'bay-missing-anchor-bolt', name: '100% missing anchor bolt', severities: ['red'] },
  ],

  aisle: [
    { id: 'aisle-obstructed', name: 'Closed/obstructed/not accessible', severities: ['yellow'] },
    { id: 'aisle-other', name: 'Other (see notes)', severities: ['green', 'yellow', 'red'] },
  ],

  basePlate: [
    { id: 'baseplate-missing', name: 'Missing', severities: ['red'], description: 'Base plate is missing from the upright foot.' },
    { id: 'baseplate-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'], description: 'Base plate is bent, cracked, or otherwise damaged.' },
    { id: 'baseplate-not-fixed', name: 'Not Fixed to Floor', severities: ['yellow', 'red'], description: 'Base plate is not bolted or anchored to the floor.' },
    { id: 'baseplate-corrosion', name: 'Corrosion', severities: ['green', 'yellow', 'red'], description: 'Corrosion on the base plate or anchor bolt area.' },
    { id: 'baseplate-wrong-type', name: 'Wrong Type', severities: ['yellow', 'red'], description: 'Base plate does not match the specified system or upright.' },
    { id: 'baseplate-shim-missing', name: 'Shim Missing / Incorrect', severities: ['green', 'yellow'], description: 'Levelling shim is missing or incorrectly positioned.' },
  ],

  loadSign: [
    { id: 'loadsign-missing', name: 'Missing', severities: ['yellow', 'red'], description: 'Load sign is missing from the racking where required.' },
    { id: 'loadsign-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'], description: 'Load sign is physically damaged, torn, or partially detached.' },
    { id: 'loadsign-illegible', name: 'Illegible', severities: ['yellow', 'red'], description: 'Load sign text or figures are faded, obscured, or unreadable.' },
    { id: 'loadsign-wrong-position', name: 'Wrong Position', severities: ['green', 'yellow'], description: 'Load sign is not placed in the correct or visible location.' },
  ],

  topTieBeam: [
    { id: 'toptie-missing', name: 'Missing', severities: ['yellow', 'red'], description: 'Top tie beam is missing where required by design.' },
    { id: 'toptie-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'], description: 'Top tie beam has visible damage such as bends, dents, or deformation.' },
    { id: 'toptie-loose', name: 'Loose / Detached', severities: ['yellow', 'red'], description: 'Top tie beam is loose or partially detached from the frame connections.' },
    { id: 'toptie-corrosion', name: 'Corrosion', severities: ['green', 'yellow', 'red'], description: 'Corrosion affecting the top tie beam surface or connections.' },
    { id: 'toptie-wrong-type', name: 'Wrong Type', severities: ['yellow', 'red'], description: 'Top tie beam type does not match the specified system or design.' },
  ],

  footplate: [
    { id: 'footplate-missing', name: 'Missing', severities: ['red'], description: 'Footplate is missing from the upright base.' },
    { id: 'footplate-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'], description: 'Footplate is bent, cracked, or otherwise damaged.' },
    { id: 'footplate-not-fixed', name: 'Not Fixed to Floor', severities: ['yellow', 'red'], description: 'Footplate is not bolted or anchored to the floor as required.' },
    { id: 'footplate-corrosion', name: 'Corrosion', severities: ['green', 'yellow', 'red'], description: 'Corrosion on the footplate or its anchor bolt area.' },
  ],
};

// Maps old NC type IDs to new ones
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
};

// Maps old elementType keys to new ones
export const ELEMENT_TYPE_MIGRATION = {
  'frontGuard': 'frontImpactGuard',
  'cornerGuard': 'cornerImpactGuard',
};

export default ncTypes;
