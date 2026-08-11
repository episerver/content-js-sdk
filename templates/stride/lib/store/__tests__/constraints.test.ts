import { describe, expect, it } from 'vitest';
import { searchProducts } from '../domain';

const ids = (r: ReturnType<typeof searchProducts>) => r.matches.map(m => m.product.id);

describe('hard constraints exclude (acceptance 4)', () => {
  it('category filters to one category', () => {
    const bikes = searchProducts({ category: 'bike', limit: 24 });
    expect(bikes.matches.every(m => m.product.category === 'bike')).toBe(true);
    expect(bikes.matches.every(m => m.reasonCodes.includes('HARD_CATEGORY'))).toBe(true);
    const accessories = searchProducts({ category: 'accessory', limit: 24 });
    expect(accessories.matches.every(m => m.product.category === 'accessory')).toBe(true);
  });

  it('discipline excludes other disciplines', () => {
    const r = searchProducts({ category: 'bike', discipline: 'gravel', limit: 24 });
    expect(ids(r)).toEqual(
      expect.arrayContaining(['ridgeline-carbon', 'sierra-alloy-gs', 'drift-ti-explorer']),
    );
    expect(ids(r)).not.toContain('aero-strada-rs');
  });

  it('terrain excludes bikes without it (and all accessories)', () => {
    const r = searchProducts({ terrain: 'trail', limit: 24 });
    expect(r.matches.every(m => m.product.category === 'bike')).toBe(true);
    expect(ids(r)).not.toContain('metroline-8'); // paved-only commuter
    expect(ids(r)).toContain('summit-trail-29');
  });

  it('kind excludes other kinds and all bikes', () => {
    const r = searchProducts({ kind: 'lock', limit: 24 });
    expect(r.matches.every(m => m.product.category === 'accessory' && m.product.kind === 'lock')).toBe(
      true,
    );
  });

  it('budget excludes above maxPriceUsd', () => {
    const r = searchProducts({ category: 'bike', discipline: 'gravel', maxPriceUsd: 2600, limit: 24 });
    expect(ids(r)).not.toContain('drift-ti-explorer'); // $3,499
    expect(ids(r)).toEqual(expect.arrayContaining(['ridgeline-carbon', 'sierra-alloy-gs']));
    expect(r.matches.every(m => m.reasonCodes.includes('HARD_BUDGET'))).toBe(true);
  });

  it('rider fit excludes bikes without an in-stock size for the height', () => {
    // 178 cm → size 56; paceline-105 lists 56 but that variant is out of stock.
    const r = searchProducts({ category: 'bike', riderHeightCm: 178, limit: 24 });
    expect(ids(r)).not.toContain('paceline-105');
    expect(ids(r)).toContain('ridgeline-carbon');
    for (const m of r.matches) {
      expect(m.recommendedFrameSize).toBe('56');
      expect(m.reasonCodes).toContain('HARD_FIT');
    }
    // 199 cm fits no sizing row of any bike → zero bikes.
    expect(searchProducts({ category: 'bike', riderHeightCm: 199 }).total).toBe(0);
  });

  it('e-bike range excludes shorter-range e-bikes and everything without rangeKm', () => {
    const r = searchProducts({ minRangeKm: 80, limit: 24 });
    expect(ids(r)).toEqual(['volt-commute-9']); // pulse-ebike-45 has 70 km; others have none
    expect(r.matches[0].reasonCodes).toContain('HARD_RANGE');
  });

  it('accessory compatibility excludes wrong discipline and missing mounts', () => {
    const forGravel = searchProducts({ compatibleWithProductId: 'ridgeline-carbon', limit: 24 });
    expect(ids(forGravel)).not.toContain('orbit-clip-light'); // commuter-only
    expect(ids(forGravel)).toContain('lumen-pro-lights'); // light-mount present on the bike
    const forEBike = searchProducts({ compatibleWithProductId: 'volt-commute-9', limit: 24 });
    expect(ids(forEBike)).not.toContain('lumen-pro-lights'); // volt has no light-mount
    expect(ids(forEBike)).not.toContain('vela-allroad-helmet'); // road/gravel only
    expect(ids(forEBike)).toContain('bastion-chain-lock'); // universal
  });

  it('stock excludes by default; inStockOnly false includes', () => {
    const def = searchProducts({ category: 'bike', limit: 24 });
    expect(ids(def)).not.toContain('boulder-hardtail');
    const all = searchProducts({ category: 'bike', inStockOnly: false, limit: 24 });
    expect(ids(all)).toContain('boulder-hardtail');
  });

  it('unknown args and bad values are INVALID_ARGS', () => {
    expect(() => searchProducts({ nope: true } as never)).toThrowError(/unknown search argument/);
    expect(() => searchProducts({ limit: 25 })).toThrowError(/limit/);
    expect(() =>
      searchProducts({ compatibleWithProductId: 'not-a-product' }),
    ).toThrowError(/unknown product/);
  });
});

describe('soft preferences reorder (acceptance 4)', () => {
  it('without preferences, gravel bikes order by price asc', () => {
    const r = searchProducts({ category: 'bike', discipline: 'gravel', maxPriceUsd: 2600 });
    expect(ids(r)).toEqual(['sierra-alloy-gs', 'ridgeline-carbon']);
    expect(r.matches[1].reasonCodes).toContain('TIE_PRICE');
  });

  it('prioritizeWeight puts the lighter bike first', () => {
    const r = searchProducts({
      category: 'bike',
      discipline: 'gravel',
      maxPriceUsd: 2600,
      preferences: { prioritizeWeight: true },
    });
    expect(ids(r)).toEqual(['ridgeline-carbon', 'sierra-alloy-gs']); // 9.4 kg before 10.6 kg
    expect(r.matches[0].reasonCodes).toContain('SOFT_WEIGHT');
  });

  it('color preference lifts matching products', () => {
    const without = searchProducts({ category: 'bike', discipline: 'gravel', maxPriceUsd: 2600 });
    expect(ids(without)[0]).toBe('sierra-alloy-gs');
    const withColor = searchProducts({
      category: 'bike',
      discipline: 'gravel',
      maxPriceUsd: 2600,
      preferences: { colors: ['olive'] },
    });
    expect(ids(withColor)[0]).toBe('ridgeline-carbon'); // olive colorway wins the soft score
    expect(withColor.matches[0].reasonCodes).toContain('SOFT_COLOR');
  });

  it('style preference lifts matching products', () => {
    const r = searchProducts({
      category: 'bike',
      discipline: 'road',
      preferences: { style: 'classic' },
    });
    // classic road bikes (paceline-105, corsa-endurance) outrank sport aero-strada-rs
    expect(ids(r).indexOf('aero-strada-rs')).toBe(2);
    expect(r.matches[0].reasonCodes).toContain('SOFT_STYLE');
  });
});
