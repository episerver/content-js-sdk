/**
 * Cleanup script to delete all integration test content types (TEST_* prefix)
 * Run before integration tests to ensure clean state
 *
 * Usage: npx tsx scripts/cleanup-test-types.ts
 */

import { readFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createRestApiClient } from '../src/service/cmsRestClient.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// .env.integration is in the project root, not in packages subdirectory
const envPath = resolve(__dirname, '../../../.env.integration');

// Load environment variables
if (!existsSync(envPath)) {
  console.error('❌ .env.integration not found');
  console.error('Please create it by running: cp .env.integration.template .env.integration');
  process.exit(1);
}

const envContent = readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  }
});

const clientId = process.env.OPTIMIZELY_CMS_CLIENT_ID;
const clientSecret = process.env.OPTIMIZELY_CMS_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('❌ Missing CMS credentials in .env.integration');
  process.exit(1);
}

async function cleanup() {
  try {
    const client = await createRestApiClient({
      clientId: clientId as string,
      clientSecret: clientSecret as string,
    });

    // Delete content types with TEST_ prefix
    console.log('\nFetching content types...');
    const { data: typeData, error: typeError } = await client.GET('/contenttypes');

    if (typeError) {
      console.error('❌ Failed to fetch content types:', typeError);
      process.exit(1);
    }

    if (!typeData || !typeData.items) {
      console.error('❌ Unexpected response:', typeData);
      process.exit(1);
    }

    console.log(`Found ${typeData.items.length} total content types`);

    const testTypes = typeData.items.filter((ct: any) => ct.key.startsWith('TEST_'));

    if (testTypes.length === 0) {
      console.log('✅ No test content types to clean up');
      process.exit(0);
    }

    console.log(`\n🧹 Found ${testTypes.length} test content types to delete:\n`);

    let deleted = 0;
    let failed = 0;

    for (const type of testTypes) {
      try {
        console.log(`  Deleting ${type.key}...`);
        const result = await (client.DELETE as any)('/contenttypes/{key}', {
          params: { path: { key: type.key as string } },
        });

        if (result.error) {
          console.error(`  ❌ Failed to delete ${type.key}:`, JSON.stringify(result.error, null, 2));
          failed++;
        } else {
          deleted++;
        }
      } catch (err: any) {
        console.error(`  ❌ Failed to delete ${type.key}: ${err?.message || err}`);
        failed++;
      }
    }

    console.log(`\n✅ Cleanup complete: ${deleted} content types deleted, ${failed} failed`);

    if (failed > 0) {
      console.warn('⚠️  Some content types could not be deleted');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Cleanup failed:', err);
    process.exit(1);
  }
}

cleanup();
