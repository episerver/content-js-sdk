import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TemplateName } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  const candidates = ['.env.in', '.env.example', 'env.example'];
  for (const name of candidates) {
    const filePath = path.join(dir, name);
    if (fs.existsSync(filePath)) {
      fs.renameSync(filePath, path.join(dir, '.env'));
      return;
    }
  }
}

export function copyTemplate(templateName: TemplateName, targetDir: string, projectName: string): void {
  const templateDir = getTemplateDir(templateName);

  if (!fs.existsSync(templateDir)) {
    throw new Error(`Template "${templateName}" not found at ${templateDir}`);
  }

  copyDir(templateDir, targetDir);
  normalizeEnvFile(targetDir);

  const pkgPath = path.join(targetDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    pkg.name = projectName;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }
}

export function getScaffoldDir(): string {
  return path.resolve(__dirname, '..', 'templates', 'scaffold');
}
