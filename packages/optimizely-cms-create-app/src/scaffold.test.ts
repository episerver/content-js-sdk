import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as p from '@clack/prompts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFreshProject, createProject } from './scaffold.js';
import { copyTemplate } from './template.js';
import type { CreateOptions, FreshCreateOptions } from './types.js';
import { exec } from './utils.js';

const spinner = vi.hoisted(() => ({ start: vi.fn(), stop: vi.fn() }));

vi.mock('@clack/prompts', () => ({
  spinner: () => spinner,
  note: vi.fn(),
  outro: vi.fn(),
  log: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), success: vi.fn() },
}));

vi.mock('./template.js', async importOriginal => ({
  ...(await importOriginal<typeof import('./template.js')>()),
  copyTemplate: vi.fn(),
}));

vi.mock('./utils.js', async importOriginal => ({
  ...(await importOriginal<typeof import('./utils.js')>()),
  exec: vi.fn(),
}));

class ExitError extends Error {}

const CREATE_OPTIONS: CreateOptions = {
  mode: 'create',
  projectName: 'my-app',
  template: 'nextjs-starter',
  packageManager: 'npm',
  skipInstall: false,
  ci: 'none',
};

const FRESH_OPTIONS: FreshCreateOptions = {
  mode: 'fresh',
  projectName: 'my-app',
  framework: 'nextjs',
  packageManager: 'npm',
  skipInstall: false,
};

let cwd: string;
let targetDir: string;

const nextSteps = () => String(vi.mocked(p.note).mock.calls[0][0]);
const warnings = () => vi.mocked(p.log.warn).mock.calls.map(([message]) => message);

const failWith = (message: string) => () => {
  throw new Error(message);
};

function templateWithScripts(scripts: Record<string, string>): void {
  vi.mocked(copyTemplate).mockImplementation(async (_, dir) => {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ scripts }));
  });
}

beforeEach(() => {
  cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'cms-create-app-scaffold-'));
  targetDir = path.join(cwd, 'my-app');
  vi.spyOn(process, 'cwd').mockReturnValue(cwd);
  vi.spyOn(process, 'exit').mockImplementation(code => {
    throw new ExitError(`exit ${code}`);
  });
  templateWithScripts({ dev: 'next dev' });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.mocked(exec).mockReset();
  fs.rmSync(cwd, { recursive: true, force: true });
});

describe('createProject', () => {
  it('exits when the target directory already exists', async () => {
    fs.mkdirSync(targetDir);

    await expect(createProject(CREATE_OPTIONS)).rejects.toThrow(ExitError);
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(copyTemplate).not.toHaveBeenCalled();
  });

  it('exits when the template cannot be copied', async () => {
    vi.mocked(copyTemplate).mockRejectedValue(new Error('disk full'));

    await expect(createProject(CREATE_OPTIONS)).rejects.toThrow(ExitError);
    expect(p.log.error).toHaveBeenCalledWith('Error: disk full');
    expect(exec).not.toHaveBeenCalled();
  });

  it('copies the template and installs dependencies in the new directory', async () => {
    await createProject({ ...CREATE_OPTIONS, packageManager: 'pnpm' });

    expect(copyTemplate).toHaveBeenCalledWith('nextjs-starter', targetDir, 'my-app');
    expect(exec).toHaveBeenCalledWith('pnpm install', targetDir);
    expect(p.outro).toHaveBeenCalledWith('Your project is ready!');
  });

  it('finishes with a manual-install hint when installation fails', async () => {
    vi.mocked(exec).mockImplementation(failWith('install failed'));

    await createProject(CREATE_OPTIONS);

    expect(spinner.stop).toHaveBeenCalledWith('Failed to install dependencies. Run install manually.');
    expect(p.outro).toHaveBeenCalledWith('Your project is ready!');
  });

  it.each([
    ['npm', 'npm run dev'],
    ['pnpm', 'pnpm dev'],
    ['yarn', 'yarn dev'],
  ] as const)('uses %s in the next steps', async (packageManager, devCommand) => {
    await createProject({ ...CREATE_OPTIONS, packageManager });

    expect(nextSteps()).toContain('cd my-app');
    expect(nextSteps()).toContain(devCommand);
  });

  it('skips installation and lists the install command with skipInstall', async () => {
    await createProject({ ...CREATE_OPTIONS, packageManager: 'yarn', skipInstall: true });

    expect(exec).not.toHaveBeenCalled();
    expect(nextSteps().split('\n')).toContain('yarn');
  });

  it('adds the deploy workflow for a deployable template with ci github', async () => {
    templateWithScripts({ deploy: 'optimizely-cms-cli deploy' });

    await createProject({ ...CREATE_OPTIONS, ci: 'github' });

    expect(fs.existsSync(path.join(targetDir, '.github', 'workflows', 'deploy-optimizely.yml'))).toBe(true);
    expect(nextSteps()).toContain('npm run deploy -- --env Test1');
  });

  it('warns instead of adding a workflow when the template cannot deploy', async () => {
    await createProject({ ...CREATE_OPTIONS, ci: 'github' });

    expect(fs.existsSync(path.join(targetDir, '.github'))).toBe(false);
    expect(warnings()).toEqual([expect.stringContaining('no deploy workflow was added')]);
  });

  it('asks pnpm users for an npm lock file instead of showing deploy steps', async () => {
    templateWithScripts({ deploy: 'optimizely-cms-cli deploy' });

    await createProject({ ...CREATE_OPTIONS, packageManager: 'pnpm' });

    expect(nextSteps()).not.toContain('deploy');
    expect(warnings()).toEqual([expect.stringContaining('npm install --package-lock-only')]);
  });
});

describe('createFreshProject', () => {
  it('exits when the target directory already exists', async () => {
    fs.mkdirSync(targetDir);

    await expect(createFreshProject(FRESH_OPTIONS)).rejects.toThrow(ExitError);
    expect(exec).not.toHaveBeenCalled();
  });

  it('exits for an unknown framework', async () => {
    await expect(createFreshProject({ ...FRESH_OPTIONS, framework: 'remix' })).rejects.toThrow(ExitError);
    expect(p.log.error).toHaveBeenCalledWith('Unknown framework: remix');
    expect(exec).not.toHaveBeenCalled();
  });

  it('exits when the create command fails', async () => {
    vi.mocked(exec).mockImplementation(failWith('create failed'));

    await expect(createFreshProject(FRESH_OPTIONS)).rejects.toThrow(ExitError);
    expect(p.log.error).toHaveBeenCalledWith(expect.stringContaining('create-next-app@latest is available'));
  });

  it('exits when the create command does not produce the directory', async () => {
    await expect(createFreshProject(FRESH_OPTIONS)).rejects.toThrow(ExitError);
    expect(p.log.error).toHaveBeenCalledWith('Project directory "my-app" was not created.');
  });

  it('runs the framework create command interactively and returns the new directory', async () => {
    vi.mocked(exec).mockImplementation(() => fs.mkdirSync(targetDir));

    await expect(createFreshProject(FRESH_OPTIONS)).resolves.toBe(targetDir);
    expect(exec).toHaveBeenCalledWith('npx create-next-app@latest my-app', cwd, { interactive: true });
  });
});
