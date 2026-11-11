#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { registerWebhook } from '../shared/webhooks.js';

const USAGE = 'Usage: optimizely-hosting register-webhook [--callback-path <path>]';

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { 'callback-path': { type: 'string' } },
});

if (positionals[0] !== 'register-webhook') {
  console.error(USAGE);
  process.exit(1);
}

await registerWebhook({ callbackPath: values['callback-path'] });
