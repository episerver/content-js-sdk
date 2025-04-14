import { Args, Flags } from '@oclif/core';
import * as path from 'node:path';
import ora from 'ora';
import { BaseCommand } from '../../baseCommand.js';
import { writeFile } from 'node:fs/promises';
import chalk from 'chalk';
import { createApiClient } from '../../service/cmsRestClient.js';
import {
  AnyContentType,
  DisplayTemplate,
  findMetaData,
} from '../../service/utils.js';
import { mapContentToManifest } from '../../mapper/contentToPackage.js';

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
  };
  static override description = 'describe the command here';
  static override examples = ['<%= config.bin %> <%= command.id %>'];

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(ConfigPush);
    const configPath = path.resolve(process.cwd(), args.file);

    const jsConfig = await import(configPath).then(
      // Assume that the default import _is_ a jsConfig
      (m) => m.default
    );

    if (typeof jsConfig.contentTypes === 'string') {
      const contentData: AnyContentType[] = [];
      const displayTemData: DisplayTemplate[] = [];
      //the pattern is relative to the config file
      const configPathDirectory = path.dirname(configPath);

      const { contentTypes, displayTemplates } = await findMetaData(
        {
          contentTypePath: jsConfig.contentTypes,
          displayTemplatePath: jsConfig.displayTemplates,
        },
        configPathDirectory
      );

      for (const ct of contentTypes) {
        console.log(
          'Content type %s found in %s',
          chalk.bold(ct.contentType.key),
          chalk.bold(ct.path)
        );
        contentData.push({ ...ct.contentType });
      }

      for (const dt of displayTemplates) {
        console.log(
          'Display template type %s found in %s',
          chalk.bold(dt.displayTemplates.key),
          chalk.bold(dt.path)
        );
        displayTemData.push({ ...dt.displayTemplates });
      }

      jsConfig.contentTypes = mapContentToManifest(contentData);
      jsConfig.displayTemplates = displayTemData;
    }

    const restClient = await createApiClient(flags.host);

    if (flags.output) {
      await writeFile(flags.output, JSON.stringify(jsConfig, null, 2));
      console.log(`Configuration file written in '${flags.output}'`);
    }

    if (flags.dryRun) {
      return;
    }

    const spinner = ora('Uploading configuration file').start();

    const response = await restClient
      .POST('/packages', {
        body: jsConfig as string,
      })
      .then((r) => r.data);

    spinner.succeed('Configuration file uploaded');

    if (!response) {
      console.error('The server did not respond with any content');
      return;
    }

    if (response.outcomes && response.outcomes.length > 0) {
      console.log('Outcomes:');
      for (const r of response?.outcomes ?? []) {
        console.log(`- ${r.message}`);
      }
    }

    if (response.warnings && response.warnings.length > 0) {
      console.log('Warnings:');
      for (const r of response.warnings) {
        console.log(`- ${r.message}`);
      }
    }

    if (response.errors && response.errors.length > 0) {
      console.log('Errors:');
      for (const r of response.errors) {
        console.log(`- ${r.message}`);
      }
    }
  }
}
