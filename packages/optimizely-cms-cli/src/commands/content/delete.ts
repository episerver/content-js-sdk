import { Args } from '@oclif/core';
import { confirm } from '@inquirer/prompts';
import ora from 'ora';
import chalk from 'chalk';
import { BaseCommand } from '../../baseCommand.js';
import { createApiClient } from '../../service/cmsRestClient.js';

export default class ContentDelete extends BaseCommand<typeof ContentDelete> {
  static override args = {
    key: Args.string({
      description: 'Unique content type key to delete',
      required: true,
    }),
  };
  static override description = 'Delete a content type definition from the CMS';
  static override examples = [
    '<%= config.bin %> <%= command.id %> Article',
    '<%= config.bin %> <%= command.id %> ProductPage',
  ];

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(ContentDelete);

    // Confirm before deletion
    const confirmed = await confirm({
      message: `Are you sure you want to delete the content type "${chalk.yellow(args.key)}"? This action cannot be undone.`,
      default: false,
    });

    if (!confirmed) {
      console.log(chalk.dim('Deletion cancelled.'));
      return;
    }

    const spinner = ora(`Deleting content type "${args.key}"...`).start();

    try {
      const client = await createApiClient(flags.host);
      const r = await client.DELETE('/contenttypes/{key}', {
        params: {
          path: {
            key: args.key,
          },
        },
      });

      if (r.response.ok) {
        spinner.succeed(chalk.green(`Content type "${args.key}" deleted successfully`));
      } else {
        spinner.fail(chalk.red(`Failed to delete content type "${args.key}"`));

        if (r.error) {
          if (r.error.status === 404) {
            console.error(chalk.red(`Content type "${args.key}" not found`));
          } else if (r.error.status === 409) {
            console.error(chalk.red('Cannot delete: Content type is in use'));
          } else {
            console.error(chalk.red(`Error ${r.error.status}: ${r.error.title || 'Unknown error'}`));
            if (r.error.detail) {
              console.error(chalk.dim(r.error.detail));
            }
          }
        } else {
          console.error(chalk.red('An unexpected error occurred'));
        }

        process.exit(1);
      }
    } catch (error) {
      spinner.fail(chalk.red('Failed to delete content type'));
      if (error instanceof Error) {
        console.error(chalk.red(error.message));
      }
      throw error;
    }
  }
}
