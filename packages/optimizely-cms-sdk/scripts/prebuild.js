#!/usr/bin/env node
/**
 * Pre-build script that runs various code generation tasks before compilation.
 *
 * Add new tasks to the `tasks` array below.
 */

import { generateVersion } from './version.js';

// =============================================================================
// Task Registry
// =============================================================================

const tasks = [
  generateVersion,
  // Add more tasks here as needed
];

// =============================================================================
// Task Runner
// =============================================================================

const runPrebuild = async () => {
  console.log('Running prebuild tasks...\n');

  for (const task of tasks) {
    try {
      await task();
    } catch (error) {
      console.error(`✗ Task failed: ${task.name}`);
      console.error(error);
      process.exit(1);
    }
  }

  console.log('\nPrebuild complete!');
};

runPrebuild();
