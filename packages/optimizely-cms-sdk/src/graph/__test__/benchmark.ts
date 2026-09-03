/**
 * Performance benchmark for stored query mechanism.
 *
 * Usage: npx tsx packages/optimizely-cms-sdk/src/graph/__test__/benchmark.ts
 *
 * Requires environment variables:
 *   OPTIMIZELY_GRAPH_GATEWAY - Graph API URL
 *   OPTIMIZELY_GRAPH_SINGLE_KEY - Graph API key
 *
 * Measures query processing latency with stored=true (default) by issuing
 * the same content metadata query 10 times and comparing request 1 (cold)
 * vs requests 2-10 (warm, reusing stored query plan).
 */

import { GraphClient } from '../index.js';

async function benchmark() {
  const apiKey = process.env.OPTIMIZELY_GRAPH_SINGLE_KEY;
  const graphUrl = process.env.OPTIMIZELY_GRAPH_GATEWAY;

  if (!apiKey) {
    console.error('Set OPTIMIZELY_GRAPH_SINGLE_KEY environment variable');
    process.exit(1);
  }

  const client = new GraphClient(apiKey, { graphUrl });
  const iterations = 10;
  const times: number[] = [];

  const query = `
query GetContentMetadata($key: String) {
  _Content(where: { _metadata: { key: { eq: $key } } }) {
    item { _metadata { types } }
  }
}`;

  console.log(`Running ${iterations} iterations against ${client.graphUrl}...\n`);

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    try {
      await client.request(query, { key: 'benchmark-test-key' });
    } catch {
      // Content may not exist — we're measuring latency, not correctness
    }
    const elapsed = performance.now() - start;
    times.push(elapsed);
    console.log(`  Request ${i + 1}: ${elapsed.toFixed(1)}ms`);
  }

  const firstRequest = times[0];
  const warmRequests = times.slice(1);
  const warmAvg = warmRequests.reduce((a, b) => a + b, 0) / warmRequests.length;

  console.log('\n--- Results ---');
  console.log(`First request (cold):     ${firstRequest.toFixed(1)}ms`);
  console.log(`Avg requests 2-10 (warm): ${warmAvg.toFixed(1)}ms`);

  if (firstRequest > 0) {
    const improvement = ((firstRequest - warmAvg) / firstRequest) * 100;
    console.log(`Improvement:              ${improvement.toFixed(1)}%`);
  }
}

benchmark().catch(console.error);
