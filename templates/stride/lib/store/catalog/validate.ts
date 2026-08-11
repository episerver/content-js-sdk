/**
 * Catalog validation — contracts.md §1 (build-time, fails `next build`).
 *
 * Two layers, both exported and both run by `defineCatalog`:
 *  - validateCatalog: structural rules over the product list.
 *  - validateDemoFixtures: proves, with the REAL engine (`searchCatalog`),
 *    that the three benchmark workflows have deterministic solutions.
 */
import { searchCatalog } from '../engine';
import type { Accessory, AccessoryKind, Bike, Discipline, Product } from './types';
import {
  ACCESSORY_KINDS,
  DISCIPLINES,
  FRAME_SIZES,
  MOUNTS,
  PRODUCT_ID_MAX,
  PRODUCT_ID_MIN,
  PRODUCT_ID_PATTERN,
  STYLES,
  TERRAINS,
  isCompatible,
} from './types';

export class CatalogValidationError extends Error {
  constructor(message: string) {
    super(`catalog validation failed: ${message}`);
    this.name = 'CatalogValidationError';
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new CatalogValidationError(message);
}

// ---------------------------------------------------------------------------
// Structural validation
// ---------------------------------------------------------------------------

export function validateCatalog(products: Product[]): void {
  assert(Array.isArray(products) && products.length > 0, 'catalog is empty');

  const seen = new Set<string>();
  for (const p of products) {
    const where = `product "${p?.id ?? '<no id>'}"`;
    assert(typeof p.id === 'string', `${where}: id must be a string`);
    assert(
      p.id.length >= PRODUCT_ID_MIN && p.id.length <= PRODUCT_ID_MAX,
      `${where}: id must be ${PRODUCT_ID_MIN}–${PRODUCT_ID_MAX} chars (got ${p.id.length})`,
    );
    assert(PRODUCT_ID_PATTERN.test(p.id), `${where}: id must be kebab-case (^[a-z0-9]+(-[a-z0-9]+)*$)`);
    assert(!seen.has(p.id), `duplicate product id "${p.id}"`);
    seen.add(p.id);

    assert(typeof p.name === 'string' && p.name.length > 0, `${where}: name is required`);
    assert(
      typeof p.description === 'string' && p.description.length > 0,
      `${where}: description is required`,
    );
    assert(
      typeof p.priceUsd === 'number' && Number.isFinite(p.priceUsd) && p.priceUsd > 0,
      `${where}: priceUsd must be a positive number`,
    );
    assert(
      Math.round(p.priceUsd * 100) === p.priceUsd * 100,
      `${where}: priceUsd must have at most 2 decimals`,
    );
    assert(
      typeof p.weightKg === 'number' && Number.isFinite(p.weightKg) && p.weightKg > 0,
      `${where}: weightKg must be a positive number`,
    );
    assert(
      Array.isArray(p.colors) && p.colors.length > 0 && p.colors.every(c => typeof c === 'string' && c === c.toLowerCase()),
      `${where}: colors must be a non-empty array of lowercase color words`,
    );
    assert(STYLES.includes(p.style), `${where}: invalid style "${p.style}"`);
    assert(typeof p.inStock === 'boolean', `${where}: inStock must be boolean`);
    assert(
      Number.isInteger(p.imageHue) && p.imageHue >= 0 && p.imageHue <= 359,
      `${where}: imageHue must be an integer 0–359`,
    );

    if (p.category === 'bike') validateBike(p, where);
    else if (p.category === 'accessory') validateAccessory(p, where);
    else assert(false, `${where}: unknown category`);
  }

  const bikes = products.filter((p): p is Bike => p.category === 'bike');
  const accessories = products.filter((p): p is Accessory => p.category === 'accessory');

  // Cross-references
  for (const a of accessories) {
    if (a.requiresMount) {
      assert(
        bikes.some(b => b.mounts.includes(a.requiresMount!)),
        `accessory "${a.id}": requiresMount "${a.requiresMount}" appears on no bike`,
      );
    }
    for (const d of a.compatibleDisciplines) {
      assert(
        bikes.some(b => b.discipline === d),
        `accessory "${a.id}": compatibleDisciplines entry "${d}" has no bike`,
      );
    }
  }

  // v2 fixture-set counts
  assert(bikes.length === 12, `expected exactly 12 bikes, got ${bikes.length}`);
  assert(accessories.length === 12, `expected exactly 12 accessories, got ${accessories.length}`);
  for (const d of DISCIPLINES) {
    assert(bikes.some(b => b.discipline === d), `no bike covers discipline "${d}"`);
  }
  for (const k of ACCESSORY_KINDS) {
    assert(accessories.some(a => a.kind === k), `no accessory covers kind "${k}"`);
  }
}

function validateBike(b: Bike, where: string): void {
  assert(DISCIPLINES.includes(b.discipline), `${where}: invalid discipline "${b.discipline}"`);
  assert(
    Array.isArray(b.terrains) && b.terrains.length > 0 && b.terrains.every(t => TERRAINS.includes(t)),
    `${where}: terrains must be a non-empty array of valid terrains`,
  );
  assert(
    Array.isArray(b.sizing) && b.sizing.length > 0,
    `${where}: sizing table is required and must be non-empty`,
  );
  for (const row of b.sizing) {
    assert(FRAME_SIZES.includes(row.frameSize), `${where}: invalid frame size "${row.frameSize}"`);
    assert(
      Number.isFinite(row.riderHeightMinCm) &&
        Number.isFinite(row.riderHeightMaxCm) &&
        row.riderHeightMinCm < row.riderHeightMaxCm,
      `${where}: sizing row ${row.frameSize} has an invalid height range`,
    );
  }
  for (let i = 1; i < b.sizing.length; i++) {
    const prev = b.sizing[i - 1];
    const cur = b.sizing[i];
    assert(
      Number(cur.frameSize) > Number(prev.frameSize),
      `${where}: sizing rows must ascend by frame size (${prev.frameSize} → ${cur.frameSize})`,
    );
    assert(
      cur.riderHeightMinCm > prev.riderHeightMaxCm,
      `${where}: sizing rows ${prev.frameSize} and ${cur.frameSize} overlap`,
    );
  }
  const sizingSizes = new Set(b.sizing.map(r => r.frameSize));
  assert(Array.isArray(b.variants) && b.variants.length > 0, `${where}: variants are required`);
  const variantSizes = new Set<string>();
  for (const v of b.variants) {
    assert(
      sizingSizes.has(v.frameSize),
      `${where}: variant size ${v.frameSize} has no sizing row`,
    );
    assert(!variantSizes.has(v.frameSize), `${where}: duplicate variant size ${v.frameSize}`);
    variantSizes.add(v.frameSize);
    assert(typeof v.inStock === 'boolean', `${where}: variant ${v.frameSize} inStock must be boolean`);
  }
  assert(
    Array.isArray(b.mounts) && b.mounts.every(m => MOUNTS.includes(m)),
    `${where}: mounts must be an array of valid mounts`,
  );
  assert(new Set(b.mounts).size === b.mounts.length, `${where}: duplicate mounts`);
  if (b.discipline === 'e-bike') {
    assert(
      typeof b.rangeKm === 'number' && Number.isFinite(b.rangeKm) && b.rangeKm > 0,
      `${where}: rangeKm is REQUIRED for e-bikes`,
    );
  } else {
    assert(b.rangeKm === undefined, `${where}: rangeKm is forbidden for non-e-bikes`);
  }
}

function validateAccessory(a: Accessory, where: string): void {
  assert(ACCESSORY_KINDS.includes(a.kind), `${where}: invalid accessory kind "${a.kind}"`);
  assert(
    Array.isArray(a.compatibleDisciplines) &&
      a.compatibleDisciplines.length > 0 &&
      a.compatibleDisciplines.every(d => DISCIPLINES.includes(d)),
    `${where}: compatibleDisciplines must be a non-empty array of valid disciplines`,
  );
  if (a.requiresMount !== undefined) {
    assert(MOUNTS.includes(a.requiresMount), `${where}: invalid requiresMount "${a.requiresMount}"`);
  }
}

// ---------------------------------------------------------------------------
// Demo-fixture solvability (computed via the real engine, contracts §1)
// ---------------------------------------------------------------------------

const PRIMARY = { discipline: 'gravel' as Discipline, maxPriceUsd: 2600, riderHeightCm: 178 };
const DEV_A_BUDGET = 3000;
const DEV_B_BUDGET = 3400;
const DEV_B_MIN_RANGE = 80;

export interface DemoSolution {
  primaryBikes: Bike[];
  devABike: Bike;
  devAAccessories: Record<AccessoryKind, Accessory>;
  devATotal: number;
  devBEBike: Bike;
  devBTotal: number;
  devBIncompatible: Accessory[];
}

/**
 * Proves the three benchmark workflows deterministically. Throws
 * CatalogValidationError naming the first broken rule.
 */
export function validateDemoFixtures(products: Product[]): DemoSolution {
  // Primary (Find My Bike): ≥2 in-stock gravel bikes ≤ $2,600 with an in-stock
  // frame size fitting a 178 cm rider, differing in weightKg.
  const primary = searchCatalog(products, {
    category: 'bike',
    discipline: PRIMARY.discipline,
    maxPriceUsd: PRIMARY.maxPriceUsd,
    riderHeightCm: PRIMARY.riderHeightCm,
    preferences: { prioritizeWeight: true },
  });
  assert(
    primary.matches.length >= 2,
    `primary workflow: need ≥2 in-stock gravel bikes ≤ $${PRIMARY.maxPriceUsd} fitting a ${PRIMARY.riderHeightCm} cm rider; engine found ${primary.matches.length}`,
  );
  const primaryBikes = primary.matches.map(m => m.product as Bike);
  const weights = new Set(primaryBikes.map(b => b.weightKg));
  assert(
    weights.size >= 2,
    'primary workflow: the qualifying gravel bikes all share one weightKg — "the lighter one" is undefined',
  );

  // Deviation A (complete setup): engine-ranked bike + cheapest compatible
  // helmet + lock + lights, all in stock, total ≤ $3,000.
  const devABike = primaryBikes[0]; // the lighter one, per engine ranking
  const devAAccessories = {} as Record<AccessoryKind, Accessory>;
  let devATotal = devABike.priceUsd;
  for (const kind of ACCESSORY_KINDS) {
    const result = searchCatalog(products, {
      category: 'accessory',
      kind,
      compatibleWithProductId: devABike.id,
    });
    assert(
      result.matches.length > 0,
      `deviation A: no in-stock ${kind} is compatible with "${devABike.id}"`,
    );
    const pick = result.matches[0].product as Accessory;
    devAAccessories[kind] = pick;
    devATotal += pick.priceUsd;
  }
  devATotal = Math.round(devATotal * 100) / 100;
  assert(
    devATotal <= DEV_A_BUDGET,
    `deviation A: engine-selected setup (${devABike.id} + ${ACCESSORY_KINDS.map(k => devAAccessories[k].id).join(' + ')}) totals $${devATotal} > $${DEV_A_BUDGET}`,
  );

  // Deviation B (e-bike swap): an in-stock e-bike with rangeKm ≥ 80 that keeps
  // the deviation-A cart under $3,400 after the swap, plus ≥1 deviation-A
  // accessory incompatible with that e-bike.
  const eBikes = searchCatalog(products, {
    category: 'bike',
    discipline: 'e-bike',
    minRangeKm: DEV_B_MIN_RANGE,
  });
  assert(
    eBikes.matches.length > 0,
    `deviation B: no in-stock e-bike with rangeKm ≥ ${DEV_B_MIN_RANGE}`,
  );
  const accessoriesTotal = devATotal - devABike.priceUsd;
  const swap = eBikes.matches
    .map(m => m.product as Bike)
    .find(b => Math.round((b.priceUsd + accessoriesTotal) * 100) / 100 < DEV_B_BUDGET);
  assert(
    swap,
    `deviation B: no qualifying e-bike keeps the deviation-A cart under $${DEV_B_BUDGET} after the swap`,
  );
  const devBTotal = Math.round((swap.priceUsd + accessoriesTotal) * 100) / 100;
  const devBIncompatible = ACCESSORY_KINDS.map(k => devAAccessories[k]).filter(
    a => !isCompatible(a, swap),
  );
  assert(
    devBIncompatible.length >= 1,
    `deviation B: every deviation-A accessory is compatible with "${swap.id}" — "remove incompatible items" has no material`,
  );

  return {
    primaryBikes,
    devABike,
    devAAccessories,
    devATotal,
    devBEBike: swap,
    devBTotal,
    devBIncompatible,
  };
}
