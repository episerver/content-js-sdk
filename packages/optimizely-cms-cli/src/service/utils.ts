import { glob } from 'glob';
import * as esbuild from 'esbuild';
import { tmpdir } from 'node:os';
import { mkdtemp } from 'node:fs/promises';

import {
  ContentTypes,
  isContentType,
  DisplayTemplates,
  isDisplayTemplate,
  PropertyGroupType,
  isContract,
} from '@optimizely/cms-sdk';
import chalk from 'chalk';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ApplicationHostType, ApplicationsType } from '@optimizely/cms-sdk/buildConfig';
import { validateRequiredStringField } from '../utils/validate.js';

// TYPES

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type AnyContentType = ContentTypes.AnyContentType;

export type DisplayTemplate = DisplayTemplates.DisplayTemplate;

type PermittedTypes = ContentTypes.PermittedTypes;

export type AllowedOrRestrictedType = {
  type: string;
  items: {
    allowedTypes?: PermittedTypes[];
    restrictedTypes?: PermittedTypes[];
  };
  allowedTypes?: PermittedTypes[];
  restrictedTypes?: PermittedTypes[];
};

export type FoundContentType = {
  path: string;
  contentType: AnyContentType;
  displayTemplates: DisplayTemplate;
};

export type ContentTypeMeta = Pick<FoundContentType, 'contentType' | 'path'>;
export type DisplayTemplateMeta = Pick<FoundContentType, 'displayTemplates' | 'path'>;

// UTILITY FUNCTIONS

const unique = <T>(array: T[]): T[] => [...new Set(array)];

// METADATA EXTRACTION

const cleanType = <T extends Record<string, any>>(obj: T): T => {
  if (obj === null) return obj;

  const { __type, tag, ...cleaned } = obj;
  return cleaned as T;
};

/**
 * Extracts and categorizes metadata (content types, display templates, contracts) from an imported module.
 */
export const extractMetaData = (
  obj: unknown,
): {
  contentTypeData: AnyContentType[];
  displayTemplateData: DisplayTemplate[];
  contractData: ContentTypes.Contract[];
} => {
  if (typeof obj !== 'object' || obj === null)
    return {
      contentTypeData: [],
      displayTemplateData: [],
      contractData: [],
    };

  const values = Object.values(obj);

  const contentTypeData = values.filter(isContentType).map(cleanType);
  const displayTemplateData = values.filter(isDisplayTemplate).map(cleanType);
  const contractData = values.filter(isContract).map(cleanType);

  return {
    contentTypeData,
    displayTemplateData,
    contractData,
  };
};

/**
 * Resolves a PermittedTypes value to a key name string, handling '_self' references.
 */
export const extractKeyName = (input: PermittedTypes, parentKey: string): string =>
  typeof input === 'string' ?
    input === '_self' ?
      parentKey
    : input.trim()
  : input.key;

// FILE COMPILATION AND DISCOVERY

const compileAndImport = async (inputName: string, cwdUrl: string, outDir: string) => {
  const cwdPath = fileURLToPath(cwdUrl);
  const outPath = path.join(outDir, `${inputName}.js`);

  await esbuild.build({
    entryPoints: [inputName],
    absWorkingDir: cwdPath,
    bundle: true,
    platform: 'node',
    outfile: outPath,
  });

  try {
    const outUrl = pathToFileURL(outPath).href;
    return import(outUrl);
  } catch (err) {
    throw new Error(
      `Error when importing the file at path "${outPath}": ${(err as any).message}`,
    );
  }
};

/**
 * Splits `components` config entries into glob include patterns and exclude patterns.
 * Entries starting with `!` (e.g. `!src/legacy`) are treated as exclusions and are
 * fed to `glob`'s `ignore` option instead of being globbed themselves.
 */
const separatePatterns = (paths: string[]): { include: string[]; exclude: string[] } => {
  // keep everything that is NOT an exclusion (`!`-prefixed) as an include pattern
  const include = paths.filter(path => !path.startsWith('!'));

  const exclude = paths
    // pick out only the exclusion entries
    .filter(path => path.startsWith('!'))
    // drop the leading '!' so it becomes a plain glob pattern
    .map(path => path.substring(1))
    // expand each pattern to also match files nested under it, so a bare
    // directory exclude like `!src/legacy` also excludes `src/legacy/Old.ts`
    .flatMap(path => [path, `${path}/**`]);

  return { include, exclude };
};

const validatePatterns = (includePatterns: string[], excludePatterns: string[]): void => {
  if (includePatterns.length === 0 && excludePatterns.length > 0)
    throw new Error(
      `❌ [optimizely-cms-cli] Invalid component paths: cannot have only exclusion patterns`,
    );
};

const findFilesFromPatterns = async (
  includePatterns: string[],
  excludePatterns: string[],
  cwd: string,
): Promise<string[]> => {
  const allFilesWithDuplicates = (
    await Promise.all(
      includePatterns.map(pattern =>
        glob(pattern, {
          cwd,
          dotRelative: true,
          posix: true,
          ignore: excludePatterns,
        }),
      ),
    )
  ).flat();

  // preserve `components` pattern order so earlier entries take precedence on key conflicts
  return unique(allFilesWithDuplicates);
};

const printFileContent = (
  type: string,
  filePath: string,
  metaData: AnyContentType | DisplayTemplate | PropertyGroupType,
): void => {
  console.log(
    `${type} ${chalk.bold(metaData.key)} found in ${chalk.yellow.italic.underline(filePath)}`,
  );
};

const processFile = async (
  file: string,
  cwd: string,
  tmpDir: string,
  log: boolean,
): Promise<{
  contentTypes: AnyContentType[];
  displayTemplates: DisplayTemplate[];
  contracts: ContentTypes.Contract[];
}> => {
  const loaded = await compileAndImport(file, cwd, tmpDir);
  const { contentTypeData, displayTemplateData, contractData } = extractMetaData(loaded);

  if (log) {
    contentTypeData.forEach(contentType =>
      printFileContent('Content Type', file, contentType),
    );
    displayTemplateData.forEach(template =>
      printFileContent('Display Template', file, template),
    );
    contractData.forEach(contract => printFileContent('Contract', file, contract));
  }

  return {
    contentTypes: contentTypeData,
    displayTemplates: displayTemplateData,
    contracts: contractData,
  };
};

/**
 * Discovers and compiles component files from glob patterns, extracting all metadata.
 */
export const findMetaData = async (
  componentPaths: string[],
  cwd: string,
  { log = true } = {},
): Promise<{
  contentTypes: AnyContentType[];
  displayTemplates: DisplayTemplate[];
  contracts: ContentTypes.Contract[];
}> => {
  const tmpDir = await mkdtemp(path.join(tmpdir(), 'optimizely-cli-'));
  const cleanedPaths = componentPaths.map(p => p.trim()).filter(p => p.length > 0);
  const { include: includePatterns, exclude: excludePatterns } =
    separatePatterns(cleanedPaths);

  validatePatterns(includePatterns, excludePatterns);

  const allFiles = await findFilesFromPatterns(includePatterns, excludePatterns, cwd);
  const results = await Promise.all(
    allFiles.map(file => processFile(file, cwd, tmpDir, log)),
  );

  return {
    contentTypes: results.flatMap(r => r.contentTypes),
    displayTemplates: results.flatMap(r => r.displayTemplates),
    contracts: results.flatMap(r => r.contracts),
  };
};

/**
 * Reads and parses the Optimizely CMS configuration file.
 */
export const readFromPath = async (configPath: string) => {
  try {
    const config = await import(configPath);
    return {
      componentPaths: config.default['components'],
      propertyGroups: config.default['propertyGroups'],
      applications: config.default['applications'],
      content: config.default['content'],
      locale: config.default['locale'],
    };
  } catch (error) {
    console.error(chalk.red('Failed to read configuration file'));
    if (error instanceof Error) console.error(chalk.dim(error.message));
    throw error;
  }
};

// PROPERTY GROUPS

const isNonEmptyString = (value: any): boolean =>
  typeof value === 'string' && value.trim() !== '';

const validatePropertyGroupKey = (group: any, index: number): void => {
  if (!isNonEmptyString(group.key))
    throw new Error(
      `Error in property groups: Property group at index ${index} has an empty or missing "key" field`,
    );
};

const normalizePropertyGroup = (group: any, index: number): PropertyGroupType => {
  validatePropertyGroupKey(group, index);

  const displayName =
    isNonEmptyString(group.displayName) ?
      group.displayName
    : group.key.charAt(0).toUpperCase() + group.key.slice(1);

  const sortOrder = typeof group.sortOrder === 'number' ? group.sortOrder : index + 1;

  return { key: group.key, displayName, sortOrder };
};

const deduplicatePropertyGroups = (groups: PropertyGroupType[]): PropertyGroupType[] => {
  const seenKeys = new Set<string>();
  const duplicates = new Set<string>();
  const deduplicated: PropertyGroupType[] = [];

  groups.forEach(group => {
    if (seenKeys.has(group.key)) duplicates.add(group.key);
    else {
      seenKeys.add(group.key);
      deduplicated.push(group);
    }
  });

  if (duplicates.size > 0)
    console.warn(
      chalk.yellow(
        `Warning: Duplicate property group keys found: ${Array.from(duplicates).join(', ')}. Keeping the first occurrence of each.`,
      ),
    );

  return deduplicated;
};

/**
 * Logs a labelled list, e.g. `Property Groups found: [SEO, Meta]`. Skips empty lists.
 */
export const logList = (label: string, items: string[]): void => {
  if (items.length > 0)
    console.log(`${label}: ${chalk.bold.cyan(`[${items.join(', ')}]`)}`);
};

/**
 * Validates and normalizes property groups, auto-generating missing fields and removing duplicates.
 */
export const normalizePropertyGroups = (propertyGroups: any[]): PropertyGroupType[] => {
  if (!Array.isArray(propertyGroups)) throw new Error('propertyGroups must be an array');

  const normalizedGroups = propertyGroups.map(normalizePropertyGroup);

  return deduplicatePropertyGroups(normalizedGroups);
};

// VALIDATORS

const REQUIRED_APPLICATION_FIELDS: Array<
  keyof Pick<ApplicationsType, 'key' | 'displayName' | 'type'>
> = ['key', 'displayName', 'type'];

const REQUIRED_HOST_FIELDS: Array<keyof Pick<ApplicationHostType, 'authority'>> = [
  'authority',
];

const validateApplicationFields = (
  app: ApplicationsType,
  applicationIndex: number,
): void => {
  REQUIRED_APPLICATION_FIELDS.forEach(field => {
    validateRequiredStringField(app[field], field, 'applications', applicationIndex);
  });
};

const validateHostFields = (host: Record<string, any>, hostIndex: number): void => {
  REQUIRED_HOST_FIELDS.forEach(field => {
    validateRequiredStringField(host[field], field, 'hosts', hostIndex);
  });
};

/**
 * Base types a preview URL can be keyed by. Folders are left out: they organise
 * content in the CMS and are never rendered, so there is nothing to preview.
 */
const PREVIEWABLE_BASE_TYPES: readonly string[] = ContentTypes.ALL_BASE_TYPES.filter(
  baseType => baseType !== '_folder',
);

/** The key that applies to everything without an entry of its own. */
const PREVIEW_FALLBACK_KEY = 'any';

/**
 * Checks that every `componentPreviewUrlFormats` key names something
 * previewable: the `any` fallback, a base type, or a content type defined in
 * this project.
 *
 * A key that matches none of those is a typo or a stale name, and the CMS
 * silently ignores it — so the preview the developer thought they configured
 * never appears.
 */
const validateComponentPreviewUrlFormats = (
  app: ApplicationsType,
  previewableContentTypeKeys: Set<string>,
): void => {
  const formats =
    'componentPreviewUrlFormats' in app ? app.componentPreviewUrlFormats : undefined;
  if (!formats) return;

  const invalidKeys = Object.keys(formats).filter(
    key =>
      key !== PREVIEW_FALLBACK_KEY &&
      !PREVIEWABLE_BASE_TYPES.includes(key) &&
      !previewableContentTypeKeys.has(key),
  );

  if (invalidKeys.length === 0) return;

  throw new Error(
    `Validation error: application "${app.key}" has componentPreviewUrlFormats keys that name nothing previewable: ${invalidKeys.join(', ')}.\n` +
      `Each key is either a content type key from your project, or one of: ${[PREVIEW_FALLBACK_KEY, ...PREVIEWABLE_BASE_TYPES].join(', ')}.`,
  );
};

const validateApplication = (
  app: ApplicationsType,
  applicationIndex: number,
  previewableContentTypeKeys: Set<string>,
): void => {
  validateApplicationFields(app, applicationIndex);
  app.hosts?.forEach((host, hostIndex) => validateHostFields(host, hostIndex));
  validateComponentPreviewUrlFormats(app, previewableContentTypeKeys);
};

/**
 * The content types a preview URL may be keyed by: everything in the project
 * except contracts, which are not content, and folders, which are not rendered.
 *
 * A content type that opted out with `componentPreview: false` stays in here.
 * Naming it is not a typo, it is a contradiction, and
 * {@linkcode expandComponentPreviewUrlFormats} warns about it instead.
 */
export const previewableContentTypeKeys = (
  contentTypes: AnyContentType[],
): Set<string> =>
  new Set(
    contentTypes
      .filter(contentType => !isContract(contentType) && contentType.baseType !== '_folder')
      .map(contentType => contentType.key),
  );

/** Whether a content type can be previewed on its own. */
const isPreviewable = (contentType: AnyContentType): boolean =>
  !isContract(contentType) &&
  contentType.baseType !== '_folder' &&
  contentType.componentPreview !== false;

/**
 * Resolves `componentPreviewUrlFormats` into one entry per content type.
 *
 * The CMS has no `componentPreview` field, so it cannot know that a content
 * type opted out of a base type's entry. Sending it `_component` would offer a
 * preview for every component including that one. Expanding here keeps the
 * decision on this side: the CMS receives the content types that really are
 * previewable, and nothing else.
 *
 * The cost is that a base type covers the content types this project knows at
 * push time. One added elsewhere against the same CMS is not included until
 * someone pushes again.
 */
export const expandComponentPreviewUrlFormats = (
  applications: ApplicationsType[],
  contentTypes: AnyContentType[],
): ApplicationsType[] =>
  applications.map(app => {
    const formats =
      'componentPreviewUrlFormats' in app ? app.componentPreviewUrlFormats : undefined;
    if (!formats) return app;

    // Saying both "preview it here" and "never preview it" is a mistake worth
    // naming. The content type wins: it is the more specific statement, and it
    // sits with the component rather than in the config file.
    const contradictoryKeys = contentTypes
      .filter(contentType => contentType.componentPreview === false)
      .map(contentType => contentType.key)
      .filter(key => key in formats);

    if (contradictoryKeys.length > 0)
      console.warn(
        chalk.yellow(
          `Warning: ${contradictoryKeys.join(', ')} ${contradictoryKeys.length === 1 ? 'is' : 'are'} named in componentPreviewUrlFormats of application "${app.key}" but set componentPreview: false. No preview URL is pushed for ${contradictoryKeys.length === 1 ? 'it' : 'them'}.`,
        ),
      );

    const componentPreviewUrlFormats = Object.fromEntries(
      contentTypes.filter(isPreviewable).flatMap(contentType => {
        // Most specific first: the content type's own entry, then its base
        // type's, then the fallback.
        const url =
          formats[contentType.key] ??
          formats[contentType.baseType] ??
          formats[PREVIEW_FALLBACK_KEY];

        return url ? [[contentType.key, url] as const] : [];
      }),
    );

    return { ...app, componentPreviewUrlFormats };
  });

/**
 * Validates application configuration, ensuring required fields are present and properly formatted.
 *
 * `contentTypeKeys` are the keys a `componentPreviewUrlFormats` entry may name;
 * leave it out to check the keys against base types alone.
 */
export const validateApplications = (
  applications: ApplicationsType[],
  contentTypeKeys: Set<string> = new Set(),
): ApplicationsType[] => {
  if (!Array.isArray(applications))
    throw new Error(
      'Validation error: "applications" must be an array in the config file',
    );

  applications.forEach((app, index) => validateApplication(app, index, contentTypeKeys));

  return applications;
};
