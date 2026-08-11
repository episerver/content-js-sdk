/**
 * Deterministic store engine — contracts.md §2, catalog-parameterized.
 *
 * Every function here is pure over (products, StoreState, args). `domain.ts`
 * binds these to the fixture catalog and exposes the exact §2 signatures.
 * The catalog validator (`catalog/validate.ts`) calls the same functions to
 * prove demo-fixture solvability with the real engine — no second engine.
 */
import type {
  AccessoryKind,
  Bike,
  Discipline,
  FrameSize,
  Product,
  ProductId,
  Style,
  Terrain,
} from './catalog/types';
import {
  ACCESSORY_KINDS,
  DISCIPLINES,
  STYLES,
  TERRAINS,
  isCompatible,
} from './catalog/types';
import { digest8 } from './hash';

// ---------------------------------------------------------------------------
// State (contracts §2)
// ---------------------------------------------------------------------------

export interface StoreState {
  v: 1;
  sessionId: string; // EXACTLY 16 base64url chars, minted server-side
  cart: { items: { productId: ProductId; frameSize?: FrameSize; quantity: number }[] };
  ledger: { key: string; argsHash: string }[]; // key 8–64 chars; argsHash = digest8
}

export const CART_MAX_DISTINCT_ITEMS = 20;
export const CART_MAX_QUANTITY = 9;
export const LEDGER_MAX_KEYS = 20;
export const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._-]+$/;
export const IDEMPOTENCY_KEY_MIN = 8;
export const IDEMPOTENCY_KEY_MAX = 64;

// ---------------------------------------------------------------------------
// Errors (contracts §2)
// ---------------------------------------------------------------------------

export type ErrorCode =
  | 'INVALID_ARGS'
  | 'PRODUCT_NOT_FOUND'
  | 'VARIANT_UNAVAILABLE'
  | 'OUT_OF_STOCK'
  | 'CART_ITEM_NOT_FOUND'
  | 'CART_LIMIT'
  | 'COMPARE_ARITY'
  | 'COMPARE_NOT_A_BIKE'
  | 'IDEMPOTENCY_KEY_REQUIRED'
  | 'IDEMPOTENCY_CONFLICT'
  | 'IDEMPOTENCY_LEDGER_FULL'
  | 'BRIDGE_UNAVAILABLE';

export interface StoreError {
  code: ErrorCode;
  message: string;
  hint: string;
}

/** Thrown by domain functions; the API layer maps it onto §3 status codes. */
export class StoreErrorException extends Error {
  readonly code: ErrorCode;
  readonly hint: string;
  constructor(code: ErrorCode, message: string, hint: string) {
    super(message);
    this.name = 'StoreErrorException';
    this.code = code;
    this.hint = hint;
  }
  toJSON(): StoreError {
    return { code: this.code, message: this.message, hint: this.hint };
  }
}

export function isStoreError(e: unknown): e is StoreErrorException {
  return e instanceof StoreErrorException;
}

function fail(code: ErrorCode, message: string, hint: string): never {
  throw new StoreErrorException(code, message, hint);
}

export const LEDGER_FULL_HINT =
  'idempotency ledger full for this session — use Reset demo to start a fresh session';

// ---------------------------------------------------------------------------
// Search (contracts §2)
// ---------------------------------------------------------------------------

export interface SearchArgs {
  category?: 'bike' | 'accessory';
  discipline?: Discipline;
  terrain?: Terrain;
  kind?: AccessoryKind;
  maxPriceUsd?: number;
  riderHeightCm?: number; // hard fit: bike must have an in-stock size matching height
  minRangeKm?: number; // hard; only meaningful with e-bikes
  compatibleWithProductId?: ProductId; // hard: accessories compatible with that bike
  inStockOnly?: boolean; // default true
  preferences?: { colors?: string[]; style?: Style; prioritizeWeight?: boolean };
  limit?: number; // default 12, max 24
}

export type ReasonCode =
  | 'HARD_CATEGORY'
  | 'HARD_DISCIPLINE'
  | 'HARD_TERRAIN'
  | 'HARD_KIND'
  | 'HARD_BUDGET'
  | 'HARD_FIT'
  | 'HARD_RANGE'
  | 'HARD_COMPAT'
  | 'HARD_STOCK'
  | 'SOFT_COLOR'
  | 'SOFT_STYLE'
  | 'SOFT_WEIGHT'
  | 'TIE_PRICE'
  | 'TIE_ID'
  | 'DELTA_LIGHTER'
  | 'DELTA_CHEAPER'
  | 'DELTA_RANGE_LONGER'
  | 'DELTA_FIT_BETTER';

export interface Match {
  product: Product;
  rank: number; // 1-based, stable
  recommendedFrameSize?: FrameSize; // when riderHeightCm given and product is a bike
  reasonCodes: ReasonCode[];
}

export interface SearchResult {
  matches: Match[];
  total: number;
  args: SearchArgs;
}

const SEARCH_ARG_KEYS = new Set([
  'category',
  'discipline',
  'terrain',
  'kind',
  'maxPriceUsd',
  'riderHeightCm',
  'minRangeKm',
  'compatibleWithProductId',
  'inStockOnly',
  'preferences',
  'limit',
]);
const PREFERENCE_KEYS = new Set(['colors', 'style', 'prioritizeWeight']);

function invalidArg(message: string, hint: string): never {
  fail('INVALID_ARGS', message, hint);
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function validateSearchArgs(products: readonly Product[], args: SearchArgs): void {
  if (args === null || typeof args !== 'object' || Array.isArray(args)) {
    invalidArg('search args must be an object', 'pass a JSON object matching SearchArgs');
  }
  for (const key of Object.keys(args)) {
    if (!SEARCH_ARG_KEYS.has(key)) {
      invalidArg(`unknown search argument "${key}"`, `allowed: ${[...SEARCH_ARG_KEYS].join(', ')}`);
    }
  }
  if (args.category !== undefined && args.category !== 'bike' && args.category !== 'accessory') {
    invalidArg(`invalid category "${args.category}"`, 'allowed: bike, accessory');
  }
  if (args.discipline !== undefined && !DISCIPLINES.includes(args.discipline)) {
    invalidArg(`invalid discipline "${args.discipline}"`, `allowed: ${DISCIPLINES.join(', ')}`);
  }
  if (args.terrain !== undefined && !TERRAINS.includes(args.terrain)) {
    invalidArg(`invalid terrain "${args.terrain}"`, `allowed: ${TERRAINS.join(', ')}`);
  }
  if (args.kind !== undefined && !ACCESSORY_KINDS.includes(args.kind)) {
    invalidArg(`invalid kind "${args.kind}"`, `allowed: ${ACCESSORY_KINDS.join(', ')}`);
  }
  for (const numKey of ['maxPriceUsd', 'riderHeightCm', 'minRangeKm'] as const) {
    const v = args[numKey];
    if (v !== undefined && (!isFiniteNumber(v) || v < 0)) {
      invalidArg(`${numKey} must be a non-negative number`, `got: ${JSON.stringify(v)}`);
    }
  }
  if (args.inStockOnly !== undefined && typeof args.inStockOnly !== 'boolean') {
    invalidArg('inStockOnly must be a boolean', 'pass true or false');
  }
  if (args.limit !== undefined) {
    if (!Number.isInteger(args.limit) || args.limit < 1 || args.limit > 24) {
      invalidArg('limit must be an integer between 1 and 24', 'default is 12, max is 24');
    }
  }
  if (args.preferences !== undefined) {
    const p = args.preferences;
    if (p === null || typeof p !== 'object' || Array.isArray(p)) {
      invalidArg('preferences must be an object', 'shape: { colors?, style?, prioritizeWeight? }');
    }
    for (const key of Object.keys(p)) {
      if (!PREFERENCE_KEYS.has(key)) {
        invalidArg(`unknown preference "${key}"`, `allowed: ${[...PREFERENCE_KEYS].join(', ')}`);
      }
    }
    if (p.colors !== undefined && (!Array.isArray(p.colors) || p.colors.some(c => typeof c !== 'string'))) {
      invalidArg('preferences.colors must be an array of strings', 'e.g. ["black", "teal"]');
    }
    if (p.style !== undefined && !STYLES.includes(p.style)) {
      invalidArg(`invalid preferences.style "${p.style}"`, `allowed: ${STYLES.join(', ')}`);
    }
    if (p.prioritizeWeight !== undefined && typeof p.prioritizeWeight !== 'boolean') {
      invalidArg('preferences.prioritizeWeight must be a boolean', 'pass true or false');
    }
  }
  if (args.compatibleWithProductId !== undefined) {
    const target = products.find(p => p.id === args.compatibleWithProductId);
    if (!target) {
      invalidArg(
        `unknown product "${args.compatibleWithProductId}" for compatibleWithProductId`,
        'use a bike id from the catalog (search category "bike" first)',
      );
    }
    if (target.category !== 'bike') {
      invalidArg(
        `compatibleWithProductId must reference a bike; "${target.id}" is an accessory`,
        'pass the id of the bike the accessory should fit',
      );
    }
  }
}

/** The sizing row covering a rider height, if any (rows are non-overlapping). */
export function fitSizeFor(bike: Bike, riderHeightCm: number): FrameSize | undefined {
  const row = bike.sizing.find(
    r => riderHeightCm >= r.riderHeightMinCm && riderHeightCm <= r.riderHeightMaxCm,
  );
  return row?.frameSize;
}

function hasInStockFit(bike: Bike, riderHeightCm: number): FrameSize | undefined {
  const size = fitSizeFor(bike, riderHeightCm);
  if (!size) return undefined;
  const variant = bike.variants.find(v => v.frameSize === size);
  return variant?.inStock ? size : undefined;
}

function productInStock(product: Product): boolean {
  if (!product.inStock) return false;
  if (product.category === 'bike') return product.variants.some(v => v.inStock);
  return true;
}

interface Ranked {
  product: Product;
  hardCodes: ReasonCode[];
  softCodes: ReasonCode[];
  softScore: number;
  recommendedFrameSize?: FrameSize;
}

export function searchCatalog(products: readonly Product[], args: SearchArgs): SearchResult {
  validateSearchArgs(products, args);

  const inStockOnly = args.inStockOnly ?? true;
  const limit = args.limit ?? 12;
  const prefs = args.preferences ?? {};
  const prefColors = (prefs.colors ?? []).map(c => c.toLowerCase());
  const compatBike =
    args.compatibleWithProductId !== undefined
      ? (products.find(p => p.id === args.compatibleWithProductId) as Bike)
      : undefined;

  const survivors: Ranked[] = [];

  for (const product of products) {
    const hardCodes: ReasonCode[] = [];
    let recommendedFrameSize: FrameSize | undefined;

    if (args.category !== undefined) {
      if (product.category !== args.category) continue;
      hardCodes.push('HARD_CATEGORY');
    }
    if (args.discipline !== undefined) {
      if (product.category === 'bike') {
        if (product.discipline !== args.discipline) continue;
      } else if (!product.compatibleDisciplines.includes(args.discipline)) {
        continue;
      }
      hardCodes.push('HARD_DISCIPLINE');
    }
    if (args.terrain !== undefined) {
      // Terrain is a bike attribute; accessories cannot satisfy a terrain constraint.
      if (product.category !== 'bike' || !product.terrains.includes(args.terrain)) continue;
      hardCodes.push('HARD_TERRAIN');
    }
    if (args.kind !== undefined) {
      if (product.category !== 'accessory' || product.kind !== args.kind) continue;
      hardCodes.push('HARD_KIND');
    }
    if (args.maxPriceUsd !== undefined) {
      if (product.priceUsd > args.maxPriceUsd) continue;
      hardCodes.push('HARD_BUDGET');
    }
    if (args.riderHeightCm !== undefined && product.category === 'bike') {
      const size = hasInStockFit(product, args.riderHeightCm);
      if (!size) continue;
      recommendedFrameSize = size;
      hardCodes.push('HARD_FIT');
    }
    if (args.minRangeKm !== undefined) {
      // Only e-bikes carry rangeKm; everything else fails the hard range constraint.
      if (product.category !== 'bike' || product.rangeKm === undefined) continue;
      if (product.rangeKm < args.minRangeKm) continue;
      hardCodes.push('HARD_RANGE');
    }
    if (compatBike !== undefined) {
      if (product.category !== 'accessory' || !isCompatible(product, compatBike)) continue;
      hardCodes.push('HARD_COMPAT');
    }
    if (inStockOnly) {
      if (!productInStock(product)) continue;
      hardCodes.push('HARD_STOCK');
    }

    const softCodes: ReasonCode[] = [];
    if (prefColors.length > 0 && product.colors.some(c => prefColors.includes(c.toLowerCase()))) {
      softCodes.push('SOFT_COLOR');
    }
    if (prefs.style !== undefined && product.style === prefs.style) {
      softCodes.push('SOFT_STYLE');
    }
    if (prefs.prioritizeWeight) {
      softCodes.push('SOFT_WEIGHT'); // weight participates in this product's ordering
    }

    survivors.push({
      product,
      hardCodes,
      softCodes,
      softScore: softCodes.filter(c => c === 'SOFT_COLOR' || c === 'SOFT_STYLE').length,
      recommendedFrameSize,
    });
  }

  // Normative deterministic ordering: soft score desc → weightKg asc (when
  // prioritizeWeight) → priceUsd asc → id asc.
  const prioritizeWeight = prefs.prioritizeWeight === true;
  survivors.sort((a, b) => {
    if (a.softScore !== b.softScore) return b.softScore - a.softScore;
    if (prioritizeWeight && a.product.weightKg !== b.product.weightKg) {
      return a.product.weightKg - b.product.weightKg;
    }
    if (a.product.priceUsd !== b.product.priceUsd) return a.product.priceUsd - b.product.priceUsd;
    return a.product.id < b.product.id ? -1 : 1;
  });

  const matches: Match[] = survivors.slice(0, limit).map((s, i) => {
    const reasonCodes: ReasonCode[] = [...s.hardCodes, ...s.softCodes];
    if (i > 0) {
      // Record the tiebreak comparator that actually separated this item
      // from its predecessor in the final order.
      const prev = survivors[i - 1];
      if (prev.softScore === s.softScore) {
        const weightDecided =
          prioritizeWeight && prev.product.weightKg !== s.product.weightKg;
        if (!weightDecided) {
          if (prev.product.priceUsd !== s.product.priceUsd) reasonCodes.push('TIE_PRICE');
          else reasonCodes.push('TIE_ID');
        }
      }
    }
    return {
      product: s.product,
      rank: i + 1,
      ...(s.recommendedFrameSize !== undefined
        ? { recommendedFrameSize: s.recommendedFrameSize }
        : {}),
      reasonCodes,
    };
  });

  return { matches, total: survivors.length, args };
}

// ---------------------------------------------------------------------------
// Compare (contracts §2)
// ---------------------------------------------------------------------------

export interface ComparisonDelta {
  field: 'priceUsd' | 'weightKg' | 'rangeKm' | 'fit';
  values: Record<ProductId, number | string | null>;
  bestId?: ProductId;
  reasonCode?: ReasonCode;
}

export interface Comparison {
  products: Product[];
  deltas: ComparisonDelta[];
  riderHeightCm?: number;
}

export function compareCatalog(
  products: readonly Product[],
  ids: ProductId[],
  riderHeightCm?: number,
): Comparison {
  if (!Array.isArray(ids) || ids.length < 2 || ids.length > 3) {
    fail(
      'COMPARE_ARITY',
      `compare requires 2 or 3 product ids, got ${Array.isArray(ids) ? ids.length : 0}`,
      'pass ids as 2–3 bike ids, e.g. ids=ridgeline-carbon,sierra-alloy-gs',
    );
  }
  if (new Set(ids).size !== ids.length) {
    fail('COMPARE_ARITY', 'compare ids must be distinct', 'remove the duplicated id');
  }
  if (riderHeightCm !== undefined && (!isFiniteNumber(riderHeightCm) || riderHeightCm < 0)) {
    invalidArg('riderHeightCm must be a non-negative number', `got: ${JSON.stringify(riderHeightCm)}`);
  }

  const bikes: Bike[] = ids.map(id => {
    const product = products.find(p => p.id === id);
    if (!product) {
      fail('PRODUCT_NOT_FOUND', `no product with id "${id}"`, 'use ids returned by search_products');
    }
    if (product.category !== 'bike') {
      fail(
        'COMPARE_NOT_A_BIKE',
        `"${id}" is an accessory — comparison is bikes-only`,
        'pass only bike ids (search with category "bike")',
      );
    }
    return product;
  });

  const deltas: ComparisonDelta[] = [];

  const priceValues: Record<ProductId, number> = {};
  for (const b of bikes) priceValues[b.id] = b.priceUsd;
  deltas.push(withBest({ field: 'priceUsd', values: priceValues }, bikes, b => b.priceUsd, 'min', 'DELTA_CHEAPER'));

  const weightValues: Record<ProductId, number> = {};
  for (const b of bikes) weightValues[b.id] = b.weightKg;
  deltas.push(withBest({ field: 'weightKg', values: weightValues }, bikes, b => b.weightKg, 'min', 'DELTA_LIGHTER'));

  if (bikes.some(b => b.rangeKm !== undefined)) {
    const rangeValues: Record<ProductId, number | null> = {};
    for (const b of bikes) rangeValues[b.id] = b.rangeKm ?? null;
    deltas.push(
      withBest(
        { field: 'rangeKm', values: rangeValues },
        bikes.filter(b => b.rangeKm !== undefined),
        b => b.rangeKm as number,
        'max',
        'DELTA_RANGE_LONGER',
      ),
    );
  }

  if (riderHeightCm !== undefined) {
    const fitValues: Record<ProductId, string | null> = {};
    const candidates: { bike: Bike; distance: number }[] = [];
    for (const b of bikes) {
      const size = hasInStockFit(b, riderHeightCm);
      fitValues[b.id] = size ?? null;
      if (size) {
        const row = b.sizing.find(r => r.frameSize === size)!;
        const mid = (row.riderHeightMinCm + row.riderHeightMaxCm) / 2;
        candidates.push({ bike: b, distance: Math.abs(riderHeightCm - mid) });
      }
    }
    const delta: ComparisonDelta = { field: 'fit', values: fitValues };
    if (candidates.length > 0) {
      candidates.sort(
        (a, b) =>
          a.distance - b.distance ||
          a.bike.priceUsd - b.bike.priceUsd ||
          (a.bike.id < b.bike.id ? -1 : 1),
      );
      const best = candidates[0];
      const uniquelyBest =
        candidates.length === 1 || candidates[1].distance > best.distance || candidates.length < bikes.length;
      if (uniquelyBest) {
        delta.bestId = best.bike.id;
        delta.reasonCode = 'DELTA_FIT_BETTER';
      }
    }
    deltas.push(delta);
  }

  const comparison: Comparison = { products: bikes, deltas };
  if (riderHeightCm !== undefined) comparison.riderHeightCm = riderHeightCm;
  return comparison;
}

function withBest(
  delta: ComparisonDelta,
  bikes: Bike[],
  value: (b: Bike) => number,
  direction: 'min' | 'max',
  reasonCode: ReasonCode,
): ComparisonDelta {
  if (bikes.length === 0) return delta;
  const sorted = [...bikes].sort((a, b) =>
    direction === 'min' ? value(a) - value(b) : value(b) - value(a),
  );
  if (sorted.length === 1 || value(sorted[0]) !== value(sorted[1])) {
    delta.bestId = sorted[0].id;
    delta.reasonCode = reasonCode;
  }
  return delta;
}

// ---------------------------------------------------------------------------
// Cart (contracts §2)
// ---------------------------------------------------------------------------

export interface CartItem {
  cartItemId: string; // `${productId}` or `${productId}:${frameSize}`
  productId: ProductId;
  name: string;
  frameSize?: FrameSize;
  quantity: number;
  unitPriceUsd: number;
  lineTotalUsd: number;
}

export interface Cart {
  sessionId: string;
  items: CartItem[];
  itemCount: number;
  subtotalUsd: number;
}

export interface CartMutationResult {
  cart: Cart;
  changed: CartItem | { cartItemId: string; removed: true };
  replayed: boolean;
}

export type Mutated = { result: CartMutationResult; state: StoreState };

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function cartItemIdFor(productId: ProductId, frameSize?: FrameSize): string {
  return frameSize ? `${productId}:${frameSize}` : productId;
}

export function getCartView(products: readonly Product[], state: StoreState): Cart {
  const items: CartItem[] = [];
  for (const entry of state.cart.items) {
    const product = products.find(p => p.id === entry.productId);
    if (!product) continue; // catalog is static; guard against a stale cookie anyway
    const lineTotal = round2(product.priceUsd * entry.quantity);
    items.push({
      cartItemId: cartItemIdFor(entry.productId, entry.frameSize),
      productId: entry.productId,
      name: product.name,
      ...(entry.frameSize !== undefined ? { frameSize: entry.frameSize } : {}),
      quantity: entry.quantity,
      unitPriceUsd: product.priceUsd,
      lineTotalUsd: lineTotal,
    });
  }
  return {
    sessionId: state.sessionId,
    items,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotalUsd: round2(items.reduce((sum, i) => sum + i.lineTotalUsd, 0)),
  };
}

// --- idempotency ledger -----------------------------------------------------

function validateIdempotencyKey(key: unknown): asserts key is string {
  if (typeof key !== 'string' || key.length === 0) {
    fail(
      'IDEMPOTENCY_KEY_REQUIRED',
      'mutations require a caller-supplied idempotency key',
      'send the Idempotency-Key header (8–64 chars of A-Za-z0-9._-, e.g. a UUID) and reuse it verbatim on retry',
    );
  }
  if (
    key.length < IDEMPOTENCY_KEY_MIN ||
    key.length > IDEMPOTENCY_KEY_MAX ||
    !IDEMPOTENCY_KEY_PATTERN.test(key)
  ) {
    invalidArg(
      `invalid idempotency key "${key}"`,
      'keys are 8–64 chars matching ^[A-Za-z0-9._-]+$ (a UUID fits; strip nothing on retry)',
    );
  }
}

type LedgerDecision = { kind: 'new' } | { kind: 'replay' };

function consultLedger(state: StoreState, key: string, argsHash: string): LedgerDecision {
  const existing = state.ledger.find(e => e.key === key);
  if (existing) {
    if (existing.argsHash !== argsHash) {
      fail(
        'IDEMPOTENCY_CONFLICT',
        `idempotency key "${key}" was already used with different arguments`,
        'use a fresh key for a new operation; reuse a key only to retry the identical call',
      );
    }
    return { kind: 'replay' };
  }
  if (state.ledger.length >= LEDGER_MAX_KEYS) {
    fail(
      'IDEMPOTENCY_LEDGER_FULL',
      `this session already recorded ${LEDGER_MAX_KEYS} idempotency keys`,
      LEDGER_FULL_HINT,
    );
  }
  return { kind: 'new' };
}

function replayResult(
  products: readonly Product[],
  state: StoreState,
  cartItemId: string,
): CartMutationResult {
  const cart = getCartView(products, state);
  const item = cart.items.find(i => i.cartItemId === cartItemId);
  return {
    cart,
    changed: item ?? { cartItemId, removed: true },
    replayed: true,
  };
}

// --- mutations ---------------------------------------------------------------

export function addToCartIn(
  products: readonly Product[],
  state: StoreState,
  item: { productId: ProductId; frameSize?: FrameSize; quantity?: number },
  idempotencyKey: string,
): Mutated {
  validateIdempotencyKey(idempotencyKey);
  if (item === null || typeof item !== 'object') {
    invalidArg('add_to_cart requires an item object', 'shape: { productId, frameSize?, quantity? }');
  }
  const quantity = item.quantity ?? 1;
  const normalizedArgs = {
    op: 'add_to_cart',
    productId: item.productId,
    frameSize: item.frameSize ?? null,
    quantity,
  };
  const argsHash = digest8(normalizedArgs);
  const decision = consultLedger(state, idempotencyKey, argsHash);
  const cartItemId = cartItemIdFor(item.productId, item.frameSize);
  if (decision.kind === 'replay') {
    return { result: replayResult(products, state, cartItemId), state };
  }

  if (typeof item.productId !== 'string' || item.productId.length === 0) {
    invalidArg('productId is required', 'pass a catalog product id, e.g. "ridgeline-carbon"');
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    invalidArg('quantity must be an integer ≥ 1', `got: ${JSON.stringify(item.quantity)}`);
  }
  const product = products.find(p => p.id === item.productId);
  if (!product) {
    fail(
      'PRODUCT_NOT_FOUND',
      `no product with id "${item.productId}"`,
      'use an id returned by search_products',
    );
  }
  if (!product.inStock) {
    fail('OUT_OF_STOCK', `${product.name} is out of stock`, 'search with inStockOnly true to see available products');
  }
  if (product.category === 'bike') {
    const inStockSizes = product.variants.filter(v => v.inStock).map(v => v.frameSize);
    if (item.frameSize === undefined) {
      invalidArg(
        `frameSize is required for bikes`,
        `pick an in-stock size for ${product.id}: ${inStockSizes.join(', ')}`,
      );
    }
    const variant = product.variants.find(v => v.frameSize === item.frameSize);
    if (!variant || !variant.inStock) {
      fail(
        'VARIANT_UNAVAILABLE',
        `size ${item.frameSize} unavailable for ${product.id}`,
        `size ${item.frameSize} unavailable for ${product.id}; in stock: ${inStockSizes.join(', ')}`,
      );
    }
  } else if (item.frameSize !== undefined) {
    invalidArg(
      `accessories have no frame sizes`,
      `omit frameSize for ${product.id}`,
    );
  }

  const items = state.cart.items.map(i => ({ ...i }));
  const existing = items.find(i => cartItemIdFor(i.productId, i.frameSize) === cartItemId);
  if (existing) {
    if (existing.quantity + quantity > CART_MAX_QUANTITY) {
      fail(
        'CART_LIMIT',
        `quantity for ${cartItemId} would exceed the cap of ${CART_MAX_QUANTITY}`,
        `cart already holds ${existing.quantity}; at most ${CART_MAX_QUANTITY - existing.quantity} more can be added`,
      );
    }
    existing.quantity += quantity;
  } else {
    if (items.length >= CART_MAX_DISTINCT_ITEMS) {
      fail(
        'CART_LIMIT',
        `cart holds at most ${CART_MAX_DISTINCT_ITEMS} distinct items`,
        'remove an item (remove_from_cart) before adding another',
      );
    }
    if (quantity > CART_MAX_QUANTITY) {
      fail(
        'CART_LIMIT',
        `quantity is capped at ${CART_MAX_QUANTITY} per item`,
        `pass quantity between 1 and ${CART_MAX_QUANTITY}`,
      );
    }
    items.push({
      productId: product.id,
      ...(item.frameSize !== undefined ? { frameSize: item.frameSize } : {}),
      quantity,
    });
  }

  const nextState: StoreState = {
    ...state,
    cart: { items },
    ledger: [...state.ledger, { key: idempotencyKey, argsHash }],
  };
  const cart = getCartView(products, nextState);
  return {
    result: {
      cart,
      changed: cart.items.find(i => i.cartItemId === cartItemId)!,
      replayed: false,
    },
    state: nextState,
  };
}

export function updateCartItemIn(
  products: readonly Product[],
  state: StoreState,
  cartItemId: string,
  quantity: number,
  idempotencyKey: string,
): Mutated {
  validateIdempotencyKey(idempotencyKey);
  const argsHash = digest8({ op: 'update_cart_item', cartItemId, quantity });
  const decision = consultLedger(state, idempotencyKey, argsHash);
  if (decision.kind === 'replay') {
    return { result: replayResult(products, state, cartItemId), state };
  }

  if (typeof cartItemId !== 'string' || cartItemId.length === 0) {
    invalidArg('cartItemId is required', 'use the cartItemId from get_cart');
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    invalidArg(
      'quantity must be an integer ≥ 1 (absolute)',
      'to remove an item entirely, call remove_from_cart instead',
    );
  }
  if (quantity > CART_MAX_QUANTITY) {
    fail(
      'CART_LIMIT',
      `quantity is capped at ${CART_MAX_QUANTITY} per item`,
      `pass quantity between 1 and ${CART_MAX_QUANTITY}`,
    );
  }
  const items = state.cart.items.map(i => ({ ...i }));
  const target = items.find(i => cartItemIdFor(i.productId, i.frameSize) === cartItemId);
  if (!target) {
    fail(
      'CART_ITEM_NOT_FOUND',
      `no cart item "${cartItemId}"`,
      `current cart item ids: ${items.map(i => cartItemIdFor(i.productId, i.frameSize)).join(', ') || '(cart is empty)'}`,
    );
  }
  target.quantity = quantity;

  const nextState: StoreState = {
    ...state,
    cart: { items },
    ledger: [...state.ledger, { key: idempotencyKey, argsHash }],
  };
  const cart = getCartView(products, nextState);
  return {
    result: {
      cart,
      changed: cart.items.find(i => i.cartItemId === cartItemId)!,
      replayed: false,
    },
    state: nextState,
  };
}

export function removeFromCartIn(
  products: readonly Product[],
  state: StoreState,
  cartItemId: string,
  idempotencyKey: string,
): Mutated {
  validateIdempotencyKey(idempotencyKey);
  const argsHash = digest8({ op: 'remove_from_cart', cartItemId });
  const decision = consultLedger(state, idempotencyKey, argsHash);
  if (decision.kind === 'replay') {
    return { result: replayResult(products, state, cartItemId), state };
  }

  if (typeof cartItemId !== 'string' || cartItemId.length === 0) {
    invalidArg('cartItemId is required', 'use the cartItemId from get_cart');
  }
  const before = state.cart.items;
  const items = before.filter(i => cartItemIdFor(i.productId, i.frameSize) !== cartItemId);
  if (items.length === before.length) {
    fail(
      'CART_ITEM_NOT_FOUND',
      `no cart item "${cartItemId}"`,
      `current cart item ids: ${before.map(i => cartItemIdFor(i.productId, i.frameSize)).join(', ') || '(cart is empty)'}`,
    );
  }

  const nextState: StoreState = {
    ...state,
    cart: { items: items.map(i => ({ ...i })) },
    ledger: [...state.ledger, { key: idempotencyKey, argsHash }],
  };
  return {
    result: {
      cart: getCartView(products, nextState),
      changed: { cartItemId, removed: true },
      replayed: false,
    },
    state: nextState,
  };
}
