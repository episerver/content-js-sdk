import { Flags } from '@oclif/core';
import { resolve, join } from 'node:path';
import ora from 'ora';
import { input, confirm } from '@inquirer/prompts';
import { BaseCommand } from '../../baseCommand.js';
import { writeFile, mkdir } from 'node:fs/promises';
import { createApiClient } from '../../service/cmsRestClient.js';
import { generateContentTypeFiles } from '../../generators/contentTypeGenerator.js';
import { generateDisplayTemplateFiles } from '../../generators/displayTemplateGenerator.js';
import { ContentType } from '../../generators/manifest.js';

export default class ConfigPull extends BaseCommand<typeof ConfigPull> {
  static override flags = {
    output: Flags.string({
      description: 'Output directory for generated files',
    }),
    group: Flags.boolean({
      description: 'Group files by base type (page/, block/, etc.) and co-locate display templates with their content types',
      default: false,
    }),
    json: Flags.string({
      description: 'Optionally save the raw manifest JSON to a file',
    }),
  };
  static override description =
    'Pull content types from CMS and generate TypeScript files';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --output ./src/types',
    '<%= config.bin %> <%= command.id %> --group',
    '<%= config.bin %> <%= command.id %> --output ./src/types --group',
    '<%= config.bin %> <%= command.id %> --json ./manifest.json',
    '<%= config.bin %> <%= command.id %> --output ./src/types --group --json ./manifest.json',
  ];

  public async run(): Promise<void> {
    const { flags } = await this.parse(ConfigPull);

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
      const restClient = await createApiClient(flags.host);
      const response = await restClient
        .GET('/experimental/packages')
        .then((r) => r.data);

      if (!response) {
        spinner.fail('The server did not respond with any content');
        return;
      }

      const manifest = response;

      // Save raw JSON manifest if --json flag is provided
      if (flags.json) {
        const jsonPath = resolve(process.cwd(), flags.json);
        await writeFile(jsonPath, JSON.stringify(manifest, null, 2));
        spinner.succeed(`Saved raw manifest to ${jsonPath}`);
        spinner.start('Validating manifest');
      } else {
        spinner.text = 'Validating manifest';
      }

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
          const processedTemplates = manifest.displayTemplates.map(
            (dt: any) => ({
              ...dt,
              contentType:
                dt.contentType ||
                dt.key
                  .replace(/DisplayTemplate$/i, '')
                  .replace(/Template$/i, ''),
            }),
          );

          // Build a set of all content type keys for quick lookup
          const allContentTypeKeys = new Set(
            manifest.contentTypes.map((ct: any) => ct.key),
          );

          for (const template of processedTemplates) {
            // Check if this template's content type exists in our manifest
            if (allContentTypeKeys.has(template.contentType)) {
              // Match found - group with content type
              const existing =
                displayTemplatesByContentType.get(template.contentType) || [];
              existing.push(template);
              displayTemplatesByContentType.set(template.contentType, existing);
            } else {
              // No match - orphaned template
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
          console.log(`\nGenerated files for group "${parsedGroupName}":`);
          for (const file of generatedFiles) {
            console.log(`  - ${file}`);
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
            `Generated ${orphanedFiles.length} orphaned display template(s) in ${displayTemplatesDir}`,
          );

          console.log('\nOrphaned display templates (no matching content type):');
          for (const file of orphanedFiles) {
            console.log(`  - ${file}`);
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
        console.log('\nGenerated content type files:');
        for (const file of generatedContentTypeFiles) {
          console.log(`  - ${file}`);
        }

        // Generate display template files if available
        if (manifest.displayTemplates && manifest.displayTemplates.length > 0) {
          // Infer contentType from key (e.g., "NoticeDisplayTemplate" -> "Notice")
          const processedDisplayTemplates = manifest.displayTemplates.map(
            (dt: any) => {
              // Try to extract content type from key by removing common suffixes
              let contentType = dt.key
                .replace(/DisplayTemplate$/i, '')
                .replace(/Template$/i, '');

              return {
                ...dt,
                contentType: contentType || dt.key,
              };
            },
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
            console.log('\nGenerated display template files:');
            for (const file of generatedDisplayTemplateFiles) {
              console.log(`  - ${file}`);
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
