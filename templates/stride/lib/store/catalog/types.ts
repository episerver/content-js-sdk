/**
 * Catalog schema — contracts.md §1 (normative).
 * Pure types + shared constants; no runtime dependencies, safe for client import.
 */

/** Stable kebab-case id, doubles as the URL slug. Pattern ^[a-z0-9]+(-[a-z0-9]+)*$, 3–24 chars. */
export type ProductId = string;

export const PRODUCT_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const PRODUCT_ID_MIN = 3;
export const PRODUCT_ID_MAX = 24;

export type Discipline = 'road' | 'gravel' | 'commuter' | 'mountain' | 'e-bike';
export type Terrain = 'paved' | 'mixed' | 'trail';
export type AccessoryKind = 'helmet' | 'lock' | 'lights';
export type FrameSize = '48' | '50' | '52' | '54' | '56' | '58' | '60' | '62';
export type Mount = 'rack' | 'light-mount' | 'frame-mount';
export type Style = 'sport' | 'classic' | 'urban';

export const DISCIPLINES: Discipline[] = ['road', 'gravel', 'commuter', 'mountain', 'e-bike'];
export const TERRAINS: Terrain[] = ['paved', 'mixed', 'trail'];
export const ACCESSORY_KINDS: AccessoryKind[] = ['helmet', 'lock', 'lights'];
export const FRAME_SIZES: FrameSize[] = ['48', '50', '52', '54', '56', '58', '60', '62'];
export const MOUNTS: Mount[] = ['rack', 'light-mount', 'frame-mount'];
export const STYLES: Style[] = ['sport', 'classic', 'urban'];

export interface ProductBase {
  id: ProductId;
  name: string;
  description: string; // 1–2 sentences, real copy
  priceUsd: number; // 2 decimals max
  weightKg: number;
  colors: string[]; // lowercase color words
  style: Style;
  inStock: boolean;
  imageHue: number; // 0–359, deterministic product visual
}

export interface SizingRow {
  frameSize: FrameSize;
  riderHeightMinCm: number;
  riderHeightMaxCm: number;
}

export interface Bike extends ProductBase {
  category: 'bike';
  discipline: Discipline;
  terrains: Terrain[]; // non-empty
  sizing: SizingRow[]; // non-empty, non-overlapping, ascending
  variants: { frameSize: FrameSize; inStock: boolean }[]; // ⊆ sizing frame sizes
  mounts: Mount[];
  rangeKm?: number; // REQUIRED iff discipline === 'e-bike', else forbidden
}

export interface Accessory extends ProductBase {
  category: 'accessory';
  kind: AccessoryKind;
  compatibleDisciplines: Discipline[]; // non-empty
  requiresMount?: Mount; // absent = universal fit
}

export type Product = Bike | Accessory;

export interface Catalog {
  products: readonly Product[];
}

/**
 * Compatibility rule (single definition, used by search, cart, and tests):
 * accessory `a` is compatible with bike `b` ⇔
 * b.discipline ∈ a.compatibleDisciplines && (!a.requiresMount || a.requiresMount ∈ b.mounts)
 */
export function isCompatible(a: Accessory, b: Bike): boolean {
  return (
    a.compatibleDisciplines.includes(b.discipline) &&
    (!a.requiresMount || b.mounts.includes(a.requiresMount))
  );
}
