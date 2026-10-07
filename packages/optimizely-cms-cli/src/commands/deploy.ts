import { Command, Errors, Flags } from '@oclif/core';
import { confirm, select } from '@inquirer/prompts';
import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { addApplicationHosts, listApplications } from '../service/applicationService.js';
import { readEnvCredentials, readHostingCredentials } from '../service/config.js';
import {
  createDeploymentClient,
  type Deployment,
  type DeploymentClient,
} from '../service/hosting/deploymentClient.js';
import {
  createPackage,
  resolvePackageName,
  validateProject,
} from '../service/hosting/package.js';
import { waitForDeployment } from '../service/hosting/waitForDeployment.js';

// Not enforced: the front-end hosting environment names are not publicly documented yet
const KNOWN_ENVIRONMENTS = ['Test1', 'Test2', 'Production'];

const MANUAL_HOSTNAME_STEP =
  'If this is the first deployment, add the hostname to the application in CMS Settings > Applications, or deploy with --application';

const newItems = (current: string[] = [], previous: string[] = []) =>
  current.slice(previous.length);

const hasCmsCredentials = () => {
  try {
    readEnvCredentials();
    return true;
  } catch {
    return false;
  }
};

export default class Deploy extends Command {
  static override description =
    'Package the project and deploy it to Optimizely front-end hosting. Reads the credentials from OPTIMIZELY_DXP_PROJECT_ID, OPTIMIZELY_DXP_CLIENT_KEY and OPTIMIZELY_DXP_CLIENT_SECRET';
  static override examples = [
    '<%= config.bin %> <%= command.id %> --env Test1',
    '<%= config.bin %> <%= command.id %> --env Production --yes',
    '<%= config.bin %> <%= command.id %> --env Test1 --no-complete',
    '<%= config.bin %> <%= command.id %> --env Test1 --application my-site',
    '<%= config.bin %> <%= command.id %> --output ./out',
  ];
  static override flags = {
    env: Flags.string({
      char: 'e',
      description: `target environment, for example ${KNOWN_ENVIRONMENTS.join(', ')} (required unless --output)`,
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
      description: 'do not ask for confirmation before deploying to Production',
    }),
    timeout: Flags.integer({
      description: 'minutes to wait for each deployment stage',
      default: 30,
      min: 1,
    }),
    application: Flags.string({
      description:
        'key of the CMS application to add the deployed hostname to (needs OPTIMIZELY_CMS_CLIENT_ID and OPTIMIZELY_CMS_CLIENT_SECRET)',
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

    if (!flags.env)
      this.error(
        `Missing required flag --env, for example ${KNOWN_ENVIRONMENTS.join(', ')}`,
      );

    const credentials = readHostingCredentials();

    await this.confirmProduction(flags.env, flags.yes);

    const client = createDeploymentClient(credentials, {
      userAgent: `${this.config.name}/${this.config.version}`,
    });
    const tempDir = await mkdtemp(join(tmpdir(), 'optimizely-deploy-'));

    try {
      const { path, files } = await this.step(`Packaging ${packageName}`, () =>
        createPackage(dir, packageName, tempDir),
      );

      this.log(chalk.dim(`  ${files.length} files`));

      await this.step('Uploading package', async () =>
        client.uploadPackage(await client.getPackageLocation(), packageName, path),
      );

      const { id } = await this.step(`Starting deployment to ${flags.env}`, () =>
        client.startDeployment(flags.env!, packageName),
      );
      const deployment = await this.deploy(client, id, flags.complete, flags.timeout);

      (deployment.validationLinks ?? []).forEach(link =>
        this.log(`  ${chalk.cyan(link)}`),
      );

      if (deployment.status === 'AwaitingVerification') {
        this.log(
          `Deployment ${id} is awaiting verification. Complete or reset it in the DXP management portal`,
        );
        return;
      }

      await this.connectApplication(deployment, flags.application);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  }

  private async confirmProduction(env: string, yes: boolean) {
    if (env.toLowerCase() !== 'production' || yes || !process.stdout.isTTY) return;

    const confirmed = await confirm({ message: 'Deploy to Production?', default: false });

    if (!confirmed) throw new Errors.CLIError('Deployment cancelled');
  }

  private async deploy(
    client: DeploymentClient,
    id: string,
    complete: boolean,
    timeoutMinutes: number,
  ): Promise<Deployment> {
    const verification = await this.step(`Deploying ${id}`, spinner =>
      waitForDeployment(() => client.getDeployment(id), {
        until: ['AwaitingVerification', 'Succeeded'],
        timeoutMinutes,
        onUpdate: this.reportProgress(spinner, `Deploying ${id}`),
      }),
    );

    if (verification.status !== 'AwaitingVerification' || !complete) return verification;

    await client.completeDeployment(id);

    return this.step('Completing deployment', spinner =>
      waitForDeployment(() => client.getDeployment(id), {
        until: ['Succeeded'],
        timeoutMinutes,
        onUpdate: this.reportProgress(spinner, 'Completing deployment'),
      }),
    );
  }

  /** Spinner text carries the percentage; status changes, warnings and errors are logged so CI output shows them */
  private reportProgress(spinner: Ora, label: string) {
    return (deployment: Deployment, previous?: Deployment) => {
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

      spinner.clear();
      lines.forEach(line => this.log(line));
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

  /** Adds the deployed hostname to a CMS application: always with --application, otherwise only after asking in a terminal */
  private async connectApplication(deployment: Deployment, applicationKey?: string) {
    const authorities = (deployment.validationLinks ?? []).map(
      link => new URL(link).host,
    );
    const interactive = process.stdout.isTTY === true;

    if (authorities.length === 0) return;
    if (!applicationKey && !(interactive && hasCmsCredentials()))
      return this.log(chalk.dim(MANUAL_HOSTNAME_STEP));

    try {
      const key = applicationKey ?? (await this.chooseApplication());

      if (!key) return;
      if (
        !applicationKey &&
        !(await confirm({
          message: `Add ${authorities.join(', ')} to the CMS application "${key}"?`,
          default: true,
        }))
      )
        return this.log(chalk.dim(MANUAL_HOSTNAME_STEP));

      const added = await this.step(`Adding the hostname to application "${key}"`, () =>
        addApplicationHosts(key, authorities),
      );

      this.log(
        chalk.dim(
          added.length > 0 ?
            `  Added ${added.join(', ')}`
          : '  The hostname was already assigned',
        ),
      );
    } catch (error) {
      throw new Errors.CLIError(
        `The deployment succeeded, but the hostname was not added to the CMS application: ${(error as Error).message}`,
      );
    }
  }

  private async chooseApplication(): Promise<string | undefined> {
    const applications = await listApplications();

    if (applications.length === 0) {
      this.log(
        chalk.dim(
          'No CMS application found. Define one in optimizely.config.mjs, run `config push`, then deploy again with --application',
        ),
      );
      return undefined;
    }
    if (applications.length === 1) return applications[0].key;

    return select({
      message: 'Add the hostname to which CMS application?',
      choices: applications.map(app => ({
        name: `${app.displayName} (${app.key})`,
        value: app.key,
      })),
    });
  }
}

