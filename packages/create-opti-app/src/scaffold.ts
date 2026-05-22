import fs from 'node:fs';
import path from 'node:path';
import * as p from '@clack/prompts';
import type { CreateOptions } from './types.js';
import { copyTemplate } from './template.js';
import { getInstallCommand } from './package-manager.js';
import { exec } from './utils.js';

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
