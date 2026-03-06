import { Flags } from '@oclif/core';
import { resolve, join } from 'node:path';
import ora from 'ora';
import chalk from 'chalk';
import { input, confirm } from '@inquirer/prompts';
import { BaseCommand } from '../../baseCommand.js';
import { mkdir } from 'node:fs/promises';
import { createApiClient } from '../../service/cmsRestClient.js';
import { generateContentTypeFiles } from '../../generators/contentTypeGenerator.js';
import { generateDisplayTemplateFiles } from '../../generators/displayTemplateGenerator.js';
import { ContentType } from '../../generators/manifest.js';
import { processDisplayTemplates } from '../../utils/mapping.js';

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
  };
  static override description =
    'Pull content types from CMS. Generates TypeScript files interactively or outputs JSON with --json flag';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --output ./src/types',
    '<%= config.bin %> <%= command.id %> --group',
    '<%= config.bin %> <%= command.id %> --output ./src/types --group',
    '<%= config.bin %> <%= command.id %> --json > manifest.json',
    '<%= config.bin %> <%= command.id %> --json | jq .contentTypes',
  ];

  /**
   * Fetches the manifest from CMS
   * @throws Error with descriptive message if fetch fails
   */
  private async fetchManifest(host?: string) {
    const restClient = await createApiClient(host);
    const { data, error, response } = await restClient.GET(
      '/experimental/packages',
    );
    // Non-2xx responses have undefined data; check error/response instead
    if (error || (response && !response.ok)) {
      const status = (error as any)?.status ?? response?.status;
      const title =
        (error as any)?.title ??
        (error as any)?.message ??
        response?.statusText;
      const detail = (error as any)?.detail;

      // Build formatted error message
      let message = 'Failed to fetch manifest from CMS';
      if (status) {
        message += chalk.dim(` (status ${status})`);
      }
      if (title) {
        message += `: ${chalk.yellow(title)}`;
      }
      if (detail) {
        message += chalk.dim(` - ${detail}`);
      }

      throw new Error(message);
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

    // If JSON output mode, output manifest to stdout
    if (shouldOutputJson) {
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
        const response = await this.fetchManifest(flags.host);

        if (!response) {
          spinner.fail('The server did not respond with any content');
          process.exitCode = 1; // Set error exit code
          return;
        }

        // Show count in success message
        const contentTypeCount = response.contentTypes?.length || 0;
        const propertyGroupCount = response.propertyGroups?.length || 0;
        const displayTemplateCount = response.displayTemplates?.length || 0;
        spinner.succeed(
          `Downloaded configuration from CMS (${contentTypeCount} content type${contentTypeCount !== 1 ? 's' : ''}, ${propertyGroupCount} property group${propertyGroupCount !== 1 ? 's' : ''}, ${displayTemplateCount} display template${displayTemplateCount !== 1 ? 's' : ''})`,
        );

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
        return;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        spinner.fail(errorMessage);
        process.exitCode = 1;
        throw error;
      }
    }

    // Prompt for output directory if not provided
    const outputPath = flags.output
      ? flags.output
      : isInteractive
        ? await input({
            message: 'Where should the generated files be saved?',
            default: './src/content-types',
          })
        : './src/content-types'; // Default for non-interactive environments

    // Prompt for grouping if not provided
    isGroupBy =
      flags.group ??
      (isInteractive
        ? await confirm({
            message: 'Should the generated files be grouped?',
            default: false,
          })
        : false); // Default to non-grouped in non-interactive environments

    const outputDir = resolve(process.cwd(), outputPath);

    const spinner = ora('Downloading configuration from CMS').start();

    try {
      // Pull from CMS
      const response = await this.fetchManifest(flags.host);

      if (!response) {
        spinner.fail('The server did not respond with any content');
        process.exitCode = 1; // Set error exit code
        return;
      }

      const manifest = response;

      spinner.text = 'Validating manifest';

      if (!manifest.contentTypes || !Array.isArray(manifest.contentTypes)) {
        spinner.fail('Invalid manifest: contentTypes array not found');
        process.exitCode = 1; // Set error exit code
        return;
      }

      // Filter out _image, _video, _media content types as they are not relevant for code generation
      // Also filter out BlankExperience and BlankSection as they are internally provided by the SDK
      manifest.contentTypes = manifest.contentTypes.filter(
        (ct: any) =>
          !['_image', '_video', '_media'].includes(ct.baseType) &&
          !['BlankExperience', 'BlankSection'].includes(ct.key),
      );

      // Show count in spinner text
      const contentTypeCount = manifest.contentTypes.length;
      spinner.text = `Generating files for ${contentTypeCount} content type${contentTypeCount !== 1 ? 's' : ''}`;

      // Ensure output directory exists
      await mkdir(outputDir, { recursive: true });

      if (isGroupBy) {
        const groups: Record<string, ContentType[]> = {};
        const displayTemplatesByContentType = new Map<string, any[]>();
        const orphanedDisplayTemplates: any[] = [];
        const contentTypeToGroupMap = new Map<string, string>();

        spinner.text = 'Grouping content types by base type';

        for (const contentType of manifest.contentTypes) {
          const group = contentType.baseType;
          if (!group) {
            continue; // Skip invalid baseType
          }

          if (!groups[group]) {
            groups[group] = [];
          }
          groups[group].push(contentType as unknown as ContentType);

          // Map content type key to its parsed group name (without leading underscore)
          const parsedGroupName = group.replace(/^_/, '');
          contentTypeToGroupMap.set(contentType.key, parsedGroupName);
        }

        // Process and match display templates to content types
        if (manifest.displayTemplates && manifest.displayTemplates.length > 0) {
          const processedTemplates = processDisplayTemplates(
            manifest.displayTemplates,
          );

          // Build a set of all content type keys for quick lookup
          const allContentTypeKeys = new Set(
            manifest.contentTypes.map((ct: any) => ct.key),
          );

          for (const template of processedTemplates) {
            // Templates with baseType or nodeType cannot be matched to a specific content type
            // Only templates with contentType field can be matched
            if (
              template.contentType &&
              allContentTypeKeys.has(template.contentType)
            ) {
              // Match found - group with content type
              const existing =
                displayTemplatesByContentType.get(template.contentType) || [];
              existing.push(template);
              displayTemplatesByContentType.set(template.contentType, existing);
            } else {
              // No match - orphaned template (includes baseType/nodeType templates)
              orphanedDisplayTemplates.push(template);
            }
          }
        }

        // inside the outputDir create subdirectories for each group if grouping is enabled
        for (const group in groups) {
          const parsedGroupName = group.replace(/^_/, ''); // Remove leading underscore for cleaner directory names
          const groupDir = join(outputDir, parsedGroupName);
          await mkdir(groupDir, { recursive: true });

          // Generate files for each group
          const generatedFiles = await generateContentTypeFiles(
            groups[group],
            displayTemplatesByContentType,
            groupDir,
            contentTypeToGroupMap,
            parsedGroupName,
          );

          // List generated files for the group
          console.log(
            chalk.cyan.bold(
              `\nGenerated files for group "${parsedGroupName}":`,
            ),
          );
          for (const file of generatedFiles) {
            console.log(chalk.dim('  -'), chalk.green(file));
          }

          console.log(); // Add extra spacing between groups
          spinner.succeed(
            `Generated ${generatedFiles.length} content type file(s) in ${groupDir}`,
          );
        }

        // Handle orphaned display templates
        if (orphanedDisplayTemplates.length > 0) {
          console.log(); // Add extra spacing between groups
          spinner.start('Generating orphaned display templates');

          const displayTemplatesDir = join(outputDir, 'displayTemplates');
          await mkdir(displayTemplatesDir, { recursive: true });

          const orphanedFiles = await generateDisplayTemplateFiles(
            orphanedDisplayTemplates,
            displayTemplatesDir,
          );

          console.log(
            chalk.cyan.bold('\nDisplay templates (no matching content type):'),
          );
          for (const file of orphanedFiles) {
            console.log(chalk.dim('  -'), chalk.green(file));
          }

          console.log(); // Add extra spacing between groups
          spinner.succeed(
            `Generated ${orphanedFiles.length} display template(s) in ${displayTemplatesDir}`,
          );
          console.log(); // Add extra spacing between groups
        }
      } else {
        // Generate content type files (without grouping by baseType)
        const generatedContentTypeFiles = await generateContentTypeFiles(
          manifest.contentTypes as unknown as ContentType[],
          new Map(), // No display template grouping in non-grouped mode
          outputDir,
        );

        // List generated files
        console.log(chalk.cyan.bold('\nGenerated content type files:'));
        for (const file of generatedContentTypeFiles) {
          console.log(chalk.dim('  -'), chalk.green(file));
        }

        console.log(); // Add extra spacing between groups
        spinner.succeed(
          `Generated ${generatedContentTypeFiles.length} content type file(s) in ${outputDir}`,
        );

        // Generate display template files if available
        if (manifest.displayTemplates && manifest.displayTemplates.length > 0) {
          const processedDisplayTemplates = processDisplayTemplates(
            manifest.displayTemplates,
          );

          console.log(); // Add extra spacing between groups
          spinner.start('Generating display template files');

          if (processedDisplayTemplates.length > 0) {
            const displayTemplatesDir = join(outputDir, 'display-templates');
            await mkdir(displayTemplatesDir, { recursive: true });

            const generatedDisplayTemplateFiles =
              await generateDisplayTemplateFiles(
                processedDisplayTemplates,
                displayTemplatesDir,
              );

            // List generated display template files
            console.log(chalk.cyan.bold('\nGenerated display template files:'));

            for (const file of generatedDisplayTemplateFiles) {
              console.log(chalk.dim('  -'), chalk.green(file));
            }

            console.log(); // Add extra spacing between groups
            spinner.succeed(
              `Generated ${generatedDisplayTemplateFiles.length} display template file(s) in ${displayTemplatesDir}`,
            );
          }
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      spinner.fail(errorMessage);
      process.exitCode = 1;
      throw error;
    }
  }
}
