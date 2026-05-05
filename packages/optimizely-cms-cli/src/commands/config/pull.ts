import { Flags } from '@oclif/core';
import { resolve } from 'node:path';
import ora from 'ora';
import chalk from 'chalk';
import { input, confirm } from '@inquirer/prompts';
import { BaseCommand } from '../../baseCommand.js';
import { mkdir } from 'node:fs/promises';
import { createApiClient } from '../../service/cmsRestClient.js';
import { Manifest } from '../../utils/manifest.js';
import { filterSystemContentTypes } from '../../utils/mapping.js';
import { generateCode, generateFilePath, generateGroups } from '../../utils/generate.js';
import { getRelevantPath, makeDirs, makeFiles } from '../../utils/make.js';
import { formatCounts, validateManifest } from '../../utils/general.js';

export default class ConfigPull extends BaseCommand<typeof ConfigPull> {
  static override flags = {
    output: Flags.string({
      description: 'Output directory for generated files',
    }),
    group: Flags.boolean({
      description:
        'Group files by base type (page/, component/, section/, etc.) and co-locate display templates with their content types',
    }),
    json: Flags.boolean({
      description: 'Output manifest as JSON to stdout (useful for piping)',
      default: false,
    }),
    includeReadOnly: Flags.boolean({
      aliases: ['include-read-only'],
      description:
        'Include read-only content types in the manifest. This may include system-generated content types that are not editable in the CMS.',
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

  /**
   * Handles JSON output mode - fetches and outputs manifest as JSON to stdout
   */
  private async handleJsonOutput(flags: any, includeReadOnly: boolean): Promise<void> {
    // Warn if flags meant for file generation mode are provided with --json
    if (flags.json && (flags.output || flags.group)) {
      this.warn(
        'Flags --output and --group are ignored when --json is used. Remove --json to generate TypeScript files.',
      );
    }

    // Use stderr for spinner when outputting JSON to stdout
    const spinner = ora({
      stream: process.stderr,
      text: 'Downloading configuration from CMS',
    }).start();

    try {
      const response = await this.fetchManifest(flags.host, includeReadOnly);

      if (!this.handleEmptyResponse(response, spinner)) return;

      // Show count in success message
      spinner.succeed(` Downloaded configuration from CMS (${formatCounts(response)})`);

      // Safely serialize JSON with error handling
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
    // Non-2xx responses have undefined data; check error/response instead
    if (error || (response && !response.ok)) {
      throw new Error(this.buildErrorMessage(error, response));
    }
    return data;
  }

  public async run(): Promise<void | any> {
    let isGroupBy: boolean;
    const { flags } = await this.parse(ConfigPull);

    // Detect interactive mode using stdout.isTTY (not stdin.isTTY)
    // to avoid prompting when output is redirected or piped
    const isInteractive = process.stdout.isTTY === true;

    // The output mode based on flags and environment
    // 1. --json flag explicitly requests JSON output
    // 2. --output flag explicitly requests file generation (even in non-TTY environments like CI)
    // 3. Fallback to TTY detection for backward compatibility (non-interactive → JSON)
    const shouldOutputJson = flags.json || (!flags.output && !isInteractive);

    const includeReadOnly = flags.includeReadOnly;

    if (includeReadOnly) {
      this.log(
        chalk.yellow(
          'Pulling all content types including read-only ones. This may include system-generated content types that are not editable in the CMS.',
        ),
      );
    }

    // If JSON output mode, output manifest to stdout
    if (shouldOutputJson) return this.handleJsonOutput(flags, includeReadOnly);

    // Prompt for output directory if not provided
    const outputPath =
      flags.output ||
      (isInteractive ?
        await input({
          message: 'Where should the generated files be saved?',
          default: './src/content-types',
        })
      : './src/content-types');

    // Prompt for grouping if not provided
    isGroupBy =
      flags.group ??
      (isInteractive ?
        await confirm({
          message: 'Should the generated files be grouped?',
          default: false,
        })
      : false); // Default to non-grouped in non-interactive environments

    const outputDir = resolve(process.cwd(), outputPath);

    const spinner = ora('Downloading configuration from CMS').start();

    try {
      // Pull from CMS
      const response = await this.fetchManifest(flags.host, includeReadOnly);

      if (!this.handleEmptyResponse(response, spinner)) return;

      spinner.text = 'Validating manifest';

      if (!validateManifest(response)) {
        spinner.fail('Invalid manifest: contentTypes array not found');
        process.exitCode = 1; // Set error exit code
        return;
      }

      const manifest = response as unknown as Manifest;
      manifest.contentTypes = filterSystemContentTypes(manifest.contentTypes);

      // Show count in spinner text
      const contentTypeCount = manifest.contentTypes.length;
      spinner.text = `Generating files for ${contentTypeCount} content type${contentTypeCount !== 1 ? 's' : ''}`;

      // Ensure output directory exists
      await mkdir(outputDir, { recursive: true });

      const allContents = [...manifest.contentTypes, ...(manifest.displayTemplates || [])];

      const files = allContents.map(content => ({
        path: generateFilePath(content, outputDir, isGroupBy),
        content: generateCode(content, manifest, isGroupBy),
      }));

      await Promise.all([
        isGroupBy ? makeDirs(generateGroups(allContents), outputDir) : Promise.resolve(),
        makeFiles(files),
      ]);

      const displayPaths = files.map(file => getRelevantPath(file.path, outputDir)).sort();

      console.log();
      console.log(chalk.cyan.bold('\nGenerated files:'));
      displayPaths.forEach(path => console.log(chalk.dim('  -'), chalk.green(path)));
      console.log();

      spinner.succeed(` Generated ${files.length} file(s) in ${outputPath}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spinner.fail(errorMessage);
      process.exitCode = 1;
      throw error;
    }
  }
}
