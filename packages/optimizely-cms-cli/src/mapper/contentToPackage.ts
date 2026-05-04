import { AnyContentType } from '../service/utils.js';
import { transformProperties, validateContentTypeKey, parseChildContentType } from '../utils/mapping.js';
import chalk from 'chalk';

function convertExtendsToContracts(contentType: AnyContentType): string[] | undefined {
  if (!contentType.extends) return undefined;
  
  const extendsArr = Array.isArray(contentType.extends) ? contentType.extends : [contentType.extends];
  if (extendsArr.length === 0) return undefined;

  return extendsArr.map(contract => contract.key);
}

/**
 * Transforms a content type object to a manifest format.
 * Validates the content type key and formats its properties.
 * @param contentType - The content type object to transform.
 * @param allowedKeys - Set of valid content type keys for validation.
 * @returns
 */
function transformContentType(contentType: AnyContentType, allowedKeys?: Set<string>): any {
  validateContentTypeKey(contentType.key);

  const { key, properties = {} } = contentType;
  const parsedContentType = parseChildContentType(contentType, allowedKeys);
  const formattedProperties = transformProperties(properties, key);
  const contracts = convertExtendsToContracts(contentType);

  return {
    ...parsedContentType,
    properties: formattedProperties,
    ...(contracts ? { contracts } : {})
  };
}

/**
 * Maps an array of content types to a manifest format.
 * Validates string entries in mayContainTypes against known content type keys.
 * Deduplicates content types by key, keeping the first occurrence.
 * @param contentTypes - Array of content types to transform.
 * @returns An array of transformed content types.
 */
export function mapContentToManifest(contentTypes: AnyContentType[]): any[] {
  // Deduplicate by key, keeping the first occurrence
  const seenKeys = new Set<string>();
  const duplicateKeys = new Set<string>();
  const deduplicatedContentTypes: AnyContentType[] = [];

  for (const ct of contentTypes) {
    if (seenKeys.has(ct.key)) {
      duplicateKeys.add(ct.key);
    } else {
      seenKeys.add(ct.key);
      deduplicatedContentTypes.push(ct);
    }
  }

  // Warn about duplicates
  if (duplicateKeys.size > 0) {
    console.warn(
      chalk.yellow(
        `Warning: Duplicate content type keys found: ${Array.from(duplicateKeys).join(', ')}. Keeping the first occurrence of each.`,
      ),
    );
  }

  const allowedKeys = new Set(deduplicatedContentTypes.map(ct => ct.key));
  return deduplicatedContentTypes.map(ct => transformContentType(ct, allowedKeys));
}
