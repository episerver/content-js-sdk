import { describe, expect, it, vi } from 'vitest';
import Deploy from '../commands/deploy.js';
import type { Deployment, DeploymentStatus } from '../service/hosting/deploymentClient.js';
import { waitForDeployment } from '../service/hosting/waitForDeployment.js';

const deployment = (status: DeploymentStatus, extra: Partial<Deployment> = {}): Deployment => ({
  id: 'd1',
  status,
  ...extra,
});

const sequence = (...deployments: Deployment[]) => {
  const fetchDeployment = vi.fn<() => Promise<Deployment>>();

  deployments.forEach(item => fetchDeployment.mockResolvedValueOnce(item));
  return fetchDeployment;
};

const noSleep = () => Promise.resolve();

describe('waitForDeployment', () => {
  it('polls until the status is reached and reports each update', async () => {
    const onUpdate = vi.fn();
    const fetchDeployment = sequence(
      deployment('InProgress', { percentComplete: 10 }),
      deployment('InProgress', { percentComplete: 60 }),
      deployment('AwaitingVerification', { percentComplete: 100 }),
    );

    const result = await waitForDeployment(fetchDeployment, {
      until: ['AwaitingVerification'],
      timeoutMinutes: 30,
      onUpdate,
      sleep: noSleep,
    });

    expect(result.status).toBe('AwaitingVerification');
    expect(fetchDeployment).toHaveBeenCalledTimes(3);
    expect(onUpdate).toHaveBeenCalledTimes(3);
    expect(onUpdate).toHaveBeenLastCalledWith(
      deployment('AwaitingVerification', { percentComplete: 100 }),
    );
  });

  it('throws with the deployment errors when it fails', async () => {
    const fetchDeployment = sequence(
      deployment('InProgress'),
      deployment('Failed', { deploymentErrors: ['npm run build exited with code 1'] }),
    );

    await expect(
      waitForDeployment(fetchDeployment, { until: ['Succeeded'], timeoutMinutes: 30, sleep: noSleep }),
    ).rejects.toThrow(/Deployment d1 failed[\s\S]*npm run build exited with code 1/);
  });

  it('throws when the deadline passes', async () => {
    const times = [0, 0, 31 * 60_000];
    const fetchDeployment = vi.fn(async () => deployment('InProgress'));

    await expect(
      waitForDeployment(fetchDeployment, {
        until: ['Succeeded'],
        timeoutMinutes: 30,
        sleep: noSleep,
        now: () => times.shift() ?? Infinity,
      }),
    ).rejects.toThrow(/did not finish within 30 minutes/);
    expect(fetchDeployment).toHaveBeenCalledTimes(2);
  });
});

describe('Deploy command', () => {
  it('has no duplicate short flags', () => {
    const chars = Object.values(Deploy.flags)
      .map(flag => flag.char)
      .filter(Boolean);

    expect(new Set(chars).size).toBe(chars.length);
  });
});
