// This module encapsulates all the FX related functions
// These are not part of any Optimizely SDK
import {
  createBatchEventProcessor,
  createInstance,
  createOdpManager,
  createPollingProjectConfigManager,
} from '@optimizely/optimizely-sdk';
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

/**
 * Returns the name of the ruleset in the given path. Returns `null`
 * if there is no experiment running
 */
function getRuleset(path: string) {
  // In this example, we are mapping specific paths with experiments
  const mapping: Record<string, string> = {
    '/en/landing/': 'tv_genre',
  };

  return mapping[path] ?? null;
}

/** Returns the Optimizely user context object from cookies */
async function getUserContext() {
  await optimizelyFxClient.onReady();

  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id');

  if (userId) {
    return optimizelyFxClient.createUserContext(userId.value);
  }

  throw new Error('User ID not set in the cookie');
}

/** Gets the variation in the CMS given the variation in FX */
function getCmsVariation(fxVariation: string | null) {
  // In this example, we have chosen to use the same name for
  // FX variations and CMS variations.
  return fxVariation;
}

/** Gets the variation in the given path for the current visiting user */
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

  const user = await getUserContext();
  const decision = user.decide(ruleset);

  return getCmsVariation(decision.variationKey);
}

export async function trackRegistration() {
  const user = await getUserContext();

  user.trackEvent('registrations');
}
