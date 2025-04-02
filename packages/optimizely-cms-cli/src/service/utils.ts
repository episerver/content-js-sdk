import { resolve } from 'node:path';
import { glob } from 'glob';
import { tsImport } from 'tsx/esm/api';
import { ContentTypes } from 'optimizely-cms-sdk';

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/** extract AnyContentType */
type AllContentType = ContentTypes.AnyContentType;

export type FoundContentType = {
  path: string;
  contentType: AllContentType;
};

/** Argument for `buildConfig` */
export type Config = {
  contentTypes?: AllContentType[] | string;
};

function isContentType(obj: unknown): obj is AllContentType {
  return typeof obj === 'object' && obj !== null && 'key' in obj;
}

/** Finds a list of content types in a given glob */
export async function findContentTypes(
  pattern: string,
  cwd: string
): Promise<FoundContentType[]> {
  const files = await glob(pattern, { cwd });

  const found = await Promise.all(
    files.map(async (file) => {
      const loaded = await tsImport(resolve(file), cwd);
      const matches: FoundContentType[] = [];

      for (const key of Object.getOwnPropertyNames(loaded)) {
        const obj = (loaded as any)[key];

        const contentType = isContentType(obj)
          ? obj
          : isContentType(obj?.ContentType)
          ? obj
          : null;

        if (contentType) {
          matches.push({
            path: file,
            contentType,
          });
        }
      }

      return matches;
    })
  );

  // Flattens the nested arrays (contentType)
  return found.flat();
}
