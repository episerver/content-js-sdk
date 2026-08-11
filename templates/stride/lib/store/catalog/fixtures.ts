/**
 * Stride store catalog — 24 fixtures (12 bikes, 12 accessories).
 *
 * Data-only by contract (PRD §3.2): adding a product is one builder call here;
 * engine, tools, and components never change. `defineCatalog` validates
 * (structural + demo-fixture solvability) and freezes at import time, so a
 * bad fixture fails `next build`.
 */
import { accessory, bike, defineCatalog } from './builders';
import type { FrameSize, SizingRow } from './types';

/** Shared rider-height bands (cm), non-overlapping, ascending. */
const HEIGHT_BANDS: Record<FrameSize, [number, number]> = {
  '48': [155, 162],
  '50': [163, 167],
  '52': [168, 172],
  '54': [173, 177],
  '56': [178, 182],
  '58': [183, 187],
  '60': [188, 192],
  '62': [193, 198],
};

function sizing(...sizes: FrameSize[]): SizingRow[] {
  return sizes.map(frameSize => ({
    frameSize,
    riderHeightMinCm: HEIGHT_BANDS[frameSize][0],
    riderHeightMaxCm: HEIGHT_BANDS[frameSize][1],
  }));
}

function variants(inStock: FrameSize[], outOfStock: FrameSize[] = []) {
  return [
    ...inStock.map(frameSize => ({ frameSize, inStock: true })),
    ...outOfStock.map(frameSize => ({ frameSize, inStock: false })),
  ].sort((a, b) => Number(a.frameSize) - Number(b.frameSize));
}

export const CATALOG = defineCatalog([
  // --- Road ---------------------------------------------------------------
  bike({
    id: 'aero-strada-rs',
    name: 'Aero Strada RS',
    description:
      'A wind-cheating carbon road frame with deep-section wheels and electronic shifting. Built for fast group rides and race days.',
    priceUsd: 2549,
    weightKg: 7.8,
    colors: ['black', 'red'],
    discipline: 'road',
    terrains: ['paved'],
    sizing: sizing('50', '52', '54', '56', '58'),
    variants: variants(['52', '54', '56', '58'], ['50']),
    mounts: ['light-mount', 'frame-mount'],
    imageHue: 4,
  }),
  bike({
    id: 'paceline-105',
    name: 'Paceline 105',
    description:
      'An aluminum road all-rounder with a full 105 groupset and endurance geometry. The honest first road bike that lasts.',
    priceUsd: 1499,
    weightKg: 9.1,
    colors: ['white', 'blue'],
    style: 'classic',
    discipline: 'road',
    terrains: ['paved'],
    sizing: sizing('48', '50', '52', '54', '56', '58'),
    variants: variants(['48', '50', '52', '54', '58'], ['56']),
    mounts: ['frame-mount'],
    imageHue: 214,
  }),
  bike({
    id: 'corsa-endurance',
    name: 'Corsa Endurance',
    description:
      'Relaxed-fit carbon road bike with clearance for 35 mm tires and mounts for every season. Comfort over long distances without losing pace.',
    priceUsd: 2199,
    weightKg: 8.6,
    colors: ['silver', 'black'],
    style: 'classic',
    discipline: 'road',
    terrains: ['paved', 'mixed'],
    sizing: sizing('50', '52', '54', '56', '58', '60'),
    variants: variants(['50', '52', '54', '56', '58', '60']),
    mounts: ['rack', 'light-mount', 'frame-mount'],
    imageHue: 258,
  }),

  // --- Gravel -------------------------------------------------------------
  bike({
    id: 'ridgeline-carbon',
    name: 'Ridgeline Carbon',
    description:
      'A light carbon gravel rig with 45 mm rubber, a compliant seatpost, and mounts for racks, lights, and bottles. Fast on champagne gravel, calm on washboard.',
    priceUsd: 2399,
    weightKg: 9.4,
    colors: ['olive', 'black'],
    discipline: 'gravel',
    terrains: ['mixed', 'trail', 'paved'],
    sizing: sizing('50', '52', '54', '56', '58', '60'),
    variants: variants(['52', '54', '56', '58'], ['50', '60']),
    mounts: ['rack', 'light-mount', 'frame-mount'],
    imageHue: 96,
  }),
  bike({
    id: 'sierra-alloy-gs',
    name: 'Sierra Alloy GS',
    description:
      'A tough aluminum gravel bike with a steady, planted ride and room for bikepacking bags. The value pick for mixed-surface weekends.',
    priceUsd: 1749,
    weightKg: 10.6,
    colors: ['sand', 'teal'],
    style: 'classic',
    discipline: 'gravel',
    terrains: ['mixed', 'trail'],
    sizing: sizing('48', '50', '52', '54', '56', '58'),
    variants: variants(['48', '50', '52', '54', '56', '58']),
    mounts: ['rack', 'frame-mount'],
    imageHue: 41,
  }),
  bike({
    id: 'drift-ti-explorer',
    name: 'Drift Ti Explorer',
    description:
      'A titanium gravel frame that soaks up chatter and shrugs off decades. Dressed with a wireless drivetrain and dynamo-ready fork.',
    priceUsd: 3499,
    weightKg: 9,
    colors: ['titanium', 'copper'],
    discipline: 'gravel',
    terrains: ['mixed', 'trail', 'paved'],
    sizing: sizing('52', '54', '56', '58', '60'),
    variants: variants(['52', '54', '56', '58', '60']),
    mounts: ['rack', 'light-mount', 'frame-mount'],
    imageHue: 27,
  }),

  // --- Commuter -----------------------------------------------------------
  bike({
    id: 'metroline-8',
    name: 'Metroline 8',
    description:
      'An 8-speed internal hub, belt drive, and full fenders: the zero-maintenance city commuter. Rack and light mounts come standard.',
    priceUsd: 1099,
    weightKg: 12.1,
    colors: ['grey', 'navy'],
    style: 'urban',
    discipline: 'commuter',
    terrains: ['paved'],
    sizing: sizing('50', '52', '54', '56', '58', '60'),
    variants: variants(['50', '52', '54', '56', '58', '60']),
    mounts: ['rack', 'light-mount'],
    imageHue: 207,
  }),
  bike({
    id: 'boulevard-step',
    name: 'Boulevard Step',
    description:
      'A step-through frame with an upright ride, swept-back bars, and a front basket mount. Errands, cafés, and everything between.',
    priceUsd: 949,
    weightKg: 12.8,
    colors: ['cream', 'sage'],
    style: 'urban',
    discipline: 'commuter',
    terrains: ['paved'],
    sizing: sizing('48', '50', '52', '54', '56'),
    variants: variants(['48', '50', '52', '54'], ['56']),
    mounts: ['rack', 'light-mount'],
    imageHue: 145,
  }),

  // --- Mountain -----------------------------------------------------------
  bike({
    id: 'summit-trail-29',
    name: 'Summit Trail 29',
    description:
      'A 29er trail hardtail with a 130 mm fork, dropper post, and aggressive tread. Climbs efficiently, descends with intent.',
    priceUsd: 2299,
    weightKg: 13.4,
    colors: ['orange', 'black'],
    discipline: 'mountain',
    terrains: ['trail'],
    sizing: sizing('50', '52', '54', '56', '58', '60'),
    variants: variants(['50', '52', '54', '56', '58', '60']),
    mounts: ['frame-mount'],
    imageHue: 22,
  }),
  bike({
    id: 'boulder-hardtail',
    name: 'Boulder Hardtail',
    description:
      'A no-nonsense aluminum hardtail with a 100 mm fork and wide-range 1x drivetrain. The trail gateway bike.',
    priceUsd: 1399,
    weightKg: 13.9,
    colors: ['red', 'black'],
    inStock: false,
    discipline: 'mountain',
    terrains: ['trail', 'mixed'],
    sizing: sizing('48', '50', '52', '54', '56', '58'),
    variants: variants(['48', '50', '52', '54', '56', '58']),
    mounts: ['frame-mount', 'rack'],
    imageHue: 356,
  }),

  // --- E-bike -------------------------------------------------------------
  bike({
    id: 'volt-commute-9',
    name: 'Volt Commute 9',
    description:
      'A mid-drive commuter e-bike with a 100 km range, integrated rear rack, and hydraulic discs. Arrive fast, arrive fresh.',
    priceUsd: 2899,
    weightKg: 21.5,
    colors: ['black', 'silver'],
    style: 'urban',
    discipline: 'e-bike',
    terrains: ['paved'],
    sizing: sizing('50', '52', '54', '56', '58'),
    variants: variants(['50', '52', '54', '56', '58']),
    mounts: ['rack'],
    rangeKm: 100,
    imageHue: 191,
  }),
  bike({
    id: 'pulse-ebike-45',
    name: 'Pulse E-bike 45',
    description:
      'A speed-pedelec with a 70 km range, suspension fork, and moto-grade lighting points. For long commutes that feel short.',
    priceUsd: 3699,
    weightKg: 23.4,
    colors: ['white', 'blue'],
    style: 'urban',
    discipline: 'e-bike',
    terrains: ['paved', 'mixed'],
    sizing: sizing('50', '52', '54', '56', '58', '60'),
    variants: variants(['50', '52', '54', '56', '58', '60']),
    mounts: ['rack', 'light-mount'],
    rangeKm: 70,
    imageHue: 227,
  }),

  // --- Helmets ------------------------------------------------------------
  accessory({
    id: 'vela-allroad-helmet',
    name: 'Vela Allroad Helmet',
    description:
      'A ventilated MIPS helmet tuned for drop-bar riding, road or gravel. Light enough to forget on long climbs.',
    priceUsd: 139,
    weightKg: 0.28,
    colors: ['white', 'olive'],
    kind: 'helmet',
    compatibleDisciplines: ['road', 'gravel'],
    imageHue: 74,
  }),
  accessory({
    id: 'urban-glide-helmet',
    name: 'Urban Glide Helmet',
    description:
      'A low-profile city helmet with an integrated rear LED and magnetic buckle. Commuter- and e-bike-rated coverage.',
    priceUsd: 89,
    weightKg: 0.36,
    colors: ['grey', 'black'],
    style: 'urban',
    kind: 'helmet',
    compatibleDisciplines: ['commuter', 'e-bike'],
    imageHue: 200,
  }),
  accessory({
    id: 'summit-guard-helmet',
    name: 'Summit Guard Helmet',
    description:
      'Extended-coverage trail helmet with an adjustable visor and rock-solid retention. At home on singletrack and rough gravel.',
    priceUsd: 159,
    weightKg: 0.38,
    colors: ['orange', 'black'],
    kind: 'helmet',
    compatibleDisciplines: ['mountain', 'gravel'],
    imageHue: 18,
  }),
  accessory({
    id: 'aero-tt-helmet',
    name: 'Aero TT Helmet',
    description:
      'A wind-tunnel-shaped road helmet with a magnetic visor. Free speed for race day.',
    priceUsd: 249,
    weightKg: 0.41,
    colors: ['black', 'red'],
    kind: 'helmet',
    compatibleDisciplines: ['road'],
    imageHue: 340,
  }),

  // --- Locks --------------------------------------------------------------
  accessory({
    id: 'bastion-chain-lock',
    name: 'Bastion Chain Lock',
    description:
      'A hardened-steel chain in a fabric sleeve with a pick-resistant cylinder. Wraps any frame, any rack, any bike.',
    priceUsd: 89,
    weightKg: 2.2,
    colors: ['black'],
    style: 'urban',
    kind: 'lock',
    imageHue: 250,
  }),
  accessory({
    id: 'citadel-u-lock',
    name: 'Citadel U-Lock',
    description:
      'A 16 mm shackle U-lock with a frame-mount carrier bracket. Sold-secure diamond rating for city parking.',
    priceUsd: 119,
    weightKg: 1.6,
    colors: ['yellow', 'black'],
    style: 'urban',
    kind: 'lock',
    requiresMount: 'frame-mount',
    imageHue: 52,
  }),
  accessory({
    id: 'loop-cable-lock',
    name: 'Loop Cable Lock',
    description:
      'A light coil cable with a four-digit combination for quick café stops. Deterrence-grade, city errands only.',
    priceUsd: 39,
    weightKg: 0.6,
    colors: ['teal', 'black'],
    style: 'urban',
    kind: 'lock',
    compatibleDisciplines: ['commuter'],
    imageHue: 172,
  }),
  accessory({
    id: 'vault-folding-lock',
    name: 'Vault Folding Lock',
    description:
      'Hardened links fold to pocket size and open to lock frame and wheel together. Quiet, rattle-free holster included.',
    priceUsd: 149,
    weightKg: 1.3,
    colors: ['black', 'silver'],
    kind: 'lock',
    compatibleDisciplines: ['road', 'gravel', 'commuter', 'e-bike'],
    imageHue: 280,
  }),

  // --- Lights -------------------------------------------------------------
  accessory({
    id: 'lumen-pro-lights',
    name: 'Lumen Pro Light Set',
    description:
      'An 800-lumen front beam and smart rear light, both on quick-release light mounts. Sees and is seen on any road.',
    priceUsd: 129,
    weightKg: 0.24,
    colors: ['black'],
    kind: 'lights',
    requiresMount: 'light-mount',
    imageHue: 60,
  }),
  accessory({
    id: 'orbit-clip-light',
    name: 'Orbit Clip Light',
    description:
      'A clip-anywhere silicone light pair for around-town visibility. USB-C charged, tool-free.',
    priceUsd: 45,
    weightKg: 0.09,
    colors: ['black', 'white'],
    style: 'urban',
    kind: 'lights',
    compatibleDisciplines: ['commuter'],
    imageHue: 120,
  }),
  accessory({
    id: 'beacon-usb-set',
    name: 'Beacon USB Set',
    description:
      'A slim strap-on front and rear light set for paved riding. Ninety grams total, four light modes.',
    priceUsd: 69,
    weightKg: 0.09,
    colors: ['silver', 'black'],
    kind: 'lights',
    compatibleDisciplines: ['road', 'commuter'],
    imageHue: 300,
  }),
  accessory({
    id: 'radiant-mtb-light',
    name: 'Radiant MTB Light',
    description:
      'A 1600-lumen trail light with a remote switch and bar-space-saving light mount. Turns dusk laps into night laps.',
    priceUsd: 189,
    weightKg: 0.32,
    colors: ['black', 'orange'],
    kind: 'lights',
    requiresMount: 'light-mount',
    compatibleDisciplines: ['mountain', 'gravel'],
    imageHue: 32,
  }),
]);

export const PRODUCTS = CATALOG.products;
