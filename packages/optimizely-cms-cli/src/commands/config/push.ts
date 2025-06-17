import { Args, Flags } from '@oclif/core';
import * as path from 'node:path';
import ora from 'ora';
import { BaseCommand } from '../../baseCommand.js';
import { writeFile } from 'node:fs/promises';
import { createApiClient } from '../../service/cmsRestClient.js';
import { findMetaData, readFromPath } from '../../service/utils.js';
import { mapContentToManifest } from '../../mapper/contentToPackage.js';
import { pathToFileURL } from 'node:url';
import chalk from 'chalk';

export default class ConfigPush extends BaseCommand<typeof ConfigPush> {
  static override args = {
    file: Args.string({ description: 'configuration file', required: true }),
  };
  static override flags = {
    host: Flags.string({ description: 'CMS instance URL' }),
    output: Flags.string({ description: 'if passed, write the manifest JSON' }),
    dryRun: Flags.boolean({
      description: 'do not send anything to the server',
    }),
    force: Flags.boolean({
      description:
        'Force updates the content type even though the changes might result in data loss.',
    }),
  };
  static override description = 'describe the command here';
  static override examples = ['<%= config.bin %> <%= command.id %>'];

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(ConfigPush);
    const configPath = pathToFileURL(
      path.resolve(process.cwd(), args.file)
    ).href;

    const componentPaths = await readFromPath(configPath);
    //the pattern is relative to the config file
    const configPathDirectory = path.dirname(configPath);

    // extracts metadata(contentTypes, displayTemplates) from the component paths
    const { contentTypes, displayTemplates } = await findMetaData(
      componentPaths,
      configPathDirectory
    );

    const metaData = {
      contentTypes: mapContentToManifest(contentTypes),
      displayTemplates,
    };

    const restClient = await createApiClient(flags.host);

    if (flags.output) {
      await writeFile(flags.output, JSON.stringify(metaData, null, 2));
      console.info(`Configuration file written in '${flags.output}'`);
    }

    if (flags.dryRun) {
      return;
    }

    if (flags.force) {
      console.warn(
        `${chalk.yellowBright.bold(
          '--force'
        )} is used!. This forces content type updates, which may result in data loss`
      );
    }

    const spinner = ora('Uploading configuration file').start();

    const response = await restClient.POST('/packages', {
      headers: {
        accept: 'application/json',
        'content-type': 'application/vnd.optimizely.cms.v1.manifest+json',
      },
      body: metaData as any,
      params: {
        query: {
          ignoreDataLossWarnings: flags.force,
        },
      },
    });

    if (response.error) {
      spinner.fail('Error');
      console.error(
        'Error %s %s (%s)',
        response.error.status,
        response.error.title,
        response.error.code
      );
      console.error(response.error.detail);
      return;
    }

    spinner.succeed('Configuration file uploaded');

    if (!response.data) {
      console.error('The server did not respond with any content');
      return;
    }

    const data = response.data;

    if (data.outcomes && data.outcomes.length > 0) {
      console.log('Outcomes:');
      for (const r of response.data?.outcomes ?? []) {
        console.log(`- ${r.message}`);
      }
    }

    if (data.warnings && data.warnings.length > 0) {
      console.log('Warnings:');
      for (const r of data.warnings) {
        console.log(`- ${r.message}`);
      }
    }

    if (data.errors && data.errors.length > 0) {
      console.log('Errors:');
      for (const r of data.errors) {
        console.log(`- ${r.message}`);
      }
    }
  }
}
