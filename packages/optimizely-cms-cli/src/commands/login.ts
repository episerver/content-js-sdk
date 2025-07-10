import { Command, Flags } from '@oclif/core';
import ora from 'ora';
import { readEnvCredentials } from '../service/config.js';
import { getToken } from '../service/cmsRestClient.js';

export default class Login extends Command {
  static override description = 'login to SaaS CMS';
  static override examples = ['<%= config.bin %> <%= command.id %>'];
  static override flags = {
    verbose: Flags.boolean(),
  };

  public async run(): Promise<void> {
    const credentials = readEnvCredentials();

    if (credentials) {
      const spinner = ora('Checking your credentials...').start();
      try {
        const token = await getToken(
          credentials.clientId,
          credentials.clientSecret
        );

        if (token) {
          spinner.succeed('Your credentials are correct');
        } else {
          spinner.fail('The API did not return a token');
        }
      } catch (err) {
        spinner.clear();
        throw err;
      }

      return;
    }
  }
}
