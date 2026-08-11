import { describe, expect, it } from 'vitest';
import { searchProducts } from '../domain';
import type { SearchArgs } from '../domain';

describe('engine determinism (acceptance 3)', () => {
  const argSets: SearchArgs[] = [
    {},
    { category: 'bike', discipline: 'gravel', maxPriceUsd: 2600, riderHeightCm: 178 },
    {
      category: 'bike',
      preferences: { colors: ['black'], style: 'sport', prioritizeWeight: true },
    },
    { category: 'accessory', compatibleWithProductId: 'ridgeline-carbon' },
    { inStockOnly: false, limit: 24 },
  ];

  it('same args → byte-identical result order and reason codes across 10 runs', () => {
    for (const args of argSets) {
      const first = JSON.stringify(searchProducts(args));
      for (let run = 0; run < 9; run++) {
        expect(JSON.stringify(searchProducts(args))).toBe(first);
      }
    }
  });

  it('ranks are stable and 1-based', () => {
    const { matches } = searchProducts({ category: 'bike' });
    matches.forEach((m, i) => expect(m.rank).toBe(i + 1));
  });
});
