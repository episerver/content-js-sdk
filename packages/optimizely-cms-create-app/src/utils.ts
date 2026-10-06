import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export function exec(command: string, cwd: string, options?: { interactive?: boolean }): void {
  execSync(command, { cwd, stdio: options?.interactive ? 'inherit' : 'pipe' });
}

export function isValidProjectName(name: string): boolean {
  return /^[a-z0-9-]+$/.test(name);
}

/** Whether the package.json in `dir` defines `script` */
export function hasScript(dir: string, script: string): boolean {
  const pkgPath = path.join(dir, 'package.json');

  return fs.existsSync(pkgPath) && Boolean(JSON.parse(fs.readFileSync(pkgPath, 'utf-8')).scripts?.[script]);
}
