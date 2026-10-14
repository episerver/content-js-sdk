import { describe, expect, it } from 'vitest';
import { getAddCommand, getInstallCommand, getRunCommand } from './package-manager.js';

const DEPS = ['@optimizely/cms-sdk', 'react'];

// Non-dev commands currently contain a double space, which the shell ignores
const tokens = (command: string) => command.split(/\s+/);

describe('getInstallCommand', () => {
  it.each([
    ['npm', 'npm install'],
    ['pnpm', 'pnpm install'],
    ['yarn', 'yarn'],
  ] as const)('%s → %s', (packageManager, expected) => expect(getInstallCommand(packageManager)).toBe(expected));
});

describe('getAddCommand', () => {
  it.each([
    ['npm', false, 'npm install @optimizely/cms-sdk react'],
    ['npm', true, 'npm install --save-dev @optimizely/cms-sdk react'],
    ['pnpm', false, 'pnpm add @optimizely/cms-sdk react'],
    ['pnpm', true, 'pnpm add -D @optimizely/cms-sdk react'],
    ['yarn', false, 'yarn add @optimizely/cms-sdk react'],
    ['yarn', true, 'yarn add -D @optimizely/cms-sdk react'],
  ] as const)('%s (dev: %s) → %s', (packageManager, isDev, expected) =>
    expect(tokens(getAddCommand(packageManager, DEPS, isDev))).toEqual(tokens(expected)),
  );
});

describe('getRunCommand', () => {
  it.each([
    ['npm', 'npm run dev'],
    ['pnpm', 'pnpm dev'],
    ['yarn', 'yarn dev'],
  ] as const)('%s → %s', (packageManager, expected) => expect(getRunCommand(packageManager, 'dev')).toBe(expected));
});
