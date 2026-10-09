/** Polling of a front-end hosting deployment until it reaches a given status */

import { setTimeout as delay } from 'node:timers/promises';
import { hostingErrors } from '../error.js';
import type { Deployment, DeploymentStatus } from './deploymentClient.js';

type WaitOptions = {
  until: DeploymentStatus[];
  timeoutMinutes: number;
  onUpdate?: (deployment: Deployment) => void;
  onRetry?: (error: unknown) => void;
  sleep?: (ms: number) => Promise<unknown>;
  now?: () => number;
};

const POLL_INTERVAL_MS = 5000;
const MAX_CONSECUTIVE_FAILURES = 3;
const FAILED_STATUSES: DeploymentStatus[] = ['Failed', 'Reset'];

const isCredentialError = (error: unknown) =>
  error instanceof hostingErrors.InvalidHostingCredentials ||
  error instanceof hostingErrors.ForbiddenHostingCredentials;

/** Poll a deployment until its status is one of `until`; throws when it fails, times out or the status cannot be read repeatedly */
export async function waitForDeployment(
  fetchDeployment: () => Promise<Deployment>,
  { until, timeoutMinutes, onUpdate, onRetry, sleep = delay, now = Date.now }: WaitOptions,
): Promise<Deployment> {
  const deadline = now() + timeoutMinutes * 60_000;

  const poll = async (failures = 0): Promise<Deployment> => {
    const deployment = await fetchDeployment().catch((error: unknown) => {
      if (isCredentialError(error) || failures + 1 >= MAX_CONSECUTIVE_FAILURES) throw error;

      onRetry?.(error);
    });

    // A failed status read is retried; the deployment itself keeps running on the platform
    if (!deployment) {
      await sleep(POLL_INTERVAL_MS);
      return poll(failures + 1);
    }

    onUpdate?.(deployment);

    if (FAILED_STATUSES.includes(deployment.status))
      throw new hostingErrors.DeploymentFailed(deployment.id, deployment.deploymentErrors);
    if (until.includes(deployment.status)) return deployment;
    if (now() >= deadline)
      throw new hostingErrors.DeploymentTimeout(deployment.id, timeoutMinutes);

    await sleep(POLL_INTERVAL_MS);

    return poll();
  };

  return poll();
}
