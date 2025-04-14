import { resolve } from 'node:path';
import { glob } from 'glob';
import { tsImport } from 'tsx/esm/api';
import {
  ContentTypes,
  isContentType,
  DisplayTemplates,
  isDisplayTemplate,
} from 'optimizely-cms-sdk';

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
export function extractMetaData(obj: unknown): {
  contentTypeData: AnyContentType;
  displayTemplateData: DisplayTemplate;
} {
  // Try to find a content type
  const contentTypeData = isContentType(obj)
    ? obj
    : isContentType((obj as any)?.ContentType)
    ? (obj as any)?.ContentType
    : null;

  // Try to find a display template
  const displayTemplateData = isDisplayTemplate(obj)
    ? obj
    : isDisplayTemplate((obj as any)?.DisplayTemplate)
    ? (obj as any)?.DisplayTemplate
    : null;

  cleanType(contentTypeData);
  cleanType(displayTemplateData);

  return {
    contentTypeData,
    displayTemplateData,
  };
}

/** Finds content types and display templates in a given glob */
export async function findMetaData(
  {
    contentTypePath,
    displayTemplatePath,
  }: { contentTypePath: string; displayTemplatePath: string },
  cwd: string
): Promise<{
  contentTypes: ContentTypeMeta[];
  displayTemplates: DisplayTemplateMeta[];
}> {
  // Retrieve two distinct sets of files via glob
  const contentTypeFiles = await glob(contentTypePath, { cwd });
  const displayTemplateFiles = await glob(displayTemplatePath, { cwd });

  // Combine and deduplicate the files, if necessary
  const allFiles = [...new Set([...contentTypeFiles, ...displayTemplateFiles])];

  // Process each file
  const found = await Promise.all(
    allFiles.map(async (file) => {
      const loaded = await tsImport(resolve(file), cwd);

      // Local arrays for each file
      let localContentTypes: ContentTypeMeta[] = [];
      let localDisplayTemplates: DisplayTemplateMeta[] = [];

      for (const key of Object.getOwnPropertyNames(loaded)) {
        const obj = (loaded as any)[key];

        const { contentTypeData, displayTemplateData } = extractMetaData(obj);

        if (contentTypeData) {
          localContentTypes.push({
            contentType: contentTypeData,
            path: file,
          });
        }

        if (displayTemplateData) {
          localDisplayTemplates.push({
            displayTemplates: displayTemplateData,
            path: file,
          });
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
