import { Flags } from '@oclif/core';
import { resolve } from 'node:path';
import ora from 'ora';
import chalk from 'chalk';
import { input, select } from '@inquirer/prompts';
import { BaseCommand } from '../../baseCommand.js';
import { mkdir } from 'node:fs/promises';
import { createApiClient } from '../../service/cmsRestClient.js';
import { Manifest } from '../../utils/manifest.js';
import {
  generateContentCode,
  generateFilePath,
  generateGroups,
  generateManifestCode,
  generateManifestFilePath,
} from '../../utils/generate.js';
import { getRelevantPath, makeDirs, makeFile, makeFiles } from '../../utils/make.js';
import { formatCounts, validateManifest } from '../../utils/general.js';
import { filterOutBuiltinTypes } from '../../utils/mapping.js';

export default class ConfigPull extends BaseCommand<typeof ConfigPull> {
  static override flags = {
    includeReadOnly: Flags.boolean({
      char: 'i',
      aliases: ['include-read-only'],
      description:
        'Include read-only content types in the manifest. This may include system-generated content types that are not editable in the CMS.',
      default: false,
    }),
    output: Flags.string({
      char: 'o',
      description: 'Output directory for generated files',
      exclusive: ['json'],
    }),
    json: Flags.boolean({
      char: 'j',
      description: 'Output manifest as JSON to stdout (useful for piping)',
      exclusive: ['individual', 'single-file', 'group', 'output'],
      default: false,
    }),
    'single-file': Flags.boolean({
      char: 's',
      description: 'Produce single file containing all types',
      exclusive: ['individual', 'group', 'json'],
      default: false,
    }),
    individual: Flags.boolean({
      char: 'i',
      description: 'Write each type to a separate file',
      exclusive: ['single-file', 'group', 'json'],
      default: false,
    }),
    group: Flags.boolean({
      char: 'g',
      description:
        'Group files by base type (page/, component/, section/, etc.) and co-locate display templates with their content types',
      exclusive: ['individual', 'single-file', 'json'],
      default: false,
    }),
  };
  static override description =
    'Pull content types from CMS. Generates TypeScript files interactively or outputs JSON with --json flag';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --output ./src/types',
    '<%= config.bin %> <%= command.id %> --group',
    '<%= config.bin %> <%= command.id %> --output ./src/types --group',
    '<%= config.bin %> <%= command.id %> --include-read-only',
    '<%= config.bin %> <%= command.id %> --json > manifest.json',
    '<%= config.bin %> <%= command.id %> --json | jq .contentTypes',
  ];

  // API METHODS

  /**
   * Fetches the manifest from CMS
   * @throws Error with descriptive message if fetch fails
   */
  private async fetchManifest(host?: string, includeReadOnly?: boolean) {
    const restClient = await createApiClient(host);
    const { data, error, response } = await restClient.GET('/manifest', {
      params: {
        query: {
          sections: ['contentTypes', 'displayTemplates', 'propertyGroups'],
          ...(includeReadOnly ? { includeReadOnly } : {}),
        },
      },
    });
    if (error || (response && !response.ok)) {
      throw new Error(this.buildErrorMessage(error, response));
    }
    return data;
  }

  // ERROR HANDLING

  /**
   * Builds formatted error message from API response
   */
  private buildErrorMessage(error: any, response: any): string {
    const status = error?.status ?? response?.status;
    const title = error?.title ?? error?.message ?? response?.statusText;
    const detail = error?.detail;

    let message = 'Failed to fetch manifest from CMS';
    if (status) message += chalk.dim(` (status ${status})`);
    if (title) message += `: ${chalk.yellow(title)}`;
    if (detail) message += chalk.dim(` - ${detail}`);

    return message;
  }

  /**
   * Validates response is not empty and handles error if it is
   * @returns true if response is valid, false otherwise
   */
  private handleEmptyResponse(response: any, spinner: any): boolean {
    if (!response) {
      spinner.fail('The server did not respond with any content');
      process.exitCode = 1;
      return false;
    }
    return true;
  }

  // UTILITY METHODS

  private getManifestCounts(manifest: Manifest) {
    const contentTypeCount = manifest.contentTypes.length;
    const displayTemplateCount = manifest.displayTemplates?.length || 0;
    const totalCount = contentTypeCount + displayTemplateCount;
    return { contentTypeCount, displayTemplateCount, totalCount };
  }

  private logManifestStats(manifest: Manifest, spinner: any) {
    const { contentTypeCount, displayTemplateCount } = this.getManifestCounts(manifest);

    console.log();
    spinner.info(`Content types: ${contentTypeCount}`);
    spinner.info(`Display templates: ${displayTemplateCount}`);
    console.log();
  }

  private logGeneratedFiles(
    files: { path: string; content: string }[],
    outputDir: string,
  ) {
    const displayPaths = files.map(file => getRelevantPath(file.path, outputDir)).sort();

    console.log();
    console.log(chalk.cyan.bold('\nGenerated files:'));
    displayPaths.forEach(path => console.log(chalk.dim('  -'), chalk.green(path)));
    console.log();
  }

  private warnAboutReadOnly(includeReadOnly: boolean) {
    if (includeReadOnly)
      this.log(
        chalk.yellow(
          'Pulling all content types including read-only ones. This may include system-generated content types that are not editable in the CMS.',
        ),
      );
  }

  // OUTPUT HANDLERS

  /**
   * Handles JSON output mode - fetches and outputs manifest as JSON to stdout
   */
  private async handleJsonOutput(flags: any, includeReadOnly: boolean): Promise<void> {
    if (flags.json && (flags.output || flags.group)) {
      this.warn(
        'Flags --output and --group are ignored when --json is used. Remove --json to generate TypeScript files.',
      );
    }

    const spinner = ora({
      stream: process.stderr,
      text: 'Downloading configuration from CMS',
    }).start();

    try {
      const response = await this.fetchManifest(flags.host, includeReadOnly);
      if (!this.handleEmptyResponse(response, spinner)) return;

      spinner.succeed(` Downloaded configuration from CMS (${formatCounts(response)})`);

      try {
        this.log(JSON.stringify(response, null, 2));
      } catch (serializeError) {
        spinner.fail('Failed to serialize response to JSON');
        process.exitCode = 1;
        throw new Error(
          'Response contains unserializable data (circular references or BigInt values)',
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spinner.fail(errorMessage);
      process.exitCode = 1;
      throw error;
    }
  }

  private async handleSingleFileOutput(
    outputDir: string,
    outputPath: string,
    manifest: Manifest,
  ): Promise<void> {
    const spinner = ora('Generating file').start();
    await mkdir(outputDir, { recursive: true });

    await makeFile({
      path: generateManifestFilePath(outputDir),
      content: generateManifestCode(manifest),
    });

    this.logManifestStats(manifest, spinner);
    spinner.succeed(` Generated manifest.ts file in ${outputPath}`);
  }

  private async handleIndividualOutput(
    outputDir: string,
    outputPath: string,
    manifest: Manifest,
  ): Promise<void> {
    const { totalCount } = this.getManifestCounts(manifest);
    const spinner = ora(
      `Generating ${totalCount} file${totalCount !== 1 ? 's' : ''}`,
    ).start();

    await mkdir(outputDir, { recursive: true });

    const allContents = [...manifest.contentTypes, ...(manifest.displayTemplates || [])];
    const files = allContents.map(content => ({
      path: generateFilePath(content, outputDir, false),
      content: generateContentCode(content, manifest, false),
    }));

    await makeFiles(files);

    this.logGeneratedFiles(files, outputDir);
    this.logManifestStats(manifest, spinner);
    spinner.succeed(` Generated ${files.length} file(s) in ${outputPath}`);
  }

  private async handleGroupOutput(
    outputDir: string,
    outputPath: string,
    manifest: Manifest,
  ): Promise<void> {
    const { totalCount } = this.getManifestCounts(manifest);
    const spinner = ora(
      `Generating ${totalCount} file${totalCount !== 1 ? 's' : ''}`,
    ).start();

    await mkdir(outputDir, { recursive: true });

    const allContents = [...manifest.contentTypes, ...(manifest.displayTemplates || [])];
    const files = allContents.map(content => ({
      path: generateFilePath(content, outputDir, true),
      content: generateContentCode(content, manifest, true),
    }));

    await Promise.all([
      makeDirs(generateGroups(allContents), outputDir),
      makeFiles(files),
    ]);

    this.logGeneratedFiles(files, outputDir);
    this.logManifestStats(manifest, spinner);
    spinner.succeed(` Generated ${files.length} file(s) in ${outputPath}`);
  }

  // MAIN EXECUTION

  public async run(): Promise<void | any> {
    const { flags } = await this.parse(ConfigPull);
    const isInteractive = process.stdout.isTTY === true;
    const shouldOutputJson = flags.json || !isInteractive;
    const includeReadOnly = flags.includeReadOnly;

    if (shouldOutputJson) return this.handleJsonOutput(flags, includeReadOnly);

    // Warn only after json output, to avoid crowding sdtout
    this.warnAboutReadOnly(includeReadOnly);

    const outputType =
      flags['single-file'] ? 'single-file'
      : flags.individual ? 'individual'
      : flags.group ? 'group'
      : isInteractive ?
        await select({
          message: 'How would you like to organize the output?',
          choices: [
            {
              name: 'Group by base type (page/, component/, section/, etc.)',
              value: 'group',
            },
            { name: 'Individual files', value: 'individual' },
            { name: 'Single file', value: 'single-file' },
          ],
          default: 'group',
        })
      : 'group';

    // Prompt for output directory if not provided
    const outputPath =
      flags.output ||
      (isInteractive ?
        await input({
          message: 'Where should the generated file(s) be saved?',
          default: './src/content-types',
        })
      : './src/content-types');
    const outputDir = resolve(process.cwd(), outputPath);

    const spinner = ora('Downloading configuration from CMS').start();

    try {
      const response = await this.fetchManifest(flags.host, includeReadOnly);
      if (!this.handleEmptyResponse(response, spinner)) return;

      spinner.text = 'Validating manifest';

      if (!validateManifest(response)) {
        spinner.fail('Invalid manifest: contentTypes array not found');
        process.exitCode = 1;
        return;
      }

      const manifest = response as unknown as Manifest;
      manifest.contentTypes = filterOutBuiltinTypes(manifest.contentTypes);

      spinner.succeed(' Downloaded configuration from CMS');

      switch (outputType) {
        case 'single-file':
          return this.handleSingleFileOutput(outputDir, outputPath, manifest);
        case 'individual':
          return this.handleIndividualOutput(outputDir, outputPath, manifest);
        default:
          return this.handleGroupOutput(outputDir, outputPath, manifest);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spinner.fail(errorMessage);
      process.exitCode = 1;
      throw error;
    }
  }
}
