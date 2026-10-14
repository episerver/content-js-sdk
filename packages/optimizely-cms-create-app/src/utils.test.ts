import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exec, hasScript, isValidProjectName } from './utils.js';

vi.mock('node:child_process', () => ({ execSync: vi.fn() }));

describe('isValidProjectName', () => {
  it.each(['my-app', 'app', 'app2', '2024-site'])('accepts %s', name => expect(isValidProjectName(name)).toBe(true));

  it.each(['', 'My-App', 'my app', 'my/app', '..', 'my_app', 'my.app', '@scope/app', 'app\n'])(
    'rejects %j',
    name => expect(isValidProjectName(name)).toBe(false),
  );
});

describe('exec', () => {
  afterEach(() => vi.mocked(execSync).mockReset());

  it('runs the command in cwd with piped output', () => {
    exec('npm install', '/project');

    expect(execSync).toHaveBeenCalledWith('npm install', { cwd: '/project', stdio: 'pipe' });
  });

  it('inherits stdio in interactive mode', () => {
    exec('npx create-next-app@latest', '/project', { interactive: true });

    expect(execSync).toHaveBeenCalledWith('npx create-next-app@latest', { cwd: '/project', stdio: 'inherit' });
  });
});

describe('hasScript', () => {
  let projectDir: string;

  const writePackage = (pkg: object) => fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify(pkg));

  beforeEach(() => {
    projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cms-create-app-utils-'));
  });

  afterEach(() => fs.rmSync(projectDir, { recursive: true, force: true }));

  it('is true when the script is defined', () => {
    writePackage({ scripts: { deploy: 'cms deploy' } });

    expect(hasScript(projectDir, 'deploy')).toBe(true);
  });

  it('is false when the script is missing or empty', () => {
    writePackage({ scripts: { build: 'tsc', deploy: '' } });

    expect(hasScript(projectDir, 'deploy')).toBe(false);
    expect(hasScript(projectDir, 'start')).toBe(false);
  });

  it('is false without a scripts section', () => {
    writePackage({ name: 'app' });

    expect(hasScript(projectDir, 'deploy')).toBe(false);
  });

  it('is false without a package.json', () => expect(hasScript(projectDir, 'deploy')).toBe(false));
});
