import { readFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

declare const process: {
  env: Record<string, string | undefined>;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../../../../.env.integration');

if (existsSync(envPath)) {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach((line: any) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    }
  });
} else {
  console.error(
    '❌ Missing .env.integration file\n' +
    '   GraphQL integration tests will be skipped.\n' +
    '   See INTEGRATION_TESTS.md for setup instructions.\n'
  );
}

if (!process.env.OPTIMIZELY_GRAPH_SINGLE_KEY) {
  console.error(
    '❌ Missing OPTIMIZELY_GRAPH_SINGLE_KEY in .env.integration\n' +
    '   GraphQL integration tests will be skipped.\n'
  );
}
