/**
 * Bidirectional URL ⇄ SearchArgs mapping for /store.
 * The /store URL fully encodes search/filter/sort state (acceptance 5):
 * loading a copied URL reproduces the same controls and results.
 */
import type { AccessoryKind, Discipline, Style, Terrain } from '../../lib/store/catalog/types';
import {
  ACCESSORY_KINDS,
  DISCIPLINES,
  STYLES,
  TERRAINS,
} from '../../lib/store/catalog/types';
import type { SearchArgs } from '../../lib/store/engine';

export function paramsToArgs(params: URLSearchParams): SearchArgs {
  const args: SearchArgs = {};
  const category = params.get('category');
  if (category === 'bike' || category === 'accessory') args.category = category;
  const discipline = params.get('discipline');
  if (discipline && DISCIPLINES.includes(discipline as Discipline)) {
    args.discipline = discipline as Discipline;
  }
  const terrain = params.get('terrain');
  if (terrain && TERRAINS.includes(terrain as Terrain)) args.terrain = terrain as Terrain;
  const kind = params.get('kind');
  if (kind && ACCESSORY_KINDS.includes(kind as AccessoryKind)) args.kind = kind as AccessoryKind;

  const maxPrice = numberParam(params.get('maxPrice'));
  if (maxPrice !== undefined) args.maxPriceUsd = maxPrice;
  const height = numberParam(params.get('height'));
  if (height !== undefined) args.riderHeightCm = height;
  const minRange = numberParam(params.get('minRange'));
  if (minRange !== undefined) args.minRangeKm = minRange;

  const compat = params.get('compat');
  if (compat) args.compatibleWithProductId = compat;
  if (params.get('stock') === 'all') args.inStockOnly = false;

  const colors = params.get('colors');
  const style = params.get('style');
  const weight = params.get('sort') === 'weight';
  if (colors || (style && STYLES.includes(style as Style)) || weight) {
    args.preferences = {
      ...(colors ? { colors: colors.split(',').filter(Boolean) } : {}),
      ...(style && STYLES.includes(style as Style) ? { style: style as Style } : {}),
      ...(weight ? { prioritizeWeight: true } : {}),
    };
  }
  const limit = numberParam(params.get('limit'));
  if (limit !== undefined && Number.isInteger(limit) && limit >= 1 && limit <= 24) {
    args.limit = limit;
  }
  return args;
}

export function argsToParams(args: SearchArgs): URLSearchParams {
  const params = new URLSearchParams();
  if (args.category) params.set('category', args.category);
  if (args.discipline) params.set('discipline', args.discipline);
  if (args.terrain) params.set('terrain', args.terrain);
  if (args.kind) params.set('kind', args.kind);
  if (args.maxPriceUsd !== undefined) params.set('maxPrice', String(args.maxPriceUsd));
  if (args.riderHeightCm !== undefined) params.set('height', String(args.riderHeightCm));
  if (args.minRangeKm !== undefined) params.set('minRange', String(args.minRangeKm));
  if (args.compatibleWithProductId) params.set('compat', args.compatibleWithProductId);
  if (args.inStockOnly === false) params.set('stock', 'all');
  if (args.preferences?.colors?.length) params.set('colors', args.preferences.colors.join(','));
  if (args.preferences?.style) params.set('style', args.preferences.style);
  if (args.preferences?.prioritizeWeight) params.set('sort', 'weight');
  if (args.limit !== undefined) params.set('limit', String(args.limit));
  return params;
}

/** Canonical string for arg equality (skip refetch when the bridge delivered the result). */
export function argsKey(args: SearchArgs): string {
  const p = argsToParams(args);
  p.sort();
  return p.toString();
}

function numberParam(value: string | null): number | undefined {
  if (value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}
