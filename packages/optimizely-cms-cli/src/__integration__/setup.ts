import { readFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../../../../.env.integration');

if (existsSync(envPath)) {
  try {
    const envFile = readFileSync(envPath, 'utf-8');
    let count = 0;
    envFile.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
          count++;
        }
      }
    });
  } catch (err) {
    console.warn('Failed to load .env.integration:', err);
  }
} else {
  console.error(
    '\n❌ Missing .env.integration file\n' +
    '   REST API integration tests will be skipped.\n' +
    '   To enable integration tests:\n' +
    '   1. cp .env.integration.template .env.integration\n' +
    '   2. Add your CMS credentials to .env.integration\n' +
    '   See INTEGRATION_TESTS.md for details.\n'
  );
}

const missingCreds: string[] = [];
if (!process.env.OPTIMIZELY_CMS_CLIENT_ID) missingCreds.push('OPTIMIZELY_CMS_CLIENT_ID');
if (!process.env.OPTIMIZELY_CMS_CLIENT_SECRET) missingCreds.push('OPTIMIZELY_CMS_CLIENT_SECRET');

if (missingCreds.length > 0) {
  console.error(
    `❌ Missing credentials in .env.integration: ${missingCreds.join(', ')}\n` +
    '   REST API integration tests will be skipped.\n'
  );
}
