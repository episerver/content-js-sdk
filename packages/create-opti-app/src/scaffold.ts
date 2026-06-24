import fs from 'node:fs';
import path from 'node:path';
import * as p from '@clack/prompts';
import type { CreateOptions, FreshCreateOptions } from './types.js';
import { copyTemplate } from './template.js';
import { getInstallCommand } from './package-manager.js';
import { exec } from './utils.js';
import { FRAMEWORKS } from './registry.js';

export async function createProject(options: CreateOptions): Promise<void> {
  const targetDir = path.resolve(process.cwd(), options.projectName);

  if (fs.existsSync(targetDir)) {
    p.log.error(`Directory "${options.projectName}" already exists.`);
    process.exit(1);
  }

  const s = p.spinner();

  s.start('Copying template files...');
  try {
    copyTemplate(options.template, targetDir, options.projectName);
    s.stop('Template files copied.');
  } catch (error) {
    s.stop('Failed to copy template.');
    p.log.error(String(error));
    process.exit(1);
  }

  if (!options.skipInstall) {
    s.start('Installing dependencies...');
    try {
      exec(getInstallCommand(options.packageManager), targetDir);
      s.stop('Dependencies installed.');
    } catch {
      s.stop('Failed to install dependencies. Run install manually.');
    }
  }

  p.note(
    [
      `cd ${options.projectName}`,
      '# Configure your CMS credentials in .env',
      `${options.packageManager === 'npm' ? 'npm run' : options.packageManager} dev`,
    ].join('\n'),
    'Next steps',
  );

  p.outro('Your project is ready!');
}

export async function createFreshProject(options: FreshCreateOptions): Promise<string> {
  const targetDir = path.resolve(process.cwd(), options.projectName);

  if (fs.existsSync(targetDir)) {
    p.log.error(`Directory "${options.projectName}" already exists.`);
    process.exit(1);
  }

  const fw = FRAMEWORKS.find(f => f.key === options.framework);
  if (!fw) {
    p.log.error(`Unknown framework: ${options.framework}`);
    process.exit(1);
  }

  const s = p.spinner();

  s.start(`Creating ${fw.label} project...`);
  try {
    exec(`${fw.createCommand} ${options.projectName}`, process.cwd());
    s.stop(`${fw.label} project created.`);
  } catch {
    s.stop(`Failed to create ${fw.label} project. Make sure ${fw.createCommand.split(' ')[1]} is available.`);
    process.exit(1);
  }

  return targetDir;
}
