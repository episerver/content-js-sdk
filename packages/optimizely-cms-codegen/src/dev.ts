#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.join(__dirname, 'cli.js');

// Get dev command from args, default to "next dev"
const devCommand = process.argv.slice(2).join(' ') || 'next dev';

// Run typegen watch and dev server concurrently
const require = createRequire(import.meta.url);
const concurrentlyBin = path.join(
  path.dirname(require.resolve('concurrently/package.json')),
  'dist',
  'bin',
  'concurrently.js',
);

// Generate once before anything starts, so the dev server never sees a missing or stale registry.
const first = spawnSync(process.execPath, [cliPath], { stdio: 'inherit' });
if (first.status !== 0) process.exit(first.status ?? 1);

const proc = spawn(
  process.execPath,
  [
    concurrentlyBin,
    '--raw',
    '--kill-others',
    `${JSON.stringify(process.execPath)} ${JSON.stringify(cliPath)} --watch`,
    devCommand,
  ],
  { stdio: 'inherit' },
);

// Forward termination to the child so neither process is orphaned
const stop = () => proc.kill('SIGTERM');
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

proc.on('exit', code => process.exit(code || 0));
