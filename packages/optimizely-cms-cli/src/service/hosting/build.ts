/** Local build of a project, run before packaging so build errors surface before the upload */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { hostingErrors } from '../error.js';

// The same package manager the platform picks from the lock file
const buildCommand = (dir: string) =>
  existsSync(join(dir, 'yarn.lock')) ? 'yarn build' : 'npm run build';

/** Run the project's `build` script, and throw with its output when it fails */
export function buildProject(dir: string): Promise<void> {
  const command = buildCommand(dir);

  return new Promise((resolve, reject) => {
    // A shell resolves npm.cmd and yarn.cmd on Windows
    const child = spawn(command, { cwd: dir, shell: true });
    const output: Buffer[] = [];

    child.stdout.on('data', chunk => output.push(chunk));
    child.stderr.on('data', chunk => output.push(chunk));
    child.on('error', reject);
    child.on('close', code =>
      code === 0 ?
        resolve()
      : reject(
          new hostingErrors.BuildFailed(command, code, Buffer.concat(output).toString()),
        ),
    );
  });
}
