import { GraphClient } from '../index.js';

export const createTestGraphClient = () => {
  const apiKey = process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!;
  const graphUrl = process.env.OPTIMIZELY_GRAPH_GATEWAY;
  return new GraphClient(apiKey, { graphUrl });
};

export const generateTestId = () =>
  `TEST_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export const waitForGraphIndexing = (ms = 5000) =>
  new Promise(resolve => setTimeout(resolve, ms));
