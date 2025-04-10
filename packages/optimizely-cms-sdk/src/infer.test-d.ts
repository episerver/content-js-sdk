import { test, expectTypeOf } from 'vitest';
import type { Infer } from './infer';

test('infer works properly', () => {
  expectTypeOf<Infer<number>>().toBeUnknown();
});
