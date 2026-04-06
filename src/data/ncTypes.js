const ncTypes = {
  beam: [
    { id: 'beam-bent', name: 'Bent / Twisted', severities: ['green', 'yellow', 'red'], description: 'Beam is bent or twisted out of its original profile.' },
    { id: 'beam-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'], description: 'Visible damage to the beam surface, dents, or tears.' },
    { id: 'beam-missing-connector', name: 'Missing Safety Connector', severities: ['yellow', 'red'], description: 'Safety pin or locking clip is missing from the beam-to-upright connection.' },
    { id: 'beam-unhooked', name: 'Unhooked / Partially Unhooked', severities: ['yellow', 'red'], description: 'Beam is not properly hooked into the upright connector slots, partially or fully disengaged.' },
    { id: 'beam-overloaded', name: 'Overloaded', severities: ['yellow', 'red'], description: 'Beam is loaded beyond its rated capacity.' },
    { id: 'beam-corrosion', name: 'Corrosion', severities: ['green', 'yellow', 'red'], description: 'Surface rust or corrosion affecting beam integrity.' },
    { id: 'beam-weld-failure', name: 'Weld Failure', severities: ['red'], description: 'Cracked or failed weld on the beam connector or body.' },
    { id: 'beam-wrong-type', name: 'Wrong Type', severities: ['yellow', 'red'], description: 'Beam type does not match the specified system or manufacturer.' },
    { id: 'beam-deflection', name: 'Excessive Deflection', severities: ['green', 'yellow', 'red'], description: 'Beam deflection exceeds acceptable limits under load.' },
  ],

  upright: [
    { id: 'upright-bent', name: 'Bent / Twisted', severities: ['green', 'yellow', 'red'], description: 'Upright is bent or twisted out of plumb.' },
    { id: 'upright-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'], description: 'Visible damage to the upright such as dents, cuts, or holes.' },
    { id: 'upright-corrosion', name: 'Corrosion', severities: ['green', 'yellow', 'red'], description: 'Rust or corrosion reducing structural integrity of the upright.' },
    { id: 'upright-out-of-plumb', name: 'Out of Plumb', severities: ['green', 'yellow', 'red'], description: 'Upright is leaning beyond acceptable tolerances.' },
    { id: 'upright-perforations', name: 'Damaged Perforations', severities: ['yellow', 'red'], description: 'Connector holes are enlarged, torn, or otherwise damaged.' },
    { id: 'upright-splice', name: 'Incorrect Splice', severities: ['yellow', 'red'], description: 'Splice connection is missing, loose, or incorrectly installed.' },
  ],

  frame: [
    { id: 'frame-out-of-plumb', name: 'Out of Plumb', severities: ['green', 'yellow', 'red'], description: 'Frame is leaning beyond acceptable tolerances.' },
    { id: 'frame-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'], description: 'General damage to the frame assembly.' },
    { id: 'frame-overloaded', name: 'Overloaded', severities: ['yellow', 'red'], description: 'Frame is loaded beyond its rated capacity.' },
    { id: 'frame-wrong-type', name: 'Wrong Type', severities: ['yellow', 'red'], description: 'Frame specification does not match the system design.' },
    { id: 'frame-missing', name: 'Missing', severities: ['red'], description: 'Frame is entirely missing from the installation.' },
    { id: 'frame-corrosion', name: 'Corrosion', severities: ['green', 'yellow', 'red'], description: 'Corrosion affecting frame structural members.' },
  ],

  brace: [
    { id: 'brace-bent', name: 'Bent / Twisted', severities: ['green', 'yellow', 'red'], description: 'Brace is bent or deformed out of alignment.' },
    { id: 'brace-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'], description: 'Visible damage to the horizontal or diagonal brace.' },
    { id: 'brace-missing', name: 'Missing', severities: ['yellow', 'red'], description: 'Brace is missing from the frame assembly.' },
    { id: 'brace-loose', name: 'Loose / Detached', severities: ['yellow', 'red'], description: 'Brace is loose or partially detached from the frame.' },
    { id: 'brace-corrosion', name: 'Corrosion', severities: ['green', 'yellow', 'red'], description: 'Corrosion reducing the structural integrity of the brace.' },
    { id: 'brace-weld-failure', name: 'Weld Failure', severities: ['red'], description: 'Cracked or failed weld at brace connection points.' },
  ],

  basePlate: [
    { id: 'baseplate-missing', name: 'Missing', severities: ['red'], description: 'Base plate is missing from the upright foot.' },
    { id: 'baseplate-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'], description: 'Base plate is bent, cracked, or otherwise damaged.' },
    { id: 'baseplate-not-fixed', name: 'Not Fixed to Floor', severities: ['yellow', 'red'], description: 'Base plate is not bolted or anchored to the floor.' },
    { id: 'baseplate-corrosion', name: 'Corrosion', severities: ['green', 'yellow', 'red'], description: 'Corrosion on the base plate or anchor bolt area.' },
    { id: 'baseplate-wrong-type', name: 'Wrong Type', severities: ['yellow', 'red'], description: 'Base plate does not match the specified system or upright.' },
    { id: 'baseplate-shim-missing', name: 'Shim Missing / Incorrect', severities: ['green', 'yellow'], description: 'Levelling shim is missing or incorrectly positioned.' },
  ],

  guardrail: [
    { id: 'guardrail-missing', name: 'Missing', severities: ['yellow', 'red'], description: 'Guardrail is missing where required by layout or regulation.' },
    { id: 'guardrail-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'], description: 'Guardrail is bent, broken, or has impact damage.' },
    { id: 'guardrail-wrong-height', name: 'Incorrect Height', severities: ['yellow', 'red'], description: 'Guardrail height does not meet required specifications.' },
    { id: 'guardrail-not-fixed', name: 'Not Fixed Properly', severities: ['yellow', 'red'], description: 'Guardrail is not properly anchored to the floor or racking.' },
    { id: 'guardrail-corrosion', name: 'Corrosion', severities: ['green', 'yellow', 'red'], description: 'Corrosion affecting the guardrail surface or connections.' },
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

  frontGuard: [
    { id: 'frontguard-missing', name: 'Missing', severities: ['yellow', 'red'], description: 'Front guard is missing where required by layout or regulation.' },
    { id: 'frontguard-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'], description: 'Front guard is bent, broken, or has impact damage.' },
    { id: 'frontguard-wrong-height', name: 'Incorrect Height', severities: ['yellow', 'red'], description: 'Front guard height does not meet required specifications.' },
    { id: 'frontguard-not-fixed', name: 'Not Fixed Properly', severities: ['yellow', 'red'], description: 'Front guard is not properly anchored to the floor or racking.' },
    { id: 'frontguard-corrosion', name: 'Corrosion', severities: ['green', 'yellow', 'red'], description: 'Corrosion affecting the front guard surface or connections.' },
  ],

  cornerGuard: [
    { id: 'cornerguard-missing', name: 'Missing', severities: ['yellow', 'red'], description: 'Corner guard is missing where required by layout or regulation.' },
    { id: 'cornerguard-damaged', name: 'Damaged', severities: ['green', 'yellow', 'red'], description: 'Corner guard is bent, broken, or has impact damage.' },
    { id: 'cornerguard-wrong-height', name: 'Incorrect Height', severities: ['yellow', 'red'], description: 'Corner guard height does not meet required specifications.' },
    { id: 'cornerguard-not-fixed', name: 'Not Fixed Properly', severities: ['yellow', 'red'], description: 'Corner guard is not properly anchored to the floor or racking.' },
    { id: 'cornerguard-corrosion', name: 'Corrosion', severities: ['green', 'yellow', 'red'], description: 'Corrosion affecting the corner guard surface or connections.' },
  ],
};

export default ncTypes;
