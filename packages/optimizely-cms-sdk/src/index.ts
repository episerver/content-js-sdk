// Content type and display template
export {
  buildConfig,
  contentType,
  contract,
  displayTemplate,
  isContentType,
  isContract,
  isDisplayTemplate,
  isContentTypeRegistered,
  initContentTypeRegistry,
  initDisplayTemplateRegistry,
  PropertyGroupType,
} from './model/index.js';

// GraphQL
export {
  GraphClient,
  GraphGetContentOptions,
  GraphGetLinksOptions,
  GraphVariationInput,
  getClient,
  config,
} from './graph/index.js';

// GraphQL types
export type {
  PreviewParams,
  GraphReference,
  GraphGetItemOptions,
  GraphQueryOptions,
  GraphSlot,
} from './graph/index.js';

// Provided content types and experiences
export {
  BlankSectionContentType,
  BlankExperienceContentType,
} from './model/internalContentTypes.js';

// Namespaces for errors, types, and utilities
export * as GraphErrors from './graph/error.js';
export * as ContentTypes from './model/contentTypes.js';
export * as BuildConfig from './model/buildConfig.js';
export * as DisplayTemplates from './model/displayTemplates.js';
export * as Properties from './model/properties.js';

// Type inference and asset utilities
export { ContentProps } from './infer.js';

// Dam assets
export { damAssets } from './render/assets.js';
