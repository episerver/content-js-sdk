import fs from 'node:fs';
import path from 'node:path';
import * as p from '@clack/prompts';
import type { ScaffoldOptions } from './types.js';
import { getAddCommand } from './package-manager.js';
import { getScaffoldDir } from './template.js';
import { exec } from './utils.js';

export async function augmentProject(options: ScaffoldOptions): Promise<void> {
  const cwd = process.cwd();
  const s = p.spinner();

  const deps: string[] = [];
  const devDeps: string[] = [];

  if (options.addSdk) deps.push('@optimizely/cms-sdk');
  if (options.addCli) devDeps.push('@optimizely/cms-cli');

  if (!options.skipInstall && (deps.length > 0 || devDeps.length > 0)) {
    s.start('Installing packages...');
    try {
      if (deps.length > 0) {
        exec(getAddCommand(options.packageManager, deps, false), cwd);
      }
      if (devDeps.length > 0) {
        exec(getAddCommand(options.packageManager, devDeps, true), cwd);
      }
      s.stop('Packages installed.');
    } catch {
      s.stop('Failed to install packages. Run install manually.');
    }
  }

  const scaffoldDir = path.join(getScaffoldDir(), 'nextjs');

  copyIfNotExists(
    path.join(scaffoldDir, 'optimizely.config.mjs'),
    path.join(cwd, 'optimizely.config.mjs'),
  );

  copyIfNotExists(
    path.join(scaffoldDir, 'env.template'),
    path.join(cwd, '.env'),
  );

  if (options.framework === 'nextjs') {
    const catchAllDir = path.join(cwd, 'src', 'app', '[...slug]');
    const catchAllPage = path.join(catchAllDir, 'page.tsx');
    if (!fs.existsSync(catchAllPage)) {
      fs.mkdirSync(catchAllDir, { recursive: true });
      copyIfNotExists(
        path.join(scaffoldDir, 'catch-all-page.tsx'),
        catchAllPage,
      );
    }
  }

  if (options.addCli) {
    addScriptToPackageJson(cwd, 'opti-push', 'optimizely-cms-cli manifest push');
  }

  p.note(
    [
      '# Configure your CMS credentials in .env',
      '# Then start developing',
    ].join('\n'),
    'Next steps',
  );

  p.outro('Optimizely CMS SDK added to your project!');
}

function copyIfNotExists(src: string, dest: string): void {
  if (fs.existsSync(dest)) return;
  if (!fs.existsSync(src)) return;
  fs.copyFileSync(src, dest);
}

function addScriptToPackageJson(dir: string, scriptName: string, scriptCommand: string): void {
  const pkgPath = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgPath)) return;

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  if (!pkg.scripts) pkg.scripts = {};
  if (pkg.scripts[scriptName]) return;

  pkg.scripts[scriptName] = scriptCommand;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}
