import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildProject } from '../service/hosting/build.js';

let projectDir: string;

const writeBuildScript = (build: string) =>
  writeFile(join(projectDir, 'package.json'), JSON.stringify({ scripts: { build } }));

beforeEach(async () => {
  projectDir = await mkdtemp(join(tmpdir(), 'cli-hosting-build-'));
});

afterEach(async () => {
  await rm(projectDir, { recursive: true, force: true });
});

describe('buildProject', () => {
  it('resolves when the build script succeeds', async () => {
    await writeBuildScript('node -e "process.exit(0)"');

    await expect(buildProject(projectDir, 'npm')).resolves.toBeUndefined();
  });

  it('throws with the command, exit code and build output when the build fails', async () => {
    await writeBuildScript(`node -e "console.error('Type error: oops'); process.exit(2)"`);

    await expect(buildProject(projectDir, 'npm')).rejects.toThrow(
      /`npm run build` failed with exit code 2[\s\S]*--no-build[\s\S]*Type error: oops/,
    );
  });
});
