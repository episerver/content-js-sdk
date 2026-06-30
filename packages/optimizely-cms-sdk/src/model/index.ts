import { BuildConfig } from './buildConfig.js';
import {
  AnyContentType,
  ContentType,
  Contract,
  PropertiesRecord,
  SuppliedContractValues,
} from './contentTypes.js';
import { DisplayTemplate, DisplayTemplateVariant } from './displayTemplates.js';
import { getAllContentTypes } from './contentTypeRegistry.js';

function getMergedProps<T extends AnyContentType>(
  options: T,
): PropertiesRecord | undefined {
  if (!options.extends && !options.properties) return undefined;

  const contracts = Array.isArray(options.extends) ? options.extends : [options.extends];
  const mergedContractsProps = contracts.reduce(
    (acc, contract) => (contract?.properties ? { ...acc, ...contract.properties } : acc),
    {},
  );
  const props = options.properties;
  const merged = { ...mergedContractsProps, ...props };

  if (Object.keys(merged).length) return merged as PropertiesRecord;
  return undefined;
}

/** Defines a Optimizely CMS content type */
export function contentType<T extends AnyContentType>(options: T): ContentType<T> {
  const properties = getMergedProps(options);
  return {
    ...options,
    ...(properties ? { properties } : {}),
    __type: 'contentType',
  } as unknown as ContentType<T>;
}

/**
 * Defines an Optimizely CMS contract.
 *
 * @param options - The contract definition
 * @param options.key - Unique identifier for the contract
 * @param options.displayName - Human-readable name shown in the CMS UI
 * @param options.properties - Property definitions that will be inherited by extending content types
 * @returns A contract object
 *
 * @example
 * ```typescript
 * const SEOContract = contract({
 *   key: 'seo',
 *   displayName: 'SEO Properties',
 *   properties: {
 *     metaTitle: { type: 'string' },
 *     metaDescription: { type: 'string' },
 *   }
 * });
 *
 * // Content types can extend this contract
 * const ArticleContentType = contentType({
 *   key: 'article',
 *   displayName: 'Article',
 *   baseType: '_page',
 *   extends: SEOContract,
 *   properties: {
 *     title: { type: 'string' },
 *     body: { type: 'richText' }
 *   }
 * });
 * ```
 */
export function contract<P extends PropertiesRecord>(
  options: SuppliedContractValues<P>,
): Contract<P> {
  return { ...options, __type: 'contract', isContract: true };
}

/** Defines a Optimizely CMS display template */
export function displayTemplate<T extends DisplayTemplateVariant>(
  options: T,
): DisplayTemplate<T> {
  return { ...options, __type: 'displayTemplate' };
}

/** Defines a Optimizely CMS build configuration */
export function buildConfig<T extends BuildConfig>(
  options: T,
): T & { __type: 'buildConfig' } {
  return { ...options, __type: 'buildConfig' };
}

/**
 * Checks if `obj` is a content type.
 */
export function isContentType(obj: unknown): obj is AnyContentType {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '__type' in obj &&
    (obj as any).__type === 'contentType' &&
    'key' in obj
  );
}

/**
 * Checks if `obj` is a contract.
 */
export function isContract(obj: unknown): obj is Contract {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '__type' in obj &&
    (obj as any).__type === 'contract' &&
    'key' in obj
  );
}

/**
 * Checks if `obj` is a display template.
 */
export function isDisplayTemplate(obj: unknown): obj is DisplayTemplate {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    '__type' in obj &&
    (obj as any).__type === 'displayTemplate' &&
    'key' in obj
  );
}

/**
 * Finds all content types that extend a given contract.
 *
 * @param contract - The contract to search for
 * @returns Array of content types that extend the contract
 */
export const findExtendingContentTypes = (contract: Contract): AnyContentType[] =>
  getAllContentTypes().filter((entry): entry is AnyContentType => {
    if (!isContentType(entry)) return false;

    const extendedContracts =
      Array.isArray(entry.extends) ? entry.extends : [entry.extends];
    return extendedContracts.some(c => c?.key === contract.key);
  });

export {
  PropertyGroupType,
  ApplicationsType,
  ApplicationHostType,
} from './buildConfig.js';
export {
  init as initContentTypeRegistry,
  isContentTypeRegistered,
} from './contentTypeRegistry.js';
export { init as initDisplayTemplateRegistry } from './displayTemplateRegistry.js';

// Re-export types needed for declaration file generation
export type {
  AnyContentType,
  BaseTypes,
  ComponentContentType,
  ContentType,
  Contract,
  ExperienceContentType,
  FolderContentType,
  MediaContentType,
  MediaStringTypes,
  PageContentType,
  PermittedTypes,
  PropertiesRecord,
  SectionContentType,
  SuppliedContractValues,
} from './contentTypes.js';
