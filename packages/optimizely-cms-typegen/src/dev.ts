#!/usr/bin/env node
import { spawn } from 'node:child_process';
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
