/**
 * Catalog builders — contracts.md §1.
 * A new product = one bike({...})/accessory({...}) call in fixtures.ts.
 */
import type { Accessory, Bike, Catalog, Product } from './types';
import { DISCIPLINES } from './types';
import { validateCatalog, validateDemoFixtures } from './validate';

type BikeInput = Omit<Bike, 'category' | 'style' | 'inStock' | 'colors'> &
  Partial<Pick<Bike, 'style' | 'inStock' | 'colors'>>;

type AccessoryInput = Omit<
  Accessory,
  'category' | 'style' | 'inStock' | 'colors' | 'compatibleDisciplines'
> &
  Partial<Pick<Accessory, 'style' | 'inStock' | 'colors' | 'compatibleDisciplines'>>;

/** Defaults: style 'sport', inStock true, colors ['black']. */
export function bike(input: BikeInput): Bike {
  return {
    style: 'sport',
    inStock: true,
    colors: ['black'],
    ...input,
    category: 'bike',
  };
}

/** Defaults: style 'sport', inStock true, colors ['black'], all-discipline compatibility. */
export function accessory(input: AccessoryInput): Accessory {
  return {
    style: 'sport',
    inStock: true,
    colors: ['black'],
    compatibleDisciplines: [...DISCIPLINES],
    ...input,
    category: 'accessory',
  };
}

/**
 * Runs full §1 validation (structural + demo-fixture solvability via the real
 * engine) and freezes the data. Throwing here fails `next build`, because the
 * fixtures module is imported by every store page and API route.
 */
export function defineCatalog(products: Product[]): Catalog {
  validateCatalog(products);
  validateDemoFixtures(products);
  for (const p of products) deepFreeze(p);
  return Object.freeze({ products: Object.freeze([...products]) });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const key of Object.keys(value as object)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
    Object.freeze(value);
  }
  return value;
}
