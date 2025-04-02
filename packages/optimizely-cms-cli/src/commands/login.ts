import { input, confirm } from '@inquirer/prompts';
import { Command, Flags } from '@oclif/core';
import ora from 'ora';
import chalk from 'chalk';
import Conf from 'conf';
import { readCredentials, saveCredentials } from '../service/config.js';
import { getToken } from '../service/cmsRestClient.js';

export default class Login extends Command {
  static override description = 'login to SaaS CMS';
  static override examples = ['<%= config.bin %> <%= command.id %>'];
  static override flags = {
    verbose: Flags.boolean(),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Login);
    const conf = new Conf({ projectName: 'optimizely' });

    if (flags.verbose) {
      console.log('Credentials file: ' + chalk.bold(conf.path));
    }

    const instanceUrl = await input({
      message: 'Enter the instance URL (<<something>>.cms.optimizely.com)',
    });

    const credentials = readCredentials(instanceUrl);

    if (
      credentials &&
      !(await confirm({
        message: `Credentials found for ${instanceUrl}. Do you want to override them?`,
      }))
    ) {
      return;
    }

    const clientUrl = new URL(
      '/ui/Optimizely.Cms.Service.Security.Turnstile.UI/Clients/',
      instanceUrl
    );

    console.log(
      `Go to ${chalk.bold(clientUrl.toString())} \nand create a new API Client`
    );

    const oauthClientId = await input({
      message: 'Enter API Client name',
    });
    const oauthClientSecret = await input({
      message: 'Enter API Client secret',
    });

    console.log();

    const spinner = ora('Checking your credentials...').start();

    const token = await getToken(
      instanceUrl.toString(),
      oauthClientId,
      oauthClientSecret
    );

    if (!token) {
      spinner.fail('You introduced the wrong credentials.');
      return;
    }

    // Save credsentials
    saveCredentials(instanceUrl, {
      clientId: oauthClientId,
      clientSecret: oauthClientSecret,
    });

    spinner.succeed(
      'You are now logged in! Your credentials are stored in ' +
        chalk.bold(conf.path)
    );
  }
}
