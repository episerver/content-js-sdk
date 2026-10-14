import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { detectFramework, detectPackageManager, isExistingProject } from './detect.js';

let projectDir: string;

const writeFile = (name: string, content = '') => fs.writeFileSync(path.join(projectDir, name), content);
const writePackage = (pkg: object) => writeFile('package.json', JSON.stringify(pkg));

beforeEach(() => {
  projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cms-create-app-detect-'));
});

afterEach(() => fs.rmSync(projectDir, { recursive: true, force: true }));

describe('detectFramework', () => {
  it('detects Next.js from dependencies', () => {
    writePackage({ dependencies: { next: '16.0.0' } });

    expect(detectFramework(projectDir)).toBe('nextjs');
  });

  it('detects TanStack Start from devDependencies', () => {
    writePackage({ devDependencies: { '@tanstack/react-start': '^1.0.0' } });

    expect(detectFramework(projectDir)).toBe('tanstack');
  });

  it('prefers the first registered framework when several match', () => {
    writePackage({ dependencies: { '@tanstack/react-start': '^1.0.0', next: '16.0.0' } });

    expect(detectFramework(projectDir)).toBe('nextjs');
  });

  it('returns null when no supported framework is a dependency', () => {
    writePackage({ dependencies: { react: '^19.0.0' } });

    expect(detectFramework(projectDir)).toBeNull();
  });

  it('returns null for a package.json without dependency sections', () => {
    writePackage({ name: 'empty' });

    expect(detectFramework(projectDir)).toBeNull();
  });

  it('returns null without a package.json', () => expect(detectFramework(projectDir)).toBeNull());

  it('returns null for a malformed package.json', () => {
    writeFile('package.json', '{ not json');

    expect(detectFramework(projectDir)).toBeNull();
  });
});

describe('detectPackageManager', () => {
  it.each([
    ['pnpm-lock.yaml', 'pnpm'],
    ['yarn.lock', 'yarn'],
    ['package-lock.json', 'npm'],
  ])('maps %s to %s', (lockFile, expected) => {
    writeFile(lockFile);

    expect(detectPackageManager(projectDir)).toBe(expected);
  });

  it('prefers pnpm over yarn when both lock files exist', () => {
    writeFile('yarn.lock');
    writeFile('pnpm-lock.yaml');

    expect(detectPackageManager(projectDir)).toBe('pnpm');
  });

  it('defaults to npm without a lock file', () => expect(detectPackageManager(projectDir)).toBe('npm'));
});

describe('isExistingProject', () => {
  it('is true when the directory has a package.json', () => {
    writePackage({});

    expect(isExistingProject(projectDir)).toBe(true);
  });

  it('is false for an empty directory', () => expect(isExistingProject(projectDir)).toBe(false));
});
