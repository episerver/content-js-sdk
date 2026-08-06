import { Args } from '@oclif/core';
import { confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import ora from 'ora';
import * as path from 'node:path';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { BaseCommand } from '../../baseCommand.js';
import { createApiClient } from '../../service/cmsRestClient.js';
import { findMetaData, readFromPath } from '../../service/utils.js';

export default class ConfigDelete extends BaseCommand<typeof ConfigDelete> {
  static override args = {
    file: Args.string({
      description: 'configuration file',
      default: './optimizely.config.mjs',
    }),
  };

  static override description =
    'Delete content types defined in the project configuration from the CMS';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> ./custom-config.mjs',
    '<%= config.bin %> <%= command.id %> --host https://example.com',
  ];

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(ConfigDelete);

    console.log(chalk.yellow.bold('⚠️  Project-Scoped Deletion'));
    console.log(
      chalk.dim(
        'This command deletes ONLY content types defined in your project configuration.',
      ),
    );
    console.log(
      chalk.dim(
        `To delete ALL user-defined types, use: ${chalk.cyan('optimizely-cms-cli danger delete-all-content-types')}`,
      ),
    );
    console.log();

    const configFilePath = path.resolve(process.cwd(), args.file);

    try {
      await access(configFilePath, constants.R_OK);
    } catch {
      console.error(chalk.red(`Configuration file not found: ${configFilePath}`));
      console.error(chalk.dim('Make sure the file exists and is readable.'));
      process.exit(1);
    }

    const configPath = pathToFileURL(configFilePath).href;
    const { componentPaths } = await readFromPath(configPath);

    if (!componentPaths || !Array.isArray(componentPaths)) {
      console.error(
        chalk.red('Invalid configuration: "components" field must be an array'),
      );
      process.exit(1);
    }

    const configPathDirectory = pathToFileURL(path.dirname(configFilePath)).href;
    const { contentTypes } = await findMetaData(componentPaths, configPathDirectory);

    const projectKeys = new Set(contentTypes.map(ct => ct.key!));

    if (projectKeys.size === 0) {
      console.log(chalk.yellow('No content types defined in project configuration'));
      return;
    }

    const spinner = ora('Fetching content types from CMS...').start();

    let client;
    try {
      client = await createApiClient(flags.host);
    } catch (error) {
      spinner.fail(chalk.red('Failed to connect to CMS'));
      throw error;
    }

    let allCmsTypes;
    try {
      const response = await client.GET('/contenttypes');
      allCmsTypes = response.data?.items;
      spinner.stop();
    } catch (error) {
      spinner.fail(chalk.red('Failed to fetch content types'));
      throw error;
    }

    if (!allCmsTypes) {
      console.error(chalk.red('Failed to fetch content types from the CMS'));
      process.exit(1);
    }

    const projectDefinedInCms = allCmsTypes.filter(
      type => !Boolean(type.source) && projectKeys.has(type.key!),
    );

    const foundKeys = new Set(projectDefinedInCms.map(t => t.key!));
    const missingInCms = Array.from(projectKeys).filter(k => !foundKeys.has(k));
    const typeWord = projectDefinedInCms.length === 1 ? 'type' : 'types';

    if (projectDefinedInCms.length === 0) {
      console.log(chalk.yellow('No project-defined content types found in the CMS'));

      if (missingInCms.length > 0) {
        console.log(chalk.dim('\nNote: The following project types are not in the CMS:'));
        for (const key of missingInCms) {
          console.log(chalk.dim(`  - ${key}`));
        }
      }
      return;
    }

    console.log(chalk.yellow.bold(`\nFound ${projectDefinedInCms.length} project-defined content ${typeWord} in the CMS:`));

    for (const type of projectDefinedInCms) {
      console.log(chalk.dim('  -'), chalk.yellow(`${type.displayName} (${type.key})`));
    }

    if (missingInCms.length > 0) {
      console.log(chalk.dim('\nNote: The following project types are not in the CMS:'));
      for (const key of missingInCms) {
        console.log(chalk.dim(`  - ${key}`));
      }
    }
    const confirmed = await confirm({
      message: chalk.red.bold(`\n⚠️  Delete ${projectDefinedInCms.length} content ${typeWord}? This action cannot be undone.`),
      default: false,
    });

    if (!confirmed) {
      console.log(chalk.dim('Operation cancelled.'));
      return;
    }

    console.log();

    let successCount = 0;
    let failureCount = 0;

    for (const type of projectDefinedInCms) {
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

    console.log();
    console.log(chalk.cyan.bold('Summary:'));
    console.log(chalk.green(`  ✓ Successfully deleted: ${successCount}`));
    if (failureCount > 0) {
      console.log(chalk.red(`  ✗ Failed to delete: ${failureCount}`));
    }
  }
}
