import fs from 'node:fs';
import path from 'node:path';
import type { Framework, PackageManager } from './types.js';
import { FRAMEWORKS } from './registry.js';

export function detectFramework(dir: string): Framework | null {
  const pkgPath = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgPath)) return null;

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    for (const fw of FRAMEWORKS) {
      if (fw.detectPackage in allDeps) return fw.key as Framework;
    }

    return null;
  } catch {
    return null;
  }
}

export function detectPackageManager(dir: string): PackageManager {
  if (fs.existsSync(path.join(dir, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(dir, 'yarn.lock'))) return 'yarn';
  return 'npm';
}

export function isExistingProject(dir: string): boolean {
  return fs.existsSync(path.join(dir, 'package.json'));
}
