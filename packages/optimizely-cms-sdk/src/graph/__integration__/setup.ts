import { readFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../../../../../.env.integration');

if (existsSync(envPath)) {
  try {
    const envFile = readFileSync(envPath, 'utf-8');
    envFile.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      }
    });
  } catch (err) {
    console.warn('Failed to load .env.integration:', err);
  }
} else {
  console.error(
    '\n❌ Missing .env.integration file\n' +
    '   GraphQL integration tests will be skipped.\n' +
    '   To enable integration tests:\n' +
    '   1. cp .env.integration.template .env.integration\n' +
    '   2. Add your CMS credentials to .env.integration\n' +
    '   See INTEGRATION_TESTS.md for details.\n'
  );
}

if (!process.env.OPTIMIZELY_GRAPH_SINGLE_KEY) {
  console.error(
    '❌ Missing OPTIMIZELY_GRAPH_SINGLE_KEY in .env.integration\n' +
    '   GraphQL integration tests will be skipped.\n'
  );
}
