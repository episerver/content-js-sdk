import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  createPackage,
  resolvePackageName,
  validateProject,
} from '../service/hosting/package.js';

const validPackageJson = {
  name: 'my-site',
  version: '1.2.3',
  scripts: { build: 'next build', start: 'next start' },
  dependencies: { next: '^15.0.0', '@optimizely/cms-sdk': '^2.0.0' },
};

let projectDir: string;

const writeProjectFile = async (path: string, content = '') => {
  await mkdir(dirname(join(projectDir, path)), { recursive: true });
  await writeFile(join(projectDir, path), content);
};

const writePackageJson = (content: object) =>
  writeProjectFile('package.json', JSON.stringify(content));

beforeEach(async () => {
  projectDir = await mkdtemp(join(tmpdir(), 'cli-hosting-'));
});

afterEach(async () => {
  await rm(projectDir, { recursive: true, force: true });
});

describe('validateProject', () => {
  it('returns package.json for a valid npm project', async () => {
    await writePackageJson(validPackageJson);
    await writeProjectFile('package-lock.json', '{}');

    await expect(validateProject(projectDir)).resolves.toEqual(validPackageJson);
  });

  it('accepts a yarn project with Astro as a dev dependency', async () => {
    await writePackageJson({
      ...validPackageJson,
      dependencies: {},
      devDependencies: { astro: '^5.0.0' },
    });
    await writeProjectFile('yarn.lock');

    await expect(validateProject(projectDir)).resolves.toBeDefined();
  });

  it('fails when package.json is missing', async () => {
    await expect(validateProject(projectDir)).rejects.toThrow(/No package.json found/);
  });

  it('reports every problem at once', async () => {
    await writePackageJson({
      name: 'my-site',
      scripts: { build: 'vite build' },
      dependencies: { '@optimizely/cms-sdk': 'workspace:*' },
    });

    const error = await validateProject(projectDir).catch((err) => err);

    expect(error.message).toMatch(/no "start" script/);
    expect(error.message).toMatch(/supports Next.js and Astro/);
    expect(error.message).toMatch(/"@optimizely\/cms-sdk" uses "workspace:\*"/);
    expect(error.message).toMatch(/No package-lock.json or yarn.lock found/);
  });

  it('rejects a pnpm-only project with a hint', async () => {
    await writePackageJson(validPackageJson);
    await writeProjectFile('pnpm-lock.yaml');

    await expect(validateProject(projectDir)).rejects.toThrow(
      /\(found pnpm-lock.yaml\).*npm install --package-lock-only/,
    );
  });

  it('rejects more than one supported lock file', async () => {
    await writePackageJson(validPackageJson);
    await writeProjectFile('package-lock.json', '{}');
    await writeProjectFile('yarn.lock');

    await expect(validateProject(projectDir)).rejects.toThrow(
      /package-lock.json and yarn.lock.*exactly one lock file/,
    );
  });
});

describe('resolvePackageName', () => {
  const now = new Date('2026-10-05T11:55:10.123Z');

  it('appends a UTC timestamp to the package.json version', () => {
    expect(resolvePackageName(validPackageJson, {}, now)).toBe(
      'my-site.head.app.1.2.3-20261005115510.zip',
    );
  });

  it('strips the npm scope and special characters', () => {
    expect(
      resolvePackageName({ name: '@acme/my_site.web', version: '1.0.0' }, {}, now),
    ).toBe('mysiteweb.head.app.1.0.0-20261005115510.zip');
  });

  it('uses the overrides as given', () => {
    expect(
      resolvePackageName(validPackageJson, { name: 'site', version: '2.0.0' }, now),
    ).toBe('site.head.app.2.0.0.zip');
  });

  it('rejects an invalid name override', () => {
    expect(() => resolvePackageName(validPackageJson, { name: 'my site' })).toThrow(
      /Invalid package name "my site"/,
    );
  });

  it('rejects a name that is empty after sanitizing', () => {
    expect(() => resolvePackageName({ name: '@acme/__' })).toThrow(
      /Invalid package name ""/,
    );
  });
});

describe('createPackage', () => {
  it('zips the source and leaves out build output, dependencies and secrets', async () => {
    await Promise.all(
      [
        'package.json',
        'package-lock.json',
        'pnpm-lock.yaml',
        'src/app/page.tsx',
        'public/logo.svg',
        '.env.example',
        '.env.template',
        '.env',
        '.env.local',
        'node_modules/next/index.js',
        'packages/ui/node_modules/react/index.js',
        '.next/server/app.js',
        'dist/server/entry.mjs',
        'out/index.html',
        'certificates/localhost-key.pem',
        'otel-output.log',
        'tsconfig.tsbuildinfo',
        '.git/HEAD',
        'old.head.app.1.0.0.zip',
        'stride_content.episerverdata',
      ].map((file) => writeProjectFile(file, 'content')),
    );

    const outputDir = join(projectDir, 'out');
    const { path, files } = await createPackage(projectDir, 'site.head.app.1.0.0.zip', outputDir);

    expect(files).toEqual([
      '.env.example',
      '.env.template',
      'package-lock.json',
      'package.json',
      'public/logo.svg',
      'src/app/page.tsx',
    ]);
    expect(path).toBe(join(outputDir, 'site.head.app.1.0.0.zip'));
    expect((await readFile(path)).subarray(0, 2).toString()).toBe('PK');
  });
});
