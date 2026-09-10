/**
 * Cleanup script to delete all integration test content types (TEST_* prefix)
 * Run before integration tests to ensure clean state
 *
 * Usage: npx tsx scripts/cleanup-test-types.ts
 */

import { createRestApiClient } from '../src/service/cmsRestClient.js';
import { loadEnvIntegration } from '../src/utils/loadEnvIntegration.js';

declare const process: {
  env: Record<string, string | undefined>;
  exit(code: number): never;
};

loadEnvIntegration();

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
    const response = await client.GET('/contenttypes');
    const typeData = response.data as any;
    const typeError = response.error as any;

    if (typeError) {
      console.error('❌ Failed to fetch content types:', typeError);
      process.exit(1);
    }

    if (!typeData || !typeData.items) {
      console.error('❌ Unexpected response:', typeData);
      process.exit(1);
    }

    console.log(`Found ${typeData.items.length} total content types`);

    const testTypes = (typeData.items as any[]).filter((ct: any) => ct.key.startsWith('TEST_'));

    if (testTypes.length === 0) {
      console.log('✅ No test content types to clean up');
      process.exit(0);
    }

    console.log(`\n🧹 Found ${testTypes.length} test content types to delete:\n`);

    testTypes.forEach(ct => console.log(`  ${ct.key}`));

    const results = await Promise.allSettled(
      testTypes.map(type =>
        (client.DELETE as any)('/contenttypes/{key}', {
          params: { path: { key: type.key as string } },
        })
      )
    );

    const deleted = results.filter(r => r.status === 'fulfilled' && !r.value?.error).length;
    const failed = results.length - deleted;

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
