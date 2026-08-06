import { confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import { BaseCommand } from '../../baseCommand.js';
import ora from 'ora';
import { createApiClient } from '../../service/cmsRestClient.js';

export default class DangerDeleteAllContentTypes extends BaseCommand<
  typeof DangerDeleteAllContentTypes
> {
  static override args = {};
  static override description =
    '⚠️  [DANGER] Delete ALL user-defined content types from the CMS (excludes system types)';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --host https://example.com',
  ];

  public async run(): Promise<void> {
    const { flags } = await this.parse(DangerDeleteAllContentTypes);
    const spinner = ora('Fetching content types from CMS...').start();

    let client;
    try {
      client = await createApiClient(flags.host);
    } catch (error) {
      spinner.fail(chalk.red('Failed to connect to CMS'));
      throw error;
    }

    let contentTypes;
    try {
      const response = await client.GET('/contenttypes');
      contentTypes = response.data?.items;
      spinner.stop();
    } catch (error) {
      spinner.fail(chalk.red('Failed to fetch content types'));
      throw error;
    }

    if (!contentTypes) {
      console.error(chalk.red('Failed to fetch content types from the CMS'));
      process.exit(1);
    }

    const deletableTypes = contentTypes.filter(t => !Boolean(t.source));

    if (deletableTypes.length === 0) {
      console.log(chalk.yellow('There are no user-defined content types in the CMS'));
      return;
    }

    // First confirmation
    const answer = await confirm({
      message: chalk.red.bold(
        `⚠️  This will delete ALL ${deletableTypes.length} user-defined content types. Are you sure?`,
      ),
      default: false,
    });

    if (!answer) {
      console.log(chalk.dim('Operation cancelled.'));
      return;
    }

    console.log();
    console.log(chalk.yellow.bold('💡 Tip: Delete project types only'));
    console.log(
      chalk.dim(
        'If you only want to delete types defined only in your project configuration,',
      ),
    );
    console.log(chalk.dim(`use: ${chalk.cyan('optimizely-cms-cli config delete')}`));

    // Show what will be deleted
    console.log(chalk.yellow.bold('\nContent types that will be deleted:'));
    for (const type of deletableTypes) {
      console.log(chalk.dim('  -'), chalk.yellow(`${type.displayName} (${type.key})`));
    }

    // Second confirmation
    const answer2 = await confirm({
      message: chalk.red.bold(
        '\n⚠️  This action cannot be undone. Proceed with deletion?',
      ),
      default: false,
    });

    if (!answer2) {
      console.log(chalk.dim('Operation cancelled.'));
      return;
    }

    console.log(); // Empty line before deletion starts

    let successCount = 0;
    let failureCount = 0;

    for (const type of deletableTypes) {
      const deleteSpinner = ora(`Deleting ${type.key}...`).start();
      const r = await client.DELETE('/contenttypes/{key}', {
        params: { path: { key: type.key! } },
      });

      if (!r.response.ok) {
        deleteSpinner.fail(chalk.red(`'${type.key}' cannot be deleted`));
        if (r.error) {
          console.error(chalk.dim(`  Error: ${r.error.title || 'Unknown error'}`));
          if (r.response.status === 409 && r.error.code === 'DependencyConflict') {
            console.error(
              chalk.dim(
                '  This type cannot be deleted because content instances of this type exist.',
              ),
            );
            console.error(chalk.dim('  Delete the content items first, then retry.'));
          } else if (r.error.detail) {
            console.error(chalk.dim(`  Details: ${r.error.detail}`));
          }
        }
        failureCount++;
      } else {
        deleteSpinner.succeed(chalk.green(`'${type.key}' deleted`));
        successCount++;
      }
    }

    // Summary
    console.log();
    console.log(chalk.cyan.bold('Summary:'));
    console.log(chalk.green(`  ✓ Successfully deleted: ${successCount}`));
    if (failureCount > 0) {
      console.log(chalk.red(`  ✗ Failed to delete: ${failureCount}`));
    }
  }
}
