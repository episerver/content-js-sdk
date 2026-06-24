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

const separatePatterns = (paths: string[]): { include: string[]; exclude: string[] } => {
  const include = paths.filter(path => !path.startsWith('!'));
  const exclude = paths
    .filter(path => path.startsWith('!'))
    .map(path => path.substring(1));
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

  return unique(allFilesWithDuplicates).sort();
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
): Promise<{
  contentTypes: AnyContentType[];
  displayTemplates: DisplayTemplate[];
  contracts: ContentTypes.Contract[];
}> => {
  const loaded = await compileAndImport(file, cwd, tmpDir);
  const { contentTypeData, displayTemplateData, contractData } = extractMetaData(loaded);

  contentTypeData.forEach(contentType =>
    printFileContent('Content Type', file, contentType),
  );
  displayTemplateData.forEach(template =>
    printFileContent('Display Template', file, template),
  );
  contractData.forEach(contract => printFileContent('Contract', file, contract));

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
  const results = await Promise.all(allFiles.map(file => processFile(file, cwd, tmpDir)));

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

const logPropertyGroups = (groups: PropertyGroupType[]): void => {
  if (groups.length > 0) {
    const groupKeys = groups.map(group => group.displayName).join(', ');
    console.log(`Property Groups found: ${chalk.bold.cyan(`[${groupKeys}]`)}`);
  }
};

/**
 * Validates and normalizes property groups, auto-generating missing fields and removing duplicates.
 */
export const normalizePropertyGroups = (propertyGroups: any[]): PropertyGroupType[] => {
  if (!Array.isArray(propertyGroups)) throw new Error('propertyGroups must be an array');

  const normalizedGroups = propertyGroups.map(normalizePropertyGroup);
  const deduplicatedGroups = deduplicatePropertyGroups(normalizedGroups);

  logPropertyGroups(deduplicatedGroups);

  return deduplicatedGroups;
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

const validateApplication = (app: ApplicationsType, applicationIndex: number): void => {
  validateApplicationFields(app, applicationIndex);
  app.hosts?.forEach((host, hostIndex) => validateHostFields(host, hostIndex));
};

const logApplications = (applications: ApplicationsType[]): void => {
  if (applications.length > 0) {
    const appNames = applications.map(app => app.displayName).join(', ');
    console.log('Applications found: %s', chalk.bold.cyan(`[${appNames}]`));
  }
};

/**
 * Validates application configuration, ensuring required fields are present and properly formatted.
 */
export const validateApplications = (
  applications: ApplicationsType[],
): ApplicationsType[] => {
  if (!Array.isArray(applications))
    throw new Error(
      'Validation error: "applications" must be an array in the config file',
    );

  applications.forEach(validateApplication);
  logApplications(applications);

  return applications;
};
