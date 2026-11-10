#!/usr/bin/env node
/**
 * Marks `dist/cjs` as CommonJS, overriding the package-level `"type": "module"`.
 */

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = join(__dirname, '..', 'dist', 'cjs', 'package.json');

writeFileSync(outputPath, `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`, 'utf-8');
console.log('✓ Wrote dist/cjs/package.json');
