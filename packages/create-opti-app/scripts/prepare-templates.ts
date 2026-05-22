import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

const TEMPLATE_MAP: Record<string, string> = {
  'nextjs-starter': path.join(MONOREPO_ROOT, 'samples', 'nextjs-template'),
  'nextjs-alloy': path.join(MONOREPO_ROOT, 'templates', 'alloy-template'),
  'tanstack-starter': path.join(MONOREPO_ROOT, 'samples', 'tanstack-template'),
};

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

function replaceWorkspaceVersions(pkgPath: string, sdkVersion: string, cliVersion: string): void {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

  for (const depKey of ['dependencies', 'devDependencies'] as const) {
    const deps = pkg[depKey];
    if (!deps) continue;
    for (const [name, version] of Object.entries(deps)) {
      if (version === 'workspace:*') {
        if (name === '@optimizely/cms-sdk') deps[name] = `^${sdkVersion}`;
        else if (name === '@optimizely/cms-cli') deps[name] = `^${cliVersion}`;
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
  const sdkVersion = readVersion(path.join(MONOREPO_ROOT, 'packages', 'optimizely-cms-sdk'));
  const cliVersion = readVersion(path.join(MONOREPO_ROOT, 'packages', 'optimizely-cms-cli'));

  console.log(`SDK version: ${sdkVersion}, CLI version: ${cliVersion}`);

  const templatesDir = path.join(ROOT, 'templates');

  for (const [name, srcDir] of Object.entries(TEMPLATE_MAP)) {
    const destDir = path.join(templatesDir, name);

    if (fs.existsSync(destDir)) {
      fs.rmSync(destDir, { recursive: true });
    }

    if (!fs.existsSync(srcDir)) {
      console.warn(`Template source not found: ${srcDir}, skipping.`);
      continue;
    }

    console.log(`Preparing template: ${name}`);
    copyDir(srcDir, destDir);
    normalizeEnvFile(destDir);

    const pkgPath = path.join(destDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      replaceWorkspaceVersions(pkgPath, sdkVersion, cliVersion);
    }
  }

  console.log('Templates prepared.');
}

main();
