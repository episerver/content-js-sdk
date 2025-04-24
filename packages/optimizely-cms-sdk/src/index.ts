// This is the root entry point for the package.
// Re-export everything
export {
  buildConfig,
  contentType,
  displayTemplate,
  isContentType,
  isDisplayTemplate,
  initContentTypeRegistry,
} from './model/index.js';
export { GraphClient } from './graph/index.js';
export type * as ContentTypes from './model/contentTypes.js';
export type * as DisplayTemplates from './model/displayTemplates.js';
export type * as Properties from './model/properties.js';
export type { Infer } from './infer.js';
