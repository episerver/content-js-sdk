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
  isPropertyGroup,
} from '@optimizely/cms-sdk';
import chalk from 'chalk';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { object } from 'zod';

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/** extract AnyContentType */
export type AnyContentType = ContentTypes.AnyContentType;

/** extract DisplayTemplate */
export type DisplayTemplate = DisplayTemplates.DisplayTemplate;

/** extract PermittedTypes */
type PermittedTypes = ContentTypes.PermittedTypes;

/** create Allowed/Restricted type */
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
export type DisplayTemplateMeta = Pick<
  FoundContentType,
  'displayTemplates' | 'path'
>;

function cleanType(obj: any) {
  if (obj !== null && '__type' in obj) delete obj.__type;
}

/**
 * Extract all `ContentType` and `DisplayTemplate` present in any property in `obj`
 *
 * Returns cleaned ('__type' removed) objects.
 */
export function extractMetaData(obj: unknown): {
  contentTypeData: AnyContentType[];
  displayTemplateData: DisplayTemplate[];
  propertyGroupData: PropertyGroupType[];
} {
  let contentTypeData: AnyContentType[] = [];
  let displayTemplateData: DisplayTemplate[] = [];
  let propertyGroupData: PropertyGroupType[] = [];

  if (typeof obj === 'object' && obj !== null) {
    for (const value of Object.values(obj)) {
      if (isContentType(value)) {
        cleanType(value);
        contentTypeData.push(value);
      } else if (isDisplayTemplate(value)) {
        cleanType(value);
        displayTemplateData.push(value);
      } else if (isPropertyGroup(value)) {
        cleanType(value);

        // Check if this is an array-like object with numeric keys
        const keys = Object.keys(value);
        const isArrayLike = keys.every((key) => !isNaN(Number(key)));

        if (isArrayLike && keys.length > 0) {
          // Extract individual property groups from the array-like object
          const groups = Object.values(value as any).filter(
            (v: any): v is PropertyGroupType =>
              typeof v === 'object' &&
              v !== null &&
              'key' in v &&
              'displayName' in v
          );
          propertyGroupData.push(...groups);
        } else {
          // Single property group
          propertyGroupData.push(value);
        }
      }
    }
  }

  return {
    contentTypeData,
    displayTemplateData,
    propertyGroupData,
  };
}

/** Compiles the `fileName` into a JavaScript file in a temporal directory and imports it */
async function compileAndImport(
  inputName: string,
  cwdUrl: string,
  outDir: string
) {
  // Note: we must pass paths as "Node.js paths" to `esbuild.build()`
  const cwdPath = fileURLToPath(cwdUrl);
  const outPath = path.join(outDir, `${inputName}.js`);

  // TODO: log outPath in verbose mode
  await esbuild.build({
    entryPoints: [inputName],
    absWorkingDir: cwdPath,
    bundle: true,
    platform: 'node',
    outfile: outPath,
  });

  try {
    // Note we must pass "File URL paths" when importing with `import()`
    const outUrl = pathToFileURL(outPath).href;
    const f = await import(outUrl);
    return f;
  } catch (err) {
    throw new Error(
      `Error when importing the file at path "${outPath}": ${
        (err as any).message
      }`
    );
  }
}

/** Finds metadata (contentTypes, displayTemplates, propertyGroups) in the given paths */
export async function findMetaData(
  componentPaths: string[],
  cwd: string
): Promise<{
  contentTypes: AnyContentType[];
  displayTemplates: DisplayTemplate[];
  propertyGroups: PropertyGroupType[];
}> {
  const tmpDir = await mkdtemp(path.join(tmpdir(), 'optimizely-cli-'));

  // Retrieve sets of files via glob
  const allFiles = (
    await Promise.all(
      componentPaths.map((path) =>
        glob(path, { cwd, dotRelative: true, posix: true })
      )
    )
  )
    .flat()
    .sort();

  // Process each file
  const result2 = {
    contentTypes: [] as AnyContentType[],
    displayTemplates: [] as DisplayTemplate[],
    propertyGroups: [] as PropertyGroupType[],
  };

  for (const file of allFiles) {
    const loaded = await compileAndImport(file, cwd, tmpDir);
    const { contentTypeData, displayTemplateData, propertyGroupData } =
      extractMetaData(loaded);

    for (const c of contentTypeData) {
      printFilesContnets('Content Type', file, c);
      result2.contentTypes.push(c);
    }

    for (const d of displayTemplateData) {
      printFilesContnets('Display Template', file, d);
      result2.displayTemplates.push(d);
    }

    for (const p of propertyGroupData) {
      printFilesContnets('Property Group', file, p);
      result2.propertyGroups.push(p);
    }
  }

  return result2;
}

function printFilesContnets(
  type: string,
  path: string,
  metaData: AnyContentType | DisplayTemplate | PropertyGroupType
) {
  console.log(
    '%s %s found in %s',
    type,
    chalk.bold(metaData.key),
    chalk.yellow.italic.underline(path)
  );
}

export async function readFromPath(configPath: string, section: string) {
  const config = await import(configPath);
  return config.default[section];
}

/**
 * Validates and normalizes property groups from the config file.
 * Ensures each property group has a key and displayName.
 * If sortOrder is missing, assigns incrementing numbers starting from 1.
 * @param propertyGroups - The property groups array from the config
 * @returns Validated and normalized property groups array
 * @throws Error if validation fails (missing key or displayName)
 */
export function normalizePropertyGroups(
  propertyGroups: any[]
): PropertyGroupType[] {
  if (!Array.isArray(propertyGroups)) {
    throw new Error('propertyGroups must be an array');
  }

  return propertyGroups.map((group, index) => {
    // Validate required fields
    if (!group.key || typeof group.key !== 'string') {
      throw new Error(
        `Property group at index ${index} is missing a valid "key" field`
      );
    }

    if (!group.displayName || typeof group.displayName !== 'string') {
      throw new Error(
        `Property group "${group.key}" is missing a valid "displayName" field`
      );
    }

    // Normalize sortOrder - assign incrementing number if not present
    const sortOrder =
      typeof group.sortOrder === 'number' ? group.sortOrder : index + 1;

    return {
      key: group.key,
      displayName: group.displayName,
      sortOrder,
    };
  });
}

/**
 * Returns the key name for a PermittedTypes value.
 * If the value is the string '_self', returns the parentKey; otherwise, returns the string or the object's key property.
 * @param input - The PermittedTypes value (string or object).
 * @param parentKey - The parent key to use if input is '_self'.
 * @returns The resolved key name as a string.
 */
export function extractKeyName(
  input: PermittedTypes,
  parentKey: string
): string {
  return typeof input === 'string'
    ? input === '_self'
      ? parentKey
      : input.trim()
    : input.key;
}
