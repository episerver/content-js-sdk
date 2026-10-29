import { spawn } from 'node:child_process';
import { hostingErrors } from '../error.js';
import type { PackageManager } from './package.js';

/** Run the project's `build` script locally, so build errors surface before the upload */
export function buildProject(dir: string, packageManager: PackageManager): Promise<void> {
  const command = `${packageManager} run build`;

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
