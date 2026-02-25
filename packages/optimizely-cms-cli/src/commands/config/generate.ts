import { Flags } from '@oclif/core';
import { resolve, join } from 'node:path';
import ora from 'ora';
import { input, confirm } from '@inquirer/prompts';
import { BaseCommand } from '../../baseCommand.js';
import { mkdir } from 'node:fs/promises';
import { generateContentTypeFiles } from '../../generators/contentTypeGenerator.js';
import { createApiClient } from '../../service/cmsRestClient.js';
import { ContentType } from '../../service/apiSchema/manifest.js';

export default class ConfigGenerate extends BaseCommand<typeof ConfigGenerate> {
  static override flags = {
    output: Flags.string({
      description: 'Output directory for generated files',
    }),
    group: Flags.boolean({
      description: 'Whether to group generated files into subdirectories',
      default: false,
    }),
  };
  static override description =
    'Pull content types from CMS and generate TypeScript files';
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --output ./src/types',
    '<%= config.bin %> <%= command.id %> --group',
  ];

  public async run(): Promise<void> {
    const { flags } = await this.parse(ConfigGenerate);

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

      spinner.text = 'Validating manifest';

      if (!manifest.contentTypes || !Array.isArray(manifest.contentTypes)) {
        spinner.fail('Invalid manifest: contentTypes array not found');
        return;
      }

      // Filter out _image, _video, _media content types as they are not relevant for code generation
      manifest.contentTypes = manifest.contentTypes.filter(
        (ct: any) => !['_image', '_video', '_media'].includes(ct.baseType),
      );

      spinner.text = 'Generating content type files';

      // Ensure output directory exists
      await mkdir(outputDir, { recursive: true });

      if (isGroupBy) {
        const groups: Record<string, ContentType[]> = {};
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

        // inside the outputDir create subdirectories for each group if grouping is enabled
        for (const group in groups) {
          const parsedGroupName = group.replace(/^_/, ''); // Remove leading underscore for cleaner directory names
          const groupDir = join(outputDir, parsedGroupName);
          await mkdir(groupDir, { recursive: true });

          // Generate files for each group
          const generatedFiles = await generateContentTypeFiles(
            groups[group],
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
      } else {
        // Generate files
        const generatedFiles = await generateContentTypeFiles(
          manifest.contentTypes as unknown as ContentType[],
          outputDir,
        );

        spinner.succeed(
          `Generated ${generatedFiles.length} content type file(s) in ${outputDir}`,
        );

        // List generated files
        console.log('\nGenerated files:');
        for (const file of generatedFiles) {
          console.log(`  - ${file}`);
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
