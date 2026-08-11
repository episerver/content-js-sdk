/**
 * Domain layer — contracts.md §2 public surface.
 *
 * Pure/deterministic over (catalog, StoreState, args). The engine itself is
 * catalog-parameterized (`engine.ts`) so the build-time validator can prove
 * demo-fixture solvability with the exact same code; this module binds it to
 * the fixture catalog and exposes the §2 signatures.
 */
import { PRODUCTS } from './catalog/fixtures';
import type { FrameSize, Product, ProductId } from './catalog/types';
import {
  addToCartIn,
  compareCatalog,
  getCartView,
  removeFromCartIn,
  searchCatalog,
  updateCartItemIn,
} from './engine';
import type { Cart, Comparison, Mutated, SearchArgs, SearchResult, StoreState } from './engine';
import { freshState } from './codec';

export type {
  Cart,
  CartItem,
  CartMutationResult,
  Comparison,
  ComparisonDelta,
  ErrorCode,
  Match,
  Mutated,
  ReasonCode,
  SearchArgs,
  SearchResult,
  StoreError,
  StoreState,
} from './engine';
export { StoreErrorException, isStoreError, cartItemIdFor } from './engine';

export function searchProducts(args: SearchArgs): SearchResult {
  return searchCatalog(PRODUCTS, args);
}

export function compareProducts(ids: ProductId[], riderHeightCm?: number): Comparison {
  return compareCatalog(PRODUCTS, ids, riderHeightCm);
}

export function getCart(state: StoreState): Cart {
  return getCartView(PRODUCTS, state);
}

export function addToCart(
  state: StoreState,
  item: { productId: ProductId; frameSize?: FrameSize; quantity?: number },
  idempotencyKey: string,
): Mutated {
  return addToCartIn(PRODUCTS, state, item, idempotencyKey);
}

export function updateCartItem(
  state: StoreState,
  cartItemId: string,
  quantity: number,
  idempotencyKey: string,
): Mutated {
  return updateCartItemIn(PRODUCTS, state, cartItemId, quantity, idempotencyKey);
}

export function removeFromCart(
  state: StoreState,
  cartItemId: string,
  idempotencyKey: string,
): Mutated {
  return removeFromCartIn(PRODUCTS, state, cartItemId, idempotencyKey);
}

/** Reset demo: fresh sessionId, empty cart + ledger; telemetry NOT touched. */
export function resetSession(): StoreState {
  return freshState();
}

export function getProductById(id: ProductId): Product | undefined {
  return PRODUCTS.find(p => p.id === id);
}
