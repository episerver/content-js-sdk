import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as p from '@clack/prompts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runPrompts } from './prompts.js';
import { hasScript } from './utils.js';

const CANCEL = vi.hoisted(() => Symbol('cancel'));

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  select: vi.fn(),
  text: vi.fn(),
  confirm: vi.fn(),
  isCancel: (value: unknown) => value === CANCEL,
  log: { error: vi.fn(), info: vi.fn() },
}));

vi.mock('./utils.js', async importOriginal => ({
  ...(await importOriginal<typeof import('./utils.js')>()),
  hasScript: vi.fn(() => false),
}));

type Answer = string | boolean | symbol;

const BASE_ARGS = { skipInstall: false };
const originalIsTTY = process.stdin.isTTY;

let cwd: string;

// Answers are consumed in prompt order regardless of prompt type
function answer(...answers: Answer[]): void {
  const queue = [...answers];
  const next = async () => queue.shift();

  vi.mocked(p.select).mockImplementation(next as typeof p.select);
  vi.mocked(p.text).mockImplementation(next as typeof p.text);
  vi.mocked(p.confirm).mockImplementation(next as typeof p.confirm);
}

const writeCwdFile = (name: string, content = '') => fs.writeFileSync(path.join(cwd, name), content);
const writeNextProject = () => writeCwdFile('package.json', JSON.stringify({ dependencies: { next: '16.0.0' } }));
const modeChoices = () => vi.mocked(p.select).mock.calls[0][0].options.map(it => it.value);
const textValidator = () => vi.mocked(p.text).mock.calls[0][0].validate!;

beforeEach(() => {
  cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'cms-create-app-prompts-'));
  vi.spyOn(process, 'cwd').mockReturnValue(cwd);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.mocked(hasScript).mockReturnValue(false);
  process.stdin.isTTY = originalIsTTY;
  fs.rmSync(cwd, { recursive: true, force: true });
});

describe('runPrompts mode selection', () => {
  it('goes straight to create mode when a template is given', async () => {
    answer();

    const options = await runPrompts({ ...BASE_ARGS, projectName: 'my-app', template: 'nextjs-starter', packageManager: 'pnpm' });

    expect(p.select).not.toHaveBeenCalled();
    expect(options).toEqual({
      mode: 'create',
      projectName: 'my-app',
      template: 'nextjs-starter',
      packageManager: 'pnpm',
      skipInstall: false,
      ci: 'none',
    });
  });

  it('offers scaffolding inside an existing project', async () => {
    writeNextProject();
    answer(CANCEL);

    await runPrompts(BASE_ARGS);

    expect(modeChoices()).toEqual(['create', 'fresh', 'scaffold']);
  });

  it('does not offer scaffolding outside a project', async () => {
    answer(CANCEL);

    await runPrompts(BASE_ARGS);

    expect(modeChoices()).toEqual(['create', 'fresh']);
  });

  it('does not offer scaffolding when a project name is given', async () => {
    writeNextProject();
    answer(CANCEL);

    await runPrompts({ ...BASE_ARGS, projectName: 'my-app' });

    expect(modeChoices()).toEqual(['create', 'fresh']);
  });

  it('returns null when mode selection is cancelled', async () => {
    answer(CANCEL);

    expect(await runPrompts(BASE_ARGS)).toBeNull();
  });
});

describe('runPrompts create mode', () => {
  it('collects name, template and package manager', async () => {
    answer('create', 'my-app', 'nextjs-alloy', 'yarn');

    expect(await runPrompts({ ...BASE_ARGS, skipInstall: true })).toEqual({
      mode: 'create',
      projectName: 'my-app',
      template: 'nextjs-alloy',
      packageManager: 'yarn',
      skipInstall: true,
      ci: 'none',
    });
  });

  it.each([
    ['project name', ['create', CANCEL]],
    ['template', ['create', 'my-app', CANCEL]],
    ['package manager', ['create', 'my-app', 'nextjs-starter', CANCEL]],
  ])('returns null when the %s prompt is cancelled', async (_, answers) => {
    answer(...answers);

    expect(await runPrompts(BASE_ARGS)).toBeNull();
  });

  it('validates the project name', async () => {
    answer('create', CANCEL);

    await runPrompts(BASE_ARGS);

    const validate = textValidator();

    expect(validate(' ')).toBe('Project name is required');
    expect(validate('My App')).toBe('Only lowercase letters, numbers and hyphens');
    expect(validate('my-app')).toBeUndefined();
  });

  describe('deploy workflow prompt', () => {
    const args = { ...BASE_ARGS, projectName: 'my-app', template: 'nextjs-starter', packageManager: 'npm' } as const;

    beforeEach(() => {
      process.stdin.isTTY = true;
      vi.mocked(hasScript).mockReturnValue(true);
    });

    it('sets ci to github when confirmed', async () => {
      answer(true);

      expect(await runPrompts(args)).toMatchObject({ ci: 'github' });
      expect(p.confirm).toHaveBeenCalledOnce();
    });

    it('returns null when cancelled', async () => {
      answer(CANCEL);

      expect(await runPrompts(args)).toBeNull();
    });

    it('is skipped without a TTY', async () => {
      process.stdin.isTTY = false;
      answer();

      expect(await runPrompts(args)).toMatchObject({ ci: 'none' });
      expect(p.confirm).not.toHaveBeenCalled();
    });

    it('is skipped when --ci is given', async () => {
      answer();

      expect(await runPrompts({ ...args, ci: 'github' })).toMatchObject({ ci: 'github' });
      expect(p.confirm).not.toHaveBeenCalled();
    });

    it('is skipped for templates without a deploy script', async () => {
      vi.mocked(hasScript).mockReturnValue(false);
      answer();

      expect(await runPrompts(args)).toMatchObject({ ci: 'none' });
      expect(p.confirm).not.toHaveBeenCalled();
    });
  });
});

describe('runPrompts fresh mode', () => {
  it('collects name, framework and package manager', async () => {
    answer('fresh', 'my-app', 'tanstack', 'pnpm');

    expect(await runPrompts(BASE_ARGS)).toEqual({
      mode: 'fresh',
      projectName: 'my-app',
      framework: 'tanstack',
      packageManager: 'pnpm',
      skipInstall: false,
    });
  });

  it.each([
    ['project name', ['fresh', CANCEL]],
    ['framework', ['fresh', 'my-app', CANCEL]],
    ['package manager', ['fresh', 'my-app', 'nextjs', CANCEL]],
  ])('returns null when the %s prompt is cancelled', async (_, answers) => {
    answer(...answers);

    expect(await runPrompts(BASE_ARGS)).toBeNull();
  });
});

describe('runPrompts scaffold mode', () => {
  beforeEach(writeNextProject);

  it('returns the detected framework, choices and package manager', async () => {
    writeCwdFile('pnpm-lock.yaml');
    answer('scaffold', true, false);

    expect(await runPrompts(BASE_ARGS)).toEqual({
      mode: 'scaffold',
      framework: 'nextjs',
      addSdk: true,
      addCli: false,
      packageManager: 'pnpm',
      skipInstall: false,
    });
  });

  it('prefers the --pm package manager over detection', async () => {
    writeCwdFile('pnpm-lock.yaml');
    answer('scaffold', true, true);

    expect(await runPrompts({ ...BASE_ARGS, packageManager: 'yarn' })).toMatchObject({ packageManager: 'yarn' });
  });

  it.each([
    ['SDK', ['scaffold', CANCEL]],
    ['CLI', ['scaffold', true, CANCEL]],
  ])('returns null when the %s prompt is cancelled', async (_, answers) => {
    answer(...answers);

    expect(await runPrompts(BASE_ARGS)).toBeNull();
  });

  it('returns null when no supported framework is detected', async () => {
    writeCwdFile('package.json', JSON.stringify({ dependencies: { react: '^19.0.0' } }));
    answer('scaffold');

    expect(await runPrompts(BASE_ARGS)).toBeNull();
    expect(p.log.error).toHaveBeenCalledWith(expect.stringContaining('Could not detect a supported framework'));
    expect(p.confirm).not.toHaveBeenCalled();
  });
});
