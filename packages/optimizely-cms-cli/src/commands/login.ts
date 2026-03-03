import { Command, Flags } from '@oclif/core';
import ora from 'ora';
import chalk from 'chalk';
import { readEnvCredentials } from '../service/config.js';
import { getToken } from '../service/cmsRestClient.js';

export default class Login extends Command {
  static override description =
    'Verify your Optimizely CMS credentials configured in environment variables';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --verbose',
  ];
  static override flags = {
    verbose: Flags.boolean({
      description: 'Show detailed output during authentication',
    }),
    host: Flags.string({
      description:
        'CMS instance URL including scheme. For example: `https://my-instance.cms.optimizely.com`',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Login);

    // readEnvCredentials() will throw an error if credentials are missing
    const credentials = readEnvCredentials();

    const spinner = ora('Checking your credentials...').start();

    try {
      const token = await getToken(
        credentials.clientId,
        credentials.clientSecret,
        flags.host,
      );

      if (token) {
        spinner.succeed(chalk.green('Your credentials are correct'));
        if (flags.verbose) {
          console.log(
            chalk.dim('Client ID:'),
            chalk.cyan(credentials.clientId),
          );
          console.log(chalk.dim('Token received successfully'));
        }
      } else {
        spinner.fail(chalk.red('The API did not return a token'));
        console.error(
          chalk.red('Authentication failed: No token received from the API'),
        );
        process.exit(1);
      }
    } catch (err) {
      spinner.fail(chalk.red('Authentication failed'));

      if (flags.verbose && err instanceof Error) {
        console.error(chalk.dim('Error details:'), err.message);
      }

      throw err;
    }
  }
}
