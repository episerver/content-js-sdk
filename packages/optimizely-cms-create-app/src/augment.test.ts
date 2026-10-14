import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as p from '@clack/prompts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { augmentProject } from './augment.js';
import { getScaffoldDir } from './template.js';
import type { ScaffoldOptions } from './types.js';
import { exec } from './utils.js';

const spinner = vi.hoisted(() => ({ start: vi.fn(), stop: vi.fn() }));

vi.mock('@clack/prompts', () => ({ spinner: () => spinner, note: vi.fn(), outro: vi.fn() }));

vi.mock('./utils.js', async importOriginal => ({
  ...(await importOriginal<typeof import('./utils.js')>()),
  exec: vi.fn(),
}));

const OPTIONS: ScaffoldOptions = {
  mode: 'scaffold',
  framework: 'nextjs',
  addSdk: true,
  addCli: true,
  packageManager: 'npm',
  skipInstall: false,
};

const SCAFFOLD_DIR = path.join(getScaffoldDir(), 'nextjs');

let projectDir: string;

const projectPath = (relativePath: string) => path.join(projectDir, relativePath);
const exists = (relativePath: string) => fs.existsSync(projectPath(relativePath));
const read = (relativePath: string) => fs.readFileSync(projectPath(relativePath), 'utf-8');
const readScaffold = (name: string) => fs.readFileSync(path.join(SCAFFOLD_DIR, name), 'utf-8');
const readScripts = () => JSON.parse(read('package.json')).scripts ?? {};

function writeProjectFile(relativePath: string, content = ''): void {
  fs.mkdirSync(path.dirname(projectPath(relativePath)), { recursive: true });
  fs.writeFileSync(projectPath(relativePath), content);
}

beforeEach(() => {
  projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cms-create-app-augment-'));
  writeProjectFile('package.json', JSON.stringify({ name: 'app', dependencies: { next: '16.0.0' } }));
  vi.spyOn(process, 'cwd').mockReturnValue(projectDir);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.mocked(exec).mockReset();
  spinner.stop.mockClear();
  fs.rmSync(projectDir, { recursive: true, force: true });
});

describe('augmentProject', () => {
  it('installs the SDK as a dependency and the CLI as a dev dependency', async () => {
    await augmentProject({ ...OPTIONS, packageManager: 'pnpm' });

    expect(vi.mocked(exec).mock.calls.map(([command, cwd]) => [command.split(/\s+/).join(' '), cwd])).toEqual([
      ['pnpm add @optimizely/cms-sdk', projectDir],
      ['pnpm add -D @optimizely/cms-cli', projectDir],
    ]);
  });

  it('installs nothing with skipInstall', async () => {
    await augmentProject({ ...OPTIONS, skipInstall: true });

    expect(exec).not.toHaveBeenCalled();
  });

  it('copies the config and env template into the project root', async () => {
    await augmentProject(OPTIONS);

    expect(read('optimizely.config.mjs')).toBe(readScaffold('optimizely.config.mjs'));
    expect(read('.env')).toBe(readScaffold('env.template'));
  });

  it('puts the client in lib/ and the catch-all page in app/ without a src directory', async () => {
    await augmentProject(OPTIONS);

    expect(read('lib/optimizely.ts')).toBe(readScaffold('optimizely.ts'));
    expect(read('app/[...slug]/page.tsx')).toBe(readScaffold('catch-all-page.tsx'));
  });

  it('puts the client in src/lib/ when a src directory exists', async () => {
    fs.mkdirSync(projectPath('src'));

    await augmentProject(OPTIONS);

    expect(exists('src/lib/optimizely.ts')).toBe(true);
    expect(exists('lib')).toBe(false);
  });

  it('puts the catch-all page in src/app/ when it exists', async () => {
    fs.mkdirSync(projectPath('src/app'), { recursive: true });

    await augmentProject(OPTIONS);

    expect(exists('src/app/[...slug]/page.tsx')).toBe(true);
    expect(exists('app')).toBe(false);
  });

  it('preserves existing files', async () => {
    const existing = ['optimizely.config.mjs', '.env', 'lib/optimizely.ts', 'app/[...slug]/page.tsx'];

    existing.forEach(it => writeProjectFile(it, 'custom'));

    await augmentProject(OPTIONS);

    existing.forEach(it => expect(read(it), it).toBe('custom'));
  });

  it('adds the opti-push script once the CLI is installed', async () => {
    await augmentProject(OPTIONS);

    expect(readScripts()).toHaveProperty('opti-push');
  });

  it('keeps an existing opti-push script', async () => {
    writeProjectFile('package.json', JSON.stringify({ scripts: { 'opti-push': 'custom push' } }));

    await augmentProject(OPTIONS);

    expect(readScripts()['opti-push']).toBe('custom push');
  });

  it.each([
    ['skipInstall is set', { skipInstall: true }],
    ['the CLI is not requested', { addCli: false }],
  ])('does not add the opti-push script when %s', async (_, overrides) => {
    await augmentProject({ ...OPTIONS, ...overrides });

    expect(readScripts()).not.toHaveProperty('opti-push');
  });

  it('still scaffolds files but skips the script when installation fails', async () => {
    vi.mocked(exec).mockImplementation(() => {
      throw new Error('install failed');
    });

    await augmentProject(OPTIONS);

    expect(spinner.stop).toHaveBeenCalledWith('Failed to install packages. Run install manually.');
    expect(exists('optimizely.config.mjs')).toBe(true);
    expect(readScripts()).not.toHaveProperty('opti-push');
    expect(p.outro).toHaveBeenCalled();
  });
});
