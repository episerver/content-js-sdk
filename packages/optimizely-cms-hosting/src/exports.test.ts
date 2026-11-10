import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const packageRoot = join(import.meta.dirname, '..');
const packageJson = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf-8'));

const collectTargets = (node: unknown): string[] =>
  typeof node === 'string' ?
    [node]
  : Object.values(node as Record<string, unknown>).flatMap(collectTargets);

const toSource = (target: string) =>
  target.replace(/^\.\/dist\/(esm|cjs)\//, 'src/').replace(/\.(d\.ts|js)$/, '.ts');

describe('package.json', () => {
  const targets = [
    ...collectTargets(packageJson.exports),
    ...collectTargets(packageJson.bin),
  ];

  it.each(targets)('%s is built from an existing source file', target => {
    expect(existsSync(join(packageRoot, toSource(target)))).toBe(true);
  });
});
