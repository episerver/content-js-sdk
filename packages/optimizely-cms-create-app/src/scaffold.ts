import fs from 'node:fs';
import path from 'node:path';
import * as p from '@clack/prompts';
import type { CreateOptions, FreshCreateOptions } from './types.js';
import { copyTemplate, getScaffoldDir } from './template.js';
import { getInstallCommand } from './package-manager.js';
import { exec, hasScript } from './utils.js';
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

  if (options.ci === 'github') addDeployWorkflow(targetDir);

  if (!options.skipInstall) {
    s.start('Installing dependencies...');
    try {
      exec(getInstallCommand(options.packageManager), targetDir);
      s.stop('Dependencies installed.');
    } catch {
      s.stop('Failed to install dependencies. Run install manually.');
    }
  }

  const { packageManager } = options;
  const canDeploy = hasScript(targetDir, 'deploy');

  p.note(
    [
      `cd ${options.projectName}`,
      ...(options.skipInstall ? [`${packageManager} install`] : []),
      '# Configure your CMS credentials in .env',
      `${packageManager === 'npm' ? 'npm run' : packageManager} dev`,
      ...(canDeploy && packageManager !== 'pnpm' ? deployInstructions(packageManager) : []),
      ...(options.ci === 'github' ? ['# Add the OPTIMIZELY_DXP_* values as GitHub repository secrets'] : []),
    ].join('\n'),
    'Next steps',
  );

  if (canDeploy && packageManager === 'pnpm')
    p.log.warn(
      'Optimizely front-end hosting installs with npm or yarn. Before deploying, create a lock file with `npm install --package-lock-only`.',
    );

  p.outro('Your project is ready!');
}

const addDeployWorkflow = (targetDir: string) => {
  const workflowsDir = path.join(targetDir, '.github', 'workflows');

  fs.mkdirSync(workflowsDir, { recursive: true });
  fs.copyFileSync(
    path.join(getScaffoldDir(), 'github', 'deploy-optimizely.yml'),
    path.join(workflowsDir, 'deploy-optimizely.yml'),
  );
};

// `pnpm deploy` is a built-in pnpm command, so the script is always run through npm or yarn
const deployInstructions = (packageManager: 'npm' | 'yarn') => [
  '# Deploy to Optimizely front-end hosting (credentials in .env)',
  `${packageManager === 'npm' ? 'npm run deploy --' : 'yarn deploy'} --env Test1`,
];

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

  p.log.info(`Creating ${fw.label} project...`);
  try {
    exec(`${fw.createCommand} ${options.projectName}`, process.cwd(), { interactive: true });
  } catch {
    p.log.error(`Failed to create ${fw.label} project. Make sure ${fw.createCommand.split(' ')[1]} is available.`);
    process.exit(1);
  }

  if (!fs.existsSync(targetDir)) {
    p.log.error(`Project directory "${options.projectName}" was not created.`);
    process.exit(1);
  }

  p.log.success(`${fw.label} project created.`);
  return targetDir;
}
