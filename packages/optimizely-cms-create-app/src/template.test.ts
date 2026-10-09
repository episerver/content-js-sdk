import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { copyTemplate } from './template.js';

const SDK = '@optimizely/cms-sdk';
const CLI = '@optimizely/cms-cli';

// copyTemplate only reads from templates/<name>, so the fixture is written there
const FIXTURE_NAME = '__test-fixture__';
const FIXTURE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'templates', FIXTURE_NAME);
const FIXTURE_PACKAGE = {
  name: 'fixture',
  dependencies: { [SDK]: '^1.0.0', next: '16.0.0' },
  devDependencies: { [CLI]: '^1.0.0', typescript: '^5' },
};

let targetDir: string;

function writeFixture(pkg: object): void {
  fs.mkdirSync(FIXTURE_DIR, { recursive: true });
  fs.writeFileSync(path.join(FIXTURE_DIR, 'package.json'), JSON.stringify(pkg));
  fs.writeFileSync(path.join(FIXTURE_DIR, '.env.template'), 'KEY=value\n');
}

function stubRegistry(bodies: Record<string, object>): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const name = Object.keys(bodies).find(it => url.endsWith(`/${it}/latest`));
      return name ? Response.json(bodies[name]) : new Response('', { status: 404 });
    }),
  );
}

async function copyFixture(): Promise<Record<string, any>> {
  await copyTemplate(FIXTURE_NAME, targetDir, 'my-app');
  return JSON.parse(fs.readFileSync(path.join(targetDir, 'package.json'), 'utf-8'));
}

beforeEach(() => {
  writeFixture(FIXTURE_PACKAGE);
  targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cms-create-app-'));
});

afterEach(() => {
  vi.unstubAllGlobals();
  fs.rmSync(targetDir, { recursive: true, force: true });
});

afterAll(() => fs.rmSync(FIXTURE_DIR, { recursive: true, force: true }));

describe('copyTemplate', () => {
  it('pins SDK and CLI to the latest registry versions', async () => {
    stubRegistry({ [SDK]: { version: '3.1.0' }, [CLI]: { version: '3.2.0' } });

    const pkg = await copyFixture();

    expect(pkg.dependencies[SDK]).toBe('^3.1.0');
    expect(pkg.devDependencies[CLI]).toBe('^3.2.0');
  });

  it('keeps the bundled range for packages whose lookup fails', async () => {
    stubRegistry({ [SDK]: { version: '3.1.0' } });

    const pkg = await copyFixture();

    expect(pkg.dependencies[SDK]).toBe('^3.1.0');
    expect(pkg.devDependencies[CLI]).toBe('^1.0.0');
  });

  it('keeps bundled ranges when the registry is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const pkg = await copyFixture();

    expect(pkg.dependencies[SDK]).toBe('^1.0.0');
    expect(pkg.devDependencies[CLI]).toBe('^1.0.0');
  });

  it('treats a response without a version as a failed lookup', async () => {
    stubRegistry({ [SDK]: {}, [CLI]: {} });

    const pkg = await copyFixture();

    expect(pkg.dependencies[SDK]).toBe('^1.0.0');
    expect(pkg.devDependencies[CLI]).toBe('^1.0.0');
  });

  it('leaves other dependencies untouched', async () => {
    stubRegistry({ [SDK]: { version: '3.1.0' }, [CLI]: { version: '3.2.0' } });

    const pkg = await copyFixture();

    expect(pkg.dependencies.next).toBe('16.0.0');
    expect(pkg.devDependencies.typescript).toBe('^5');
  });

  it('does not add a devDependencies section when the template has none', async () => {
    writeFixture({ name: 'fixture', dependencies: { [SDK]: '^1.0.0' } });
    stubRegistry({ [SDK]: { version: '3.1.0' }, [CLI]: { version: '3.2.0' } });

    const pkg = await copyFixture();

    expect(pkg).not.toHaveProperty('devDependencies');
  });

  it('sets the project name and renames .env.template to .env', async () => {
    stubRegistry({});

    const pkg = await copyFixture();

    expect(pkg.name).toBe('my-app');
    expect(fs.readFileSync(path.join(targetDir, '.env'), 'utf-8')).toBe('KEY=value\n');
    expect(fs.existsSync(path.join(targetDir, '.env.template'))).toBe(false);
  });
});
