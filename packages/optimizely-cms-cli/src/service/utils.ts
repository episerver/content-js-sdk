import { resolve } from 'node:path';
import { glob } from 'glob';
import { tsImport } from 'tsx/esm/api';
import {
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
 * Given an object, extract its ContentType or DisplayTemplate if present.
 * Returns an cleaned ('__type' removed) object with both possibilities (one or both may be `null`).
 */
export function extractMetaData(obj: Record<string, unknown>): {
  contentTypeData: AnyContentType | null;
  displayTemplateData: DisplayTemplate | null;
} {
  let metadata: unknown[] | null = null;
  let contentTypeData: AnyContentType | null = null;
  let displayTemplateData: DisplayTemplate | null = null;

  if ('key' in obj) {
    metadata = [obj];
  } else {
    // handles nextjs module exports
    metadata = Object.values(obj);
  }

  metadata?.forEach((item) => {
    if (isContentType(item)) {
      contentTypeData = item;
    } else if (isDisplayTemplate(item)) {
      displayTemplateData = item;
    }
  });

  if (contentTypeData) {
    cleanType(contentTypeData);
  }

  if (displayTemplateData) {
    cleanType(displayTemplateData);
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
  // Retrieve sets of files via glob
  const allFiles = (
    await Promise.all(componentPaths.map((path) => glob(path, { cwd })))
  ).flat();

  // Process each file
  const found = await Promise.all(
    allFiles.map(async (file) => {
      const loaded = await tsImport(resolve(file), cwd);

      // Local arrays for each file
      let localContentTypes: AnyContentType[] = [];
      let localDisplayTemplates: DisplayTemplate[] = [];

      for (const key of Object.getOwnPropertyNames(loaded)) {
        const obj = (loaded as any)[key];

        const { contentTypeData, displayTemplateData } = extractMetaData(obj);

        if (contentTypeData) {
          printFilesContnets('Content Type', file, contentTypeData);
          localContentTypes.push(contentTypeData);
        }

        if (displayTemplateData) {
          printFilesContnets('Display Template', file, displayTemplateData);
          localDisplayTemplates.push(displayTemplateData);
        }
      }

      return {
        contentTypes: localContentTypes,
        displayTemplates: localDisplayTemplates,
      };
    })
  );

  // Flatten the results
  const result = found.reduce(
    (acc, curr) => {
      acc.contentTypes.push(...curr.contentTypes);
      acc.displayTemplates.push(...curr.displayTemplates);
      return acc;
    },
    { contentTypes: [], displayTemplates: [] }
  );

  return result;
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
