#!/usr/bin/env node
/**
 * Build gate — contracts.md §1 + §2 (wired in as the `prebuild` npm script).
 *
 * 1. Catalog structural validation + demo-fixture solvability, computed with
 *    the REAL engine (importing the fixtures module runs `defineCatalog`,
 *    which executes both validators; this script re-runs them explicitly to
 *    print the proved solutions and to fail loudly with a named rule).
 * 2. The LITERAL worst-case cookie assertion: 20 max-bound max-quantity cart
 *    items + 20 max-bound ledger entries + signature ≤ 3800 bytes.
 *
 * Runs TypeScript sources via tsx (see package.json).
 */
import { register } from 'tsx/esm/api';

register();

const { PRODUCTS } = await import('../lib/store/catalog/fixtures.ts');
const { validateCatalog, validateDemoFixtures } = await import('../lib/store/catalog/validate.ts');
const { MAX_COOKIE_BYTES, encodeState, worstCaseState } = await import('../lib/store/codec.ts');

try {
  // Importing fixtures already validated; run explicitly for a readable report.
  validateCatalog([...PRODUCTS]);
  const solution = validateDemoFixtures([...PRODUCTS]);

  console.log(`store-validate: catalog OK (${PRODUCTS.length} products)`);
  console.log(
    `store-validate: primary workflow OK — ${solution.primaryBikes
      .map(b => `${b.id} (${b.weightKg} kg, $${b.priceUsd})`)
      .join(', ')}`,
  );
  console.log(
    `store-validate: deviation A OK — ${solution.devABike.id} + ${Object.values(
      solution.devAAccessories,
    )
      .map(a => a.id)
      .join(' + ')} = $${solution.devATotal} (≤ $3000)`,
  );
  console.log(
    `store-validate: deviation B OK — swap to ${solution.devBEBike.id} (${solution.devBEBike.rangeKm} km) = $${solution.devBTotal} (< $3400); incompatible: ${solution.devBIncompatible
      .map(a => a.id)
      .join(', ')}`,
  );

  // Literal worst-case cookie assertion. Size is independent of the secret
  // (HMAC-SHA256 output is fixed-length), so a build-time secret works even
  // where STRIDE_COOKIE_SECRET is not yet provisioned.
  const secret = process.env.STRIDE_COOKIE_SECRET ?? 'store-validate-build-assertion-secret';
  const cookieValue = encodeState(worstCaseState(), secret);
  const bytes = Buffer.byteLength(cookieValue, 'utf8');
  if (bytes > MAX_COOKIE_BYTES) {
    throw new Error(
      `worst-case stride_store cookie is ${bytes} bytes > budget ${MAX_COOKIE_BYTES}`,
    );
  }
  console.log(
    `store-validate: worst-case cookie OK — ${bytes} bytes ≤ ${MAX_COOKIE_BYTES} (headroom ${MAX_COOKIE_BYTES - bytes})`,
  );
} catch (err) {
  console.error(`store-validate: FAILED — ${err?.message ?? err}`);
  process.exit(1);
}
