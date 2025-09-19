'use server';
import {
  createBatchEventProcessor,
  createInstance,
  createOdpManager,
  createPollingProjectConfigManager,
} from '@optimizely/optimizely-sdk';
import { nanoid } from 'nanoid';
import { cookies } from 'next/headers';

const SDK_KEY = process.env.OPTIMIZELY_FX_SDK_KEY!;

const pollingConfigManager = createPollingProjectConfigManager({
  sdkKey: SDK_KEY,
  autoUpdate: true,
  updateInterval: 60000, // 1 minute
});

const batchEventProcessor = createBatchEventProcessor();
const odpManager = createOdpManager();

const optimizelyFxClient = createInstance({
  projectConfigManager: pollingConfigManager,
  eventProcessor: batchEventProcessor,
  odpManager: odpManager,
});

// Returns the name of the ruleset in the given path
function getRuleset(path: string) {
  if (path === '/en/landing/') {
    return 'tv_genre';
  }

  return null;
}

// Creates a user context.
// - Reads the "user id" from the cookie.
// - Sets the cookie with a random value otherwise
// Returns the user context
async function createUserContext() {
  await optimizelyFxClient.onReady();

  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id');

  if (userId) {
    return optimizelyFxClient.createUserContext(userId.value);
  }

  throw new Error('User ID not set in the cookie');
}

function getCmsVariation(fxVariation: string | null) {
  // Here we can add custom mapping between `fxVariation` and `cmsVariation`
  return fxVariation;
}

export async function getVariation(path: string) {
  const ruleset = getRuleset(path);

  if (!ruleset) {
    return null;
  }
  console.log(
    'Path: "%s". Running an experiment with ruleset "%s"',
    path,
    ruleset
  );

  const user = await createUserContext();
  const decision = user.decide(ruleset);

  return getCmsVariation(decision.variationKey);
}
