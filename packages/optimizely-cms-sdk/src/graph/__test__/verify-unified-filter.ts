/**
 * Verify that GraphQL skips filters when variables are not passed.
 *
 * This tests the hypothesis that we can use a single unified query
 * with all filter variables declared, and GraphQL will ignore filters
 * whose variables are undefined/null.
 *
 * Usage: npx tsx packages/optimizely-cms-sdk/src/graph/__test__/verify-unified-filter.ts
 *
 * Requires environment variables:
 *   OPTIMIZELY_GRAPH_GATEWAY  - Graph API URL (optional, defaults to cg.optimizely.com)
 *   OPTIMIZELY_GRAPH_SINGLE_KEY - Graph API key
 */

import { GraphClient } from '../index.js';

// --- Current shape-specific queries (what we have now) ---

const QUERY_BY_KEY = `
query GetContentMetadata_ByKey($key: String) {
  _Content(where: { _metadata: { key: { eq: $key } } }) {
    item { _metadata { key types version locale } }
  }
}`;

const QUERY_BY_KEY_VERSION = `
query GetContentMetadata_ByKeyVersion($key: String, $version: String) {
  _Content(where: { _metadata: { key: { eq: $key }, version: { eq: $version } } }) {
    item { _metadata { key types version locale } }
  }
}`;

const QUERY_BY_PATH = `
query GetContentMetadata_ByPath($path: String, $pathNoSlash: String) {
  _Content(where: { _or: [{ _metadata: { url: { default: { eq: $path } } } }, { _metadata: { url: { default: { eq: $pathNoSlash } } } }] }) {
    item { _metadata { key types version locale url { default } } }
  }
}`;

const QUERY_BY_PATH_HOST = `
query GetContentMetadata_ByPathHost($host: String, $path: String, $pathNoSlash: String) {
  _Content(where: { _or: [{ _metadata: { url: { base: { eq: $host }, default: { eq: $path } } } }, { _metadata: { url: { base: { eq: $host }, default: { eq: $pathNoSlash } } } }] }) {
    item { _metadata { key types version locale url { default } } }
  }
}`;

// --- Proposed unified queries (what reviewer suggests) ---

const UNIFIED_QUERY_BY_KEY = `
query GetContentMetadata_Unified($key: String, $version: String, $metadataLocale: String) {
  _Content(where: { _metadata: { key: { eq: $key }, version: { eq: $version }, locale: { eq: $metadataLocale } } }) {
    item { _metadata { key types version locale } }
  }
}`;

const UNIFIED_QUERY_BY_PATH = `
query GetContentMetadata_UnifiedPath($host: String, $path: String, $pathNoSlash: String) {
  _Content(where: { _or: [{ _metadata: { url: { base: { eq: $host }, default: { eq: $path } } } }, { _metadata: { url: { base: { eq: $host }, default: { eq: $pathNoSlash } } } }] }) {
    item { _metadata { key types version locale url { default } } }
  }
}`;

type TestCase = {
  name: string;
  specificQuery: string;
  specificVars: Record<string, string | undefined>;
  unifiedQuery: string;
  unifiedVars: Record<string, string | undefined>;
};

async function verify() {
  const apiKey = process.env.OPTIMIZELY_GRAPH_SINGLE_KEY;
  const graphUrl = process.env.OPTIMIZELY_GRAPH_GATEWAY;

  if (!apiKey) {
    console.error('Set OPTIMIZELY_GRAPH_SINGLE_KEY environment variable');
    process.exit(1);
  }

  const client = new GraphClient(apiKey, { graphUrl });
  console.log(`Testing against ${client.graphUrl}\n`);

  const testCases: TestCase[] = [
    {
      name: 'by-key only (no version, no locale)',
      specificQuery: QUERY_BY_KEY,
      specificVars: { key: 'test-key-123' },
      unifiedQuery: UNIFIED_QUERY_BY_KEY,
      unifiedVars: { key: 'test-key-123' },
    },
    {
      name: 'by-key-version (version set, no locale)',
      specificQuery: QUERY_BY_KEY_VERSION,
      specificVars: { key: 'test-key-123', version: 'draft' },
      unifiedQuery: UNIFIED_QUERY_BY_KEY,
      unifiedVars: { key: 'test-key-123', version: 'draft' },
    },
    {
      name: 'by-key with locale (no version)',
      specificQuery: QUERY_BY_KEY,
      specificVars: { key: 'test-key-123' },
      unifiedQuery: UNIFIED_QUERY_BY_KEY,
      unifiedVars: { key: 'test-key-123', metadataLocale: 'en' },
    },
    {
      name: 'by-path without host',
      specificQuery: QUERY_BY_PATH,
      specificVars: { path: '/en/test/', pathNoSlash: '/en/test' },
      unifiedQuery: UNIFIED_QUERY_BY_PATH,
      unifiedVars: { path: '/en/test/', pathNoSlash: '/en/test' },
    },
    {
      name: 'by-path with host',
      specificQuery: QUERY_BY_PATH_HOST,
      specificVars: { host: 'example.com', path: '/en/test/', pathNoSlash: '/en/test' },
      unifiedQuery: UNIFIED_QUERY_BY_PATH,
      unifiedVars: { host: 'example.com', path: '/en/test/', pathNoSlash: '/en/test' },
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    console.log(`--- Test: ${tc.name} ---`);

    try {
      const specificResult = await client.request(tc.specificQuery, tc.specificVars);
      const unifiedResult = await client.request(tc.unifiedQuery, tc.unifiedVars);

      const specificItems = specificResult?.data?._Content?.item ?? specificResult?.data?._Content?.items ?? [];
      const unifiedItems = unifiedResult?.data?._Content?.item ?? unifiedResult?.data?._Content?.items ?? [];

      const specificJson = JSON.stringify(specificItems);
      const unifiedJson = JSON.stringify(unifiedItems);

      if (specificJson === unifiedJson) {
        console.log(`  PASS: Results match (${specificItems.length} items)`);
        passed++;
      } else {
        console.log(`  FAIL: Results differ!`);
        console.log(`  Specific (${specificItems.length} items): ${specificJson.slice(0, 200)}`);
        console.log(`  Unified  (${unifiedItems.length} items): ${unifiedJson.slice(0, 200)}`);
        failed++;
      }
    } catch (err: any) {
      console.log(`  ERROR: ${err.message || err}`);

      if (err.response) {
        try {
          const body = await err.response.json();
          console.log(`  Response: ${JSON.stringify(body).slice(0, 300)}`);
        } catch { /* ignore */ }
      }
      failed++;
    }

    console.log('');
  }

  console.log('=== Summary ===');
  console.log(`Passed: ${passed}/${testCases.length}`);
  console.log(`Failed: ${failed}/${testCases.length}`);

  if (failed > 0) {
    console.log('\nConclusion: GraphQL does NOT fully skip unused filter variables.');
    console.log('The shape-specific approach may still be needed.');
  } else {
    console.log('\nConclusion: GraphQL DOES skip unused filter variables.');
    console.log('We can safely unify queries and remove FilterShape.');
  }

  process.exit(failed > 0 ? 1 : 0);
}

verify().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
