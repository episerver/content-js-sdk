import { Flags } from '@oclif/core';
import { resolve, join } from 'node:path';
import ora from 'ora';
import chalk from 'chalk';
import { input, confirm } from '@inquirer/prompts';
import { BaseCommand } from '../../baseCommand.js';
import { writeFile, mkdir } from 'node:fs/promises';
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
      default: false,
    }),
    json: Flags.boolean({
      description:
        'Save only the raw manifest JSON without generating TypeScript files',
      default: false,
    }),
    path: Flags.string({
      description: 'Path for the JSON manifest file (use with --json flag)',
      dependsOn: ['json'],
    }),
  };
  static override description =
    'Pull content types from CMS and generate TypeScript files';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --output ./src/types',
    '<%= config.bin %> <%= command.id %> --group',
    '<%= config.bin %> <%= command.id %> --output ./src/types --group',
    '<%= config.bin %> <%= command.id %> --json',
    '<%= config.bin %> <%= command.id %> --json --path ./manifest.json',
  ];

  public async run(): Promise<void> {
    const { flags } = await this.parse(ConfigPull);

    // If --json flag is present, only save JSON manifest and skip TypeScript generation
    if (flags.json) {
      const jsonPath =
        flags.path ||
        (await input({
          message: 'Where should the JSON manifest be saved?',
          default: './manifest.json',
        }));

      const jsonFilePath = resolve(process.cwd(), jsonPath);
      const spinner = ora('Downloading configuration from CMS').start();

      try {
        const restClient = await createApiClient();
        const response = await restClient
          .GET('/experimental/packages')
          .then((r) => r.data);

        if (!response) {
          spinner.fail('The server did not respond with any content');
          return;
        }

        await writeFile(jsonFilePath, JSON.stringify(response, null, 2));
        spinner.succeed(`Saved raw manifest to ${jsonFilePath}`);
      } catch (error) {
        spinner.fail('Error downloading manifest');
        if (error instanceof Error) {
          console.error(error.message);
        }
        throw error;
      }
      return;
    }

    // Prompt for output directory if not provided
    const outputPath =
      flags.output ||
      (await input({
        message: 'Where should the generated files be saved?',
        default: './src/content-types',
      }));

    // Prompt for grouping if not provided
    const isGroupBy =
      flags.group ||
      (await confirm({
        message: 'Should the generated files be grouped?',
        default: false,
      }));

    const outputDir = resolve(process.cwd(), outputPath);

    const spinner = ora('Downloading configuration from CMS').start();

    try {
      // Pull from CMS
      const restClient = await createApiClient();
      const response = await restClient
        .GET('/experimental/packages')
        .then((r) => r.data);

      if (!response) {
        spinner.fail('The server did not respond with any content');
        return;
      }

      const manifest = response;

      spinner.text = 'Validating manifest';

      if (!manifest.contentTypes || !Array.isArray(manifest.contentTypes)) {
        spinner.fail('Invalid manifest: contentTypes array not found');
        return;
      }

      // Filter out _image, _video, _media content types as they are not relevant for code generation
      // Also filter out BlankExperience and BlankSection as they are internally provided by the SDK
      manifest.contentTypes = manifest.contentTypes.filter(
        (ct: any) =>
          !['_image', '_video', '_media'].includes(ct.baseType) &&
          !['BlankExperience', 'BlankSection'].includes(ct.key),
      );

      spinner.text = 'Generating files';

      // Ensure output directory exists
      await mkdir(outputDir, { recursive: true });

      if (isGroupBy) {
        const groups: Record<string, ContentType[]> = {};
        const displayTemplatesByContentType = new Map<string, any[]>();
        const orphanedDisplayTemplates: any[] = [];

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
          );

          spinner.succeed(
            `Generated ${generatedFiles.length} content type file(s) in ${groupDir}`,
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
        }

        // Handle orphaned display templates
        if (orphanedDisplayTemplates.length > 0) {
          spinner.start('Generating orphaned display templates');

          const displayTemplatesDir = join(outputDir, 'displayTemplates');
          await mkdir(displayTemplatesDir, { recursive: true });

          const orphanedFiles = await generateDisplayTemplateFiles(
            orphanedDisplayTemplates,
            displayTemplatesDir,
          );

          spinner.succeed(
            `Generated ${orphanedFiles.length} display template(s) in ${displayTemplatesDir}`,
          );

          console.log(
            chalk.cyan.bold('\nDisplay templates (no matching content type):'),
          );
          for (const file of orphanedFiles) {
            console.log(chalk.dim('  -'), chalk.green(file));
          }
        }
      } else {
        // Generate content type files (without grouping by baseType)
        const generatedContentTypeFiles = await generateContentTypeFiles(
          manifest.contentTypes as unknown as ContentType[],
          new Map(), // No display template grouping in non-grouped mode
          outputDir,
        );

        spinner.succeed(
          `Generated ${generatedContentTypeFiles.length} content type file(s) in ${outputDir}`,
        );

        // List generated files
        console.log(chalk.cyan.bold('\nGenerated content type files:'));
        for (const file of generatedContentTypeFiles) {
          console.log(chalk.dim('  -'), chalk.green(file));
        }

        // Generate display template files if available
        if (manifest.displayTemplates && manifest.displayTemplates.length > 0) {
          const processedDisplayTemplates = processDisplayTemplates(
            manifest.displayTemplates,
          );

          spinner.start('Generating display template files');

          if (processedDisplayTemplates.length > 0) {
            const displayTemplatesDir = join(outputDir, '../display-templates');
            await mkdir(displayTemplatesDir, { recursive: true });

            const generatedDisplayTemplateFiles =
              await generateDisplayTemplateFiles(
                processedDisplayTemplates,
                displayTemplatesDir,
              );

            spinner.succeed(
              `Generated ${generatedDisplayTemplateFiles.length} display template file(s) in ${displayTemplatesDir}`,
            );

            // List generated display template files
            console.log(chalk.cyan.bold('\nGenerated display template files:'));
            for (const file of generatedDisplayTemplateFiles) {
              console.log(chalk.dim('  -'), chalk.green(file));
            }
          }
        }
      }
    } catch (error) {
      spinner.fail('Error generating files');
      if (error instanceof Error) {
        console.error(error.message);
      }
      throw error;
    }
  }
}
