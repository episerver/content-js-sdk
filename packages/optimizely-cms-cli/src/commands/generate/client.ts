import { Args, Flags } from '@oclif/core';
import * as path from 'node:path';
import { writeFile, access, mkdir, mkdtemp } from 'node:fs/promises';
import { constants } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import chalk from 'chalk';
import ora from 'ora';
import { BaseCommand } from '../../baseCommand.js';
import { isContentType } from '@optimizely/cms-sdk';
import type { ContentTypes } from '@optimizely/cms-sdk';

type AnyContentType = ContentTypes.AnyContentType;

type ContentTypeSource = {
  file: string;
  exportName: string;
  contentType: AnyContentType;
};

// ---------------------------------------------------------------------------
// Config reading (self-contained to avoid glob top-level import)
// ---------------------------------------------------------------------------

async function readConfig(configPath: string) {
  const config = await import(configPath);
  return {
    componentPaths: config.default['components'] as string[],
  };
}

function globToRegex(pattern: string): RegExp {
  const normalized = pattern.replace(/^\.\//, '');
  const regex = normalized
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '<<<GLOBSTAR>>>')
    .replace(/\*/g, '[^/]*')
    .replace(/<<<GLOBSTAR>>>/g, '.*');
  return new RegExp(`^${regex}$`);
}

async function findFiles(
  patterns: string[],
  cwdUrl: string,
): Promise<string[]> {
  const { readdir } = await import('node:fs/promises');
  const cwdPath = fileURLToPath(cwdUrl);

  const include = patterns
    .filter(p => !p.startsWith('!'))
    .map(globToRegex);
  const exclude = patterns
    .filter(p => p.startsWith('!'))
    .map(p => globToRegex(p.substring(1)));

  const allFiles = await readdir(cwdPath, { recursive: true });
  const normalized = allFiles
    .map(f => f.toString().replace(/\\/g, '/'))
    .filter(f => /\.(tsx?|jsx?)$/.test(f) && !f.includes('node_modules/'));

  const matched = normalized.filter(file => {
    const included = include.some(re => re.test(file));
    const excluded = exclude.some(re => re.test(file));
    return included && !excluded;
  });

  return [...new Set(matched)];
}

async function scanContentTypes(
  componentPaths: string[],
  cwdUrl: string,
): Promise<ContentTypeSource[]> {
  const esbuild = await import('esbuild');
  const cwdPath = fileURLToPath(cwdUrl);
  const tmpDir = await mkdtemp(path.join(tmpdir(), 'optimizely-cli-'));
  const files = await findFiles(componentPaths, cwdUrl);
  const results: ContentTypeSource[] = [];

  for (const file of files) {
    const outPath = path.join(tmpDir, `${file.replace(/[/\\]/g, '_')}.js`);

    try {
      await esbuild.build({
        entryPoints: [file],
        absWorkingDir: cwdPath,
        bundle: true,
        platform: 'node',
        outfile: outPath,
        jsx: 'transform',
        loader: { '.tsx': 'tsx', '.jsx': 'jsx' },
      });
    } catch {
      continue;
    }

    let loaded: Record<string, unknown>;
    try {
      loaded = await import(pathToFileURL(outPath).href);
    } catch {
      continue;
    }

    for (const [exportName, value] of Object.entries(loaded)) {
      if (isContentType(value)) {
        results.push({
          file,
          exportName,
          contentType: value as AnyContentType,
        });
      }
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Code generation helpers
// ---------------------------------------------------------------------------

function toClientKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/(^_|_$)/g, '')
    .toLowerCase();
}

function buildImports(
  sources: ContentTypeSource[],
  outputDir: string,
  configDir: string,
): string[] {
  const byFile = new Map<string, ContentTypeSource[]>();
  for (const source of sources) {
    const list = byFile.get(source.file) ?? [];
    list.push(source);
    byFile.set(source.file, list);
  }

  const lines: string[] = [];
  for (const [file, entries] of byFile) {
    const absFile = path.resolve(configDir, file);
    let rel = path.relative(outputDir, absFile).replace(/\\/g, '/');
    rel = rel.replace(/\.(tsx?|jsx?)$/, '');
    if (!rel.startsWith('.')) rel = './' + rel;

    const names = entries.map(e => e.exportName).join(', ');
    lines.push(`import { ${names} } from '${rel}';`);
  }

  return lines;
}

function buildTypeMap(sources: ContentTypeSource[]): string {
  const entries = sources.map(s => {
    const clientKey = toClientKey(s.contentType.key);
    return `  ${clientKey}: ${s.exportName},`;
  });
  return `{\n${entries.join('\n')}\n}`;
}

function generateClientFile(
  sources: ContentTypeSource[],
  outputDir: string,
  configDir: string,
  filter?: string,
): string {
  const filtered = filter
    ? sources.filter(
        s =>
          'baseType' in s.contentType &&
          s.contentType.baseType === filter,
      )
    : sources;

  if (filtered.length === 0) {
    throw new Error(
      filter
        ? `No content types found with baseType '${filter}'`
        : 'No content types found in the configured component paths',
    );
  }

  const imports = buildImports(filtered, outputDir, configDir);
  const typeMap = buildTypeMap(filtered);

  return [
    `/**`,
    ` * Auto-generated typed client. Do not edit manually.`,
    ` * Re-generate with: optimizely-cms-cli generate client`,
    ` */`,
    `import { getClient, createClient } from '@optimizely/cms-sdk';`,
    ...imports,
    ``,
    `export function getTypedClient() {`,
    `  return createClient(getClient(), ${typeMap});`,
    `}`,
    ``,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Command
// ---------------------------------------------------------------------------

export default class GenerateClient extends BaseCommand<typeof GenerateClient> {
  static override args = {
    config: Args.string({
      description: 'path to the Optimizely configuration file',
      default: './optimizely.config.mjs',
    }),
  };

  static override flags = {
    output: Flags.string({
      char: 'o',
      description: 'output file path for the generated client',
      default: './lib/client.ts',
    }),
    filter: Flags.string({
      char: 'f',
      description: 'only include content types with this baseType (e.g. _page, _experience)',
    }),
  };

  static override description =
    'Generate a typed GraphQL client from discovered content types';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --output ./src/generated/client.ts',
    '<%= config.bin %> <%= command.id %> --filter _page',
    '<%= config.bin %> <%= command.id %> ./custom-config.mjs -o ./lib/client.ts',
  ];

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(GenerateClient);
    const configFilePath = path.resolve(process.cwd(), args.config);
    const outputPath = path.resolve(process.cwd(), flags.output);

    try {
      await access(configFilePath, constants.R_OK);
    } catch {
      console.error(chalk.red(`Configuration file not found: ${configFilePath}`));
      process.exit(1);
    }

    const configUrl = pathToFileURL(configFilePath).href;
    const { componentPaths } = await readConfig(configUrl);

    if (!componentPaths || !Array.isArray(componentPaths)) {
      console.error(
        chalk.red('Invalid configuration: "components" field must be an array'),
      );
      process.exit(1);
    }

    const spinner = ora('Scanning content types...').start();
    const configDir = path.dirname(configFilePath);
    const configDirUrl = pathToFileURL(configDir).href;

    const sources = await scanContentTypes(componentPaths, configDirUrl);
    spinner.succeed(
      `Found ${sources.length} content type${sources.length === 1 ? '' : 's'}`,
    );

    const outputDir = path.dirname(outputPath);
    const content = generateClientFile(sources, outputDir, configDir, flags.filter);

    await mkdir(outputDir, { recursive: true });
    await writeFile(outputPath, content, 'utf-8');

    console.log(chalk.green(`✔ Generated typed client at ${chalk.bold(flags.output)}`));

    const filtered = flags.filter
      ? sources.filter(
          s => 'baseType' in s.contentType && s.contentType.baseType === flags.filter,
        )
      : sources;

    for (const source of filtered) {
      const clientKey = toClientKey(source.contentType.key);
      console.log(
        chalk.dim(`  ${clientKey} → ${source.contentType.key} (${source.file})`),
      );
    }
  }
}
