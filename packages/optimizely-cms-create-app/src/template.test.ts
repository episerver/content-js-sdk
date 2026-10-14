import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { copyTemplate, getScaffoldDir } from './template.js';

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

function writeFixtureFile(relativePath: string, content = ''): void {
  const filePath = path.join(FIXTURE_DIR, relativePath);

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

const targetExists = (relativePath: string) => fs.existsSync(path.join(targetDir, relativePath));
const readTarget = (relativePath: string) => fs.readFileSync(path.join(targetDir, relativePath), 'utf-8');
const removeFixture = () => fs.rmSync(FIXTURE_DIR, { recursive: true, force: true });

beforeEach(() => {
  removeFixture();
  writeFixture(FIXTURE_PACKAGE);
  targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cms-create-app-'));
});

afterEach(() => {
  vi.unstubAllGlobals();
  fs.rmSync(targetDir, { recursive: true, force: true });
});

// Also clears a fixture left behind by a crashed run
beforeAll(removeFixture);
afterAll(removeFixture);

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

  it('throws for an unknown template', async () => {
    stubRegistry({});

    await expect(copyTemplate('does-not-exist', targetDir, 'my-app')).rejects.toThrow('Template "does-not-exist" not found');
  });

  it('skips excluded entries at every level', async () => {
    const excluded = ['node_modules', '.next', '.tanstack', 'certificates', 'next-env.d.ts', '.npmrc', 'src/node_modules'];

    ['node_modules/pkg/index.js', '.next/cache', '.tanstack/tmp', 'certificates/key.pem', 'next-env.d.ts', '.npmrc', 'src/node_modules/pkg/index.js', 'src/index.ts'].forEach(it =>
      writeFixtureFile(it),
    );
    stubRegistry({});

    await copyFixture();

    excluded.forEach(it => expect(targetExists(it), it).toBe(false));
    expect(targetExists('src/index.ts')).toBe(true);
  });

  it("does not copy the template's own .env", async () => {
    writeFixtureFile('.env', 'SECRET=leaked\n');
    stubRegistry({});

    await copyFixture();

    expect(readTarget('.env')).toBe('KEY=value\n');
  });

  it('copies nested directories', async () => {
    writeFixtureFile('src/app/[...slug]/page.tsx', 'export default 1;\n');
    stubRegistry({});

    await copyFixture();

    expect(readTarget('src/app/[...slug]/page.tsx')).toBe('export default 1;\n');
  });

  it('copies a template without a package.json and skips the registry', async () => {
    const fetchMock = vi.fn();

    fs.rmSync(path.join(FIXTURE_DIR, 'package.json'));
    writeFixtureFile('README.md', '# Fixture\n');
    vi.stubGlobal('fetch', fetchMock);

    await copyTemplate(FIXTURE_NAME, targetDir, 'my-app');

    expect(readTarget('README.md')).toBe('# Fixture\n');
    expect(targetExists('package.json')).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [['.env.in', '.env.example', 'env.example', '.env.template'], '.env.in'],
    [['.env.example', 'env.example', '.env.template'], '.env.example'],
    [['env.example', '.env.template'], 'env.example'],
  ])('renames the first env candidate of %j', async (candidates, winner) => {
    candidates.forEach(it => writeFixtureFile(it, `FROM=${it}\n`));
    stubRegistry({});

    await copyFixture();

    expect(readTarget('.env')).toBe(`FROM=${winner}\n`);
    expect(targetExists(winner)).toBe(false);
  });

  it('looks up the latest versions on the npm registry with a timeout signal', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 404 }));

    vi.stubGlobal('fetch', fetchMock);

    await copyFixture();

    expect(fetchMock).toHaveBeenCalledWith(`https://registry.npmjs.org/${SDK}/latest`, { signal: expect.any(AbortSignal) });
    expect(fetchMock).toHaveBeenCalledWith(`https://registry.npmjs.org/${CLI}/latest`, { signal: expect.any(AbortSignal) });
  });
});

describe('getScaffoldDir', () => {
  it('points at templates/scaffold', () => {
    const scaffoldDir = getScaffoldDir();

    expect(scaffoldDir).toBe(path.resolve(FIXTURE_DIR, '..', 'scaffold'));
    expect(fs.existsSync(path.join(scaffoldDir, 'nextjs', 'optimizely.ts'))).toBe(true);
  });
});
