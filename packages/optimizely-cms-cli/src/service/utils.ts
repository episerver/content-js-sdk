import { resolve } from 'node:path';
import { glob } from 'glob';
import { createJiti } from 'jiti';
import {
  Properties,
  ContentTypes,
  isContentType,
  DisplayTemplates,
  isDisplayTemplate,
} from 'optimizely-cms-sdk';
import chalk from 'chalk';

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/** extract AnyContentType */
export type AnyContentType = ContentTypes.AnyContentType;

/** extract DisplayTemplate */
export type DisplayTemplate = DisplayTemplates.DisplayTemplate;

/** extract ContentOrMediaType */
type ContentOrMediaType = ContentTypes.ContentOrMediaType;

/** create Allowed/Restricted type */
type AllowedOrRestrictedType = {
  type: string;
  items: Properties.ContentProperty | Properties.ContentReferenceProperty;
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
} {
  let contentTypeData: AnyContentType[] = [];
  let displayTemplateData: DisplayTemplate[] = [];

  if (typeof obj === 'object' && obj !== null) {
    for (const value of Object.values(obj)) {
      if (isContentType(value)) {
        cleanType(value);
        contentTypeData.push(value);
      } else if (isDisplayTemplate(value)) {
        cleanType(value);
        displayTemplateData.push(value);
      }
    }
  }

  return {
    contentTypeData,
    displayTemplateData,
  };
}

/** Finds metadata (contentTypes, displayTemplates) in the given paths */
export async function findMetaData(
  componentPaths: string[],
  cwd: string
): Promise<{
  contentTypes: AnyContentType[];
  displayTemplates: DisplayTemplate[];
}> {
  const jiti = createJiti(cwd, { jsx: true });
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
  };

  for (const file of allFiles) {
    const loaded = await jiti.import(resolve(file)).catch(() => {
      // TODO: better error messages
      throw new Error(`Error importing the file ${file}`);
    });

    const { contentTypeData, displayTemplateData } = extractMetaData(loaded);

    for (const c of contentTypeData) {
      printFilesContnets('Content Type', file, c);
      result2.contentTypes.push(c);
    }

    for (const d of displayTemplateData) {
      printFilesContnets('Display Template', file, d);
      result2.displayTemplates.push(d);
    }
  }

  return result2;
}

function printFilesContnets(
  type: string,
  path: string,
  metaData: AnyContentType | DisplayTemplate
) {
  console.log(
    '%s %s found in %s',
    type,
    chalk.bold(metaData.key),
    chalk.yellow.italic.underline(path)
  );
}

export async function readFromPath(configPath: string) {
  const config = await import(configPath);
  return config.default.components;
}

/**
 * Extracts the key name from a ContentOrMediaType.
 * @param input - A value that can either be a string (MediaStringTypes) or a ContentType object.
 * @returns The extracted key as a string.
 */
export function extractKeyName(input: ContentOrMediaType): string {
  return typeof input === 'string' ? input : input.key;
}

/**
 * Checks if a given object has a specific property that is an array of ContentOrMediaType.
 * @param value - The object to inspect.
 * @param key - The property name to check on the object.
 * @returns True if the object has the specified property and it is an array of ContentOrMediaType; otherwise, false.
 */
export function hasArrayOfContentOrMediaTypes(
  value: any,
  key: string
): value is { [key: string]: ContentOrMediaType[] } {
  const mediaTypes = ['Image', 'Video', 'Media'];

  if (!value || typeof value !== 'object' || !Array.isArray(value[key])) {
    return false;
  }

  return value[key].every(
    (item: unknown) =>
      (typeof item === 'string' && mediaTypes.includes(item)) ||
      (typeof item === 'object' &&
        item !== null &&
        'key' in item &&
        typeof (item as any).key === 'string')
  );
}

/**
 * Checks if a value is an array schema with an "items" object that may have "allowedTypes" or "restrictedTypes"
 * @param value - The value to validate, expected to follow the structure of an array-based schema.
 * @returns True if the value has type === 'array' and a valid items object with the correct structure.
 */
export function isValidArrayWithItems(
  value: any
): value is AllowedOrRestrictedType {
  return (
    value?.type === 'array' &&
    typeof value.items === 'object' &&
    (hasArrayOfContentOrMediaTypes(value.items, 'allowedTypes') ||
      hasArrayOfContentOrMediaTypes(value.items, 'restrictedTypes'))
  );
}
