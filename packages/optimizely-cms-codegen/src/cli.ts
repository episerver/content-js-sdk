#!/usr/bin/env node
import chokidar from 'chokidar';
import path from 'node:path';
import { generate, loadConfig, PLATFORM_GLOB } from './generator.js';

const PREFIX = '[cms-codegen]';
const root = process.cwd();
const args = process.argv.slice(2);
const watchMode = args.includes('--watch') || args.includes('-w');
const checkMode = args.includes('--check');

const message = (error: unknown) => (error instanceof Error ? error.message : String(error));

function logSuccess({ files, registryFile }: { files: string[]; registryFile: string }) {
  console.log(
    `${PREFIX} ✓ Generated registry for ${files.length} components in ${path.relative(root, registryFile)}`,
  );
}

// Debounce, and chain runs so two generations never write files at once.
let regenerateTimeout: NodeJS.Timeout | null = null;
let running: Promise<void> = Promise.resolve();

function regenerate() {
  if (regenerateTimeout) clearTimeout(regenerateTimeout);

  regenerateTimeout = setTimeout(() => {
    regenerateTimeout = null;
    running = running.then(async () => {
      try {
        logSuccess(await generate(root));
      } catch (error) {
        console.error(`${PREFIX} ✗ Generation failed:`, message(error));
      }
    });
  }, 300);
}

async function main() {
  if (checkMode) {
    try {
      const { stale } = await generate(root, { check: true });
      if (stale.length === 0) return console.log(`${PREFIX} ✓ Generated files are up to date`);
      console.error(
        `${PREFIX} ✗ Out of date: ${stale.map(f => path.relative(root, f)).join(', ')}. Run opti-codegen and commit the result.`,
      );
    } catch (error) {
      console.error(`${PREFIX} ✗ Check failed:`, message(error));
    }
    process.exit(1);
  }

  try {
    logSuccess(await generate(root));
  } catch (error) {
    console.error(`${PREFIX} ✗ Initial generation failed:`, message(error));
    process.exit(1);
  }

  if (watchMode) {
    console.log(`${PREFIX} 👀 Watching for changes...`);

    const config = await loadConfig(root).catch(() => null);
    const patterns =
      Array.isArray(config?.components) ?
        config.components
      : [config?.components || 'src/components/**/*.{ts,tsx}'];

    const watcher = chokidar.watch([...patterns, 'optimizely.config.mjs', PLATFORM_GLOB], {
      ignored: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/*.d.ts', '**/registry.ts'],
      cwd: root,
      ignoreInitial: true,
    });

    const events = { change: '🔄 File changed', add: '➕ File added', unlink: '➖ File removed' };
    for (const [event, label] of Object.entries(events)) {
      watcher.on(event, filePath => {
        console.log(`\n${PREFIX} ${label}: ${filePath}`);
        regenerate();
      });
    }

    watcher.on('error', error => {
      console.error(`${PREFIX} ✗ Watcher error:`, error);
    });

    process.on('SIGINT', () => {
      console.log(`\n${PREFIX} ⏹ Stopping watch mode...`);
      watcher.close();
      process.exit(0);
    });
  }
}

main().catch(console.error);
