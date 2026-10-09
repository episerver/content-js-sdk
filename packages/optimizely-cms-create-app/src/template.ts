import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PACKAGES } from './registry.js';
import type { TemplateName } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const REGISTRY_URL = 'https://registry.npmjs.org';
const REGISTRY_TIMEOUT_MS = 5000;

const EXCLUDE = new Set([
  'node_modules',
  '.next',
  '.tanstack',
  'certificates',
  '.env',
  'next-env.d.ts',
  '.npmrc',
]);

function getTemplateDir(templateName: TemplateName): string {
  return path.resolve(__dirname, '..', 'templates', templateName);
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

function normalizeEnvFile(dir: string): void {
  const candidates = ['.env.in', '.env.example', 'env.example', '.env.template'];
  for (const name of candidates) {
    const filePath = path.join(dir, name);
    if (fs.existsSync(filePath)) {
      fs.renameSync(filePath, path.join(dir, '.env'));
      return;
    }
  }
}

async function fetchLatestVersion(name: string): Promise<string | undefined> {
  try {
    const response = await fetch(`${REGISTRY_URL}/${name}/latest`, { signal: AbortSignal.timeout(REGISTRY_TIMEOUT_MS) });
    if (!response.ok) return undefined;
    const { version } = (await response.json()) as { version?: string };
    return version;
  } catch {
    return undefined;
  }
}

async function fetchLatestVersions(): Promise<Record<string, string>> {
  const names = Object.values(PACKAGES).map(it => it.name);
  const versions = await Promise.all(names.map(fetchLatestVersion));

  return Object.fromEntries(names.flatMap((name, index) => (versions[index] ? [[name, versions[index]]] : [])));
}

// Packages missing from `versions` keep the range bundled at build time
function withLatestVersions(
  deps: Record<string, string> | undefined,
  versions: Record<string, string>,
): Record<string, string> | undefined {
  return deps && Object.fromEntries(Object.entries(deps).map(([name, range]) => [name, versions[name] ? `^${versions[name]}` : range]));
}

export async function copyTemplate(templateName: TemplateName, targetDir: string, projectName: string): Promise<void> {
  const templateDir = getTemplateDir(templateName);

  if (!fs.existsSync(templateDir)) {
    throw new Error(`Template "${templateName}" not found at ${templateDir}`);
  }

  copyDir(templateDir, targetDir);
  normalizeEnvFile(targetDir);

  const pkgPath = path.join(targetDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const versions = await fetchLatestVersions();

    pkg.name = projectName;
    pkg.dependencies = withLatestVersions(pkg.dependencies, versions);
    pkg.devDependencies = withLatestVersions(pkg.devDependencies, versions);
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }
}

export function getScaffoldDir(): string {
  return path.resolve(__dirname, '..', 'templates', 'scaffold');
}
