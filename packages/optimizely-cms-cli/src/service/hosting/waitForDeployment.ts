/** Polling of a front-end hosting deployment until it reaches a given status */

import { setTimeout as delay } from 'node:timers/promises';
import { hostingErrors } from '../error.js';
import type { Deployment, DeploymentStatus } from './deploymentClient.js';

type WaitOptions = {
  until: DeploymentStatus[];
  timeoutMinutes: number;
  /** Last state seen by an earlier wait, so its status, warnings and errors are not reported again */
  previous?: Deployment;
  intervalMs?: number;
  onUpdate?: (deployment: Deployment, previous?: Deployment) => void;
  sleep?: (ms: number) => Promise<unknown>;
  now?: () => number;
};

const FAILED_STATUSES: DeploymentStatus[] = ['Failed', 'Reset'];

/** Poll a deployment until its status is one of `until`; throws when it fails or times out */
export async function waitForDeployment(
  fetchDeployment: () => Promise<Deployment>,
  {
    until,
    timeoutMinutes,
    previous,
    intervalMs = 5000,
    onUpdate,
    sleep = delay,
    now = Date.now,
  }: WaitOptions,
): Promise<Deployment> {
  const deadline = now() + timeoutMinutes * 60_000;

  const poll = async (last?: Deployment): Promise<Deployment> => {
    const deployment = await fetchDeployment();

    onUpdate?.(deployment, last);

    if (FAILED_STATUSES.includes(deployment.status))
      throw new hostingErrors.DeploymentFailed(
        deployment.id,
        deployment.deploymentErrors,
      );
    if (until.includes(deployment.status)) return deployment;
    if (now() >= deadline)
      throw new hostingErrors.DeploymentTimeout(deployment.id, timeoutMinutes);

    await sleep(intervalMs);

    return poll(deployment);
  };

  return poll(previous);
}

