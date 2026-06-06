#!/usr/bin/env node
import { spawn, execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.join(__dirname, 'cli.js');

// Get dev command from args, default to "next dev"
const devCommand = process.argv.slice(2).join(' ') || 'next dev';

// Find concurrently bin - try multiple locations
function findConcurrently(): string {
  // Try local node_modules first
  const localBin = path.join(__dirname, '..', 'node_modules', '.bin', 'concurrently');

  try {
    // Check if local bin exists and is executable
    const fs = require('node:fs');
    if (fs.existsSync(localBin)) {
      return localBin;
    }
  } catch {
    // Fall through to which
  }

  // Try using which/where to find in PATH
  try {
    const cmd = process.platform === 'win32' ? 'where' : 'which';
    const result = execSync(`${cmd} concurrently`, { encoding: 'utf8' }).trim();
    return result.split('\n')[0]; // First result
  } catch {
    throw new Error('concurrently not found. Install it: pnpm add -D concurrently');
  }
}

const concurrentlyBin = findConcurrently();

// Run typegen watch and dev server concurrently
const proc = spawn(
  concurrentlyBin,
  [
    '--raw',
    '--kill-others',
    `node ${cliPath} --watch`,
    devCommand
  ],
  {
    stdio: 'inherit',
  }
);

// Handle parent process termination
let isExiting = false;

function cleanup() {
  if (isExiting) return;
  isExiting = true;

  if (proc && !proc.killed) {
    proc.kill('SIGTERM');
  }
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

proc.on('exit', (code) => {
  process.exit(code || 0);
});
