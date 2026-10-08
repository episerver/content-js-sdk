import { Command, Errors, Flags } from '@oclif/core';
import { confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { readHostingCredentials } from '../service/config.js';
import {
  createDeploymentClient,
  toLiveSiteUrl,
  type Deployment,
  type DeploymentClient,
  type DeploymentStatus,
} from '../service/hosting/deploymentClient.js';
import {
  createPackage,
  resolvePackageName,
  validateProject,
} from '../service/hosting/package.js';
import { waitForDeployment } from '../service/hosting/waitForDeployment.js';

// Not enforced: the names come from the DXP management portal and are not publicly documented
const ENVIRONMENT_EXAMPLES = ['Test1', 'Test2', 'Production1'].join(', ');

const FIRST_DEPLOYMENT_HINT =
  'If this is the first deployment, add the site hostname (also on the Hostnames tab of the DXP management portal) to your application: in the hosts of optimizely.config.mjs followed by `config push`, or in CMS Settings > Applications';

// By content, not position: the platform replaces the lists at each stage
const newItems = (current: string[] = [], previous: string[] = []) =>
  current.filter(it => !previous.includes(it));

export default class Deploy extends Command {
  static override description =
    'Package the project and deploy it to Optimizely front-end hosting. Reads the credentials from OPTIMIZELY_DXP_PROJECT_ID, OPTIMIZELY_DXP_CLIENT_KEY and OPTIMIZELY_DXP_CLIENT_SECRET';
  static override examples = [
    '<%= config.bin %> <%= command.id %> --env Test1',
    '<%= config.bin %> <%= command.id %> --env Production1 --yes',
    '<%= config.bin %> <%= command.id %> --env Test1 --no-complete',
    '<%= config.bin %> <%= command.id %> --output ./out',
  ];
  static override flags = {
    env: Flags.string({
      char: 'e',
      description: `target environment, for example ${ENVIRONMENT_EXAMPLES} (required unless --output)`,
    }),
    dir: Flags.string({ description: 'project directory', default: '.' }),
    output: Flags.string({
      char: 'o',
      description: 'write the package to this directory instead of deploying it',
    }),
    name: Flags.string({ description: 'package name (default: the package.json name)' }),
    version: Flags.string({
      description:
        'exact package version (default: the package.json version plus a UTC timestamp)',
    }),
    complete: Flags.boolean({
      description:
        'complete the deployment after it reaches verification; use --no-complete to stop before',
      default: true,
      allowNo: true,
    }),
    yes: Flags.boolean({
      char: 'y',
      description:
        'do not ask for confirmation before deploying to a Production environment',
    }),
    timeout: Flags.integer({
      description: 'minutes to wait for each deployment stage',
      default: 30,
      min: 1,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Deploy);
    const dir = resolve(flags.dir);
    const packageJson = await validateProject(dir);
    const packageName = resolvePackageName(packageJson, {
      name: flags.name,
      version: flags.version,
    });

    if (flags.output) {
      const { path, files } = await createPackage(
        dir,
        packageName,
        resolve(flags.output),
      );

      ora().succeed(`Wrote ${path} (${files.length} files)`);
      return;
    }

    const { env } = flags;

    if (!env)
      this.error(`Missing required flag --env, for example ${ENVIRONMENT_EXAMPLES}`);

    const credentials = readHostingCredentials();

    await this.confirmProduction(env, flags.yes);

    const client = createDeploymentClient(credentials, {
      userAgent: `${this.config.name}/${this.config.version}`,
    });

    await this.step(`Checking access to ${env}`, () =>
      client.checkEnvironmentAccess(env),
    );

    const tempDir = await mkdtemp(join(tmpdir(), 'optimizely-deploy-'));

    try {
      const { path, files } = await this.step(`Packaging ${packageName}`, () =>
        createPackage(dir, packageName, tempDir),
      );

      this.log(chalk.dim(`  ${files.length} files`));

      await this.step('Uploading package', () => client.uploadPackage(packageName, path));

      const { id } = await this.step(`Starting deployment to ${env}`, () =>
        client.startDeployment(env, packageName),
      );
      const { verification, deployment } = await this.deploy(
        client,
        id,
        flags.complete,
        flags.timeout,
      );

      if (deployment.status === 'AwaitingVerification') {
        this.printUrls(deployment.validationLinks);
        this.log(
          `Deployment ${id} is awaiting verification. Complete or reset it in the DXP management portal`,
        );
        return;
      }

      ora().succeed(`Deployment ${id} succeeded`);
      // A completed deployment returns no links, so the live URL is derived from the slot URL
      this.printUrls(
        deployment.validationLinks?.length ?
          deployment.validationLinks
        : (verification.validationLinks ?? []).flatMap(link => toLiveSiteUrl(link) ?? []),
      );
      this.log(chalk.dim(FIRST_DEPLOYMENT_HINT));
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  }

  private async confirmProduction(env: string, yes: boolean) {
    // Production environments are numbered (Production1), so match the prefix
    if (!/^production/i.test(env) || yes || !process.stdout.isTTY) return;

    const confirmed = await confirm({ message: `Deploy to ${env}?`, default: false });

    if (!confirmed) throw new Errors.CLIError('Deployment cancelled');
  }

  private async deploy(
    client: DeploymentClient,
    id: string,
    complete: boolean,
    timeoutMinutes: number,
  ): Promise<{ verification: Deployment; deployment: Deployment }> {
    const report = this.progressReporter();
    const waitFor = (label: string, until: DeploymentStatus[]) =>
      this.step(label, spinner =>
        waitForDeployment(() => client.getDeployment(id), {
          until,
          timeoutMinutes,
          onUpdate: report(spinner, label),
        }),
      );

    const verification = await waitFor(`Deploying ${id}`, [
      'AwaitingVerification',
      'Succeeded',
    ]);

    if (verification.status !== 'AwaitingVerification' || !complete)
      return { verification, deployment: verification };

    await client.completeDeployment(id);

    return {
      verification,
      deployment: await waitFor('Completing deployment', ['Succeeded']),
    };
  }

  private printUrls(urls: string[] = []) {
    urls.forEach(url => this.log(`  ${chalk.cyan(url)}`));
  }

  /** Spinner text carries the percentage; status changes, warnings and errors are logged once across all stages so CI output shows them */
  private progressReporter() {
    let previous: Deployment | undefined;

    return (spinner: Ora, label: string) => (deployment: Deployment) => {
      const lines = [
        ...(deployment.status !== previous?.status ?
          [chalk.dim(`  Status: ${deployment.status}`)]
        : []),
        ...newItems(deployment.deploymentWarnings, previous?.deploymentWarnings).map(
          warning => chalk.yellow(`  Warning: ${warning}`),
        ),
        ...newItems(deployment.deploymentErrors, previous?.deploymentErrors).map(error =>
          chalk.red(`  Error: ${error}`),
        ),
      ];

      previous = deployment;

      if (lines.length > 0) {
        spinner.clear();
        lines.forEach(line => this.log(line));
      }

      spinner.text = `${label} (${deployment.percentComplete ?? 0}%)`;
    };
  }

  private async step<T>(text: string, action: (spinner: Ora) => Promise<T>): Promise<T> {
    const spinner = ora(text).start();

    try {
      const result = await action(spinner);

      spinner.succeed(text);
      return result;
    } catch (error) {
      spinner.fail(text);
      throw error;
    }
  }
}

