import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEMPLATES, PACKAGES } from '../src/registry.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MONOREPO_ROOT = path.resolve(ROOT, '..', '..');

const EXCLUDE = new Set([
  'node_modules',
  '.next',
  '.tanstack',
  'certificates',
  '.env',
  'next-env.d.ts',
  '.npmrc',
  '.git',
]);

function readVersion(pkgDir: string): string {
  const pkg = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf-8'));
  return pkg.version;
}

function copyDir(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (EXCLUDE.has(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const WORKSPACE_PACKAGES: Record<string, keyof typeof PACKAGES> = {
  [PACKAGES.sdk.name]: 'sdk',
  [PACKAGES.cli.name]: 'cli',
};

function replaceWorkspaceVersions(pkgPath: string, versions: Record<string, string>): void {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

  for (const depKey of ['dependencies', 'devDependencies'] as const) {
    const deps = pkg[depKey];
    if (!deps) continue;
    for (const [name, version] of Object.entries(deps)) {
      if (version === 'workspace:*' && name in versions) {
        deps[name] = `^${versions[name]}`;
      }
    }
  }

  delete pkg.private;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}

function normalizeEnvFile(dir: string): void {
  const candidates = ['.env.in', '.env.example', 'env.example'];
  for (const name of candidates) {
    const filePath = path.join(dir, name);
    if (fs.existsSync(filePath)) {
      fs.renameSync(filePath, path.join(dir, '.env.template'));
      return;
    }
  }
}

function main(): void {
  const versions: Record<string, string> = {};
  for (const [, pkg] of Object.entries(PACKAGES)) {
    versions[pkg.name] = readVersion(path.join(MONOREPO_ROOT, pkg.pkgDir));
  }

  console.log(`Package versions: ${Object.entries(versions).map(([n, v]) => `${n}@${v}`).join(', ')}`);

  const templatesDir = path.join(ROOT, 'templates');

  for (const template of TEMPLATES) {
    const srcDir = path.join(MONOREPO_ROOT, template.source);
    const destDir = path.join(templatesDir, template.name);

    if (fs.existsSync(destDir)) {
      fs.rmSync(destDir, { recursive: true });
    }

    if (!fs.existsSync(srcDir)) {
      console.warn(`Template source not found: ${srcDir}, skipping.`);
      continue;
    }

    console.log(`Preparing template: ${template.name}`);
    copyDir(srcDir, destDir);
    normalizeEnvFile(destDir);

    const pkgPath = path.join(destDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      replaceWorkspaceVersions(pkgPath, versions);
    }
  }

  console.log('Templates prepared.');
}

main();
