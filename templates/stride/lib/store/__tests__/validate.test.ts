import { describe, expect, it } from 'vitest';
import { PRODUCTS } from '../catalog/fixtures';
import type { Accessory, Bike, Product } from '../catalog/types';
import { validateCatalog, validateDemoFixtures } from '../catalog/validate';

const clone = (): Product[] => structuredClone(PRODUCTS) as Product[];

describe('catalog structural validation (acceptance 1)', () => {
  it('the shipped fixture set validates', () => {
    expect(() => validateCatalog(clone())).not.toThrow();
    expect(() => validateDemoFixtures(clone())).not.toThrow();
  });

  it('a bike without a sizing table fails, naming the fixture', () => {
    const products = clone();
    const bike = products.find(p => p.id === 'ridgeline-carbon') as Bike;
    bike.sizing = [];
    expect(() => validateCatalog(products)).toThrowError(/ridgeline-carbon.*sizing/);
  });

  it('duplicate ids fail', () => {
    const products = clone();
    products[1].id = products[0].id;
    expect(() => validateCatalog(products)).toThrowError(/duplicate product id/);
  });

  it('out-of-bounds ids fail (pattern and length)', () => {
    const products = clone();
    products[0].id = 'Not-Kebab';
    expect(() => validateCatalog(products)).toThrowError(/kebab-case/);
    const products2 = clone();
    products2[0].id = 'a'.repeat(25);
    expect(() => validateCatalog(products2)).toThrowError(/3–24 chars/);
  });

  it('overlapping sizing rows fail', () => {
    const products = clone();
    const bike = products.find(p => p.id === 'sierra-alloy-gs') as Bike;
    bike.sizing[1].riderHeightMinCm = bike.sizing[0].riderHeightMaxCm; // shared boundary = overlap
    expect(() => validateCatalog(products)).toThrowError(/overlap/);
  });

  it('variants outside the sizing table fail', () => {
    const products = clone();
    const bike = products.find(p => p.id === 'aero-strada-rs') as Bike;
    bike.variants.push({ frameSize: '62', inStock: true });
    expect(() => validateCatalog(products)).toThrowError(/variant size 62 has no sizing row/);
  });

  it('rangeKm is required on e-bikes and forbidden elsewhere', () => {
    const products = clone();
    const ebike = products.find(p => p.id === 'volt-commute-9') as Bike;
    delete (ebike as { rangeKm?: number }).rangeKm;
    expect(() => validateCatalog(products)).toThrowError(/rangeKm is REQUIRED/);
    const products2 = clone();
    const road = products2.find(p => p.id === 'paceline-105') as Bike;
    (road as { rangeKm?: number }).rangeKm = 50;
    expect(() => validateCatalog(products2)).toThrowError(/rangeKm is forbidden/);
  });

  it('a requiresMount value with no bike carrying that mount fails', () => {
    const products = clone();
    for (const p of products) {
      if (p.category === 'bike') {
        (p as Bike).mounts = (p as Bike).mounts.filter(m => m !== 'light-mount');
      }
    }
    expect(() => validateCatalog(products)).toThrowError(/requiresMount "light-mount"/);
  });

  it('count and coverage rules are asserted', () => {
    const products = clone().slice(0, 23);
    expect(() => validateCatalog(products)).toThrowError(/12/);
  });
});

describe('demo-fixture solvability via the real engine (acceptance 1)', () => {
  it('breaking the primary workflow budget fails the gate', () => {
    const products = clone();
    for (const p of products) {
      if (p.category === 'bike' && (p as Bike).discipline === 'gravel') p.priceUsd = 2700;
    }
    expect(() => validateDemoFixtures(products)).toThrowError(/primary workflow/);
  });

  it('making every accessory e-bike-compatible fails the deviation-B rule', () => {
    const products = clone();
    for (const p of products) {
      if (p.category === 'accessory') {
        const a = p as Accessory;
        a.compatibleDisciplines = ['road', 'gravel', 'commuter', 'mountain', 'e-bike'];
        delete (a as { requiresMount?: string }).requiresMount;
      }
    }
    expect(() => validateCatalog(products)).not.toThrow(); // structurally still fine
    expect(() => validateDemoFixtures(products)).toThrowError(
      /deviation B: every deviation-A accessory is compatible/,
    );
  });

  it('removing long-range e-bikes fails deviation B', () => {
    const products = clone();
    const volt = products.find(p => p.id === 'volt-commute-9') as Bike;
    volt.rangeKm = 60;
    expect(() => validateDemoFixtures(products)).toThrowError(/deviation B: no in-stock e-bike/);
  });

  it('the proved solution matches the designed demo path', () => {
    const solution = validateDemoFixtures(clone());
    expect(solution.devABike.id).toBe('ridgeline-carbon');
    expect(solution.devAAccessories.helmet.id).toBe('vela-allroad-helmet');
    expect(solution.devAAccessories.lock.id).toBe('bastion-chain-lock');
    expect(solution.devAAccessories.lights.id).toBe('lumen-pro-lights');
    expect(solution.devATotal).toBeLessThanOrEqual(3000);
    expect(solution.devBEBike.id).toBe('volt-commute-9');
    expect(solution.devBTotal).toBeLessThan(3400);
    expect(solution.devBIncompatible.map(a => a.id)).toContain('lumen-pro-lights');
  });
});
