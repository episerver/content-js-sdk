/**
 * Stand-in content for a component nobody has authored yet.
 *
 * For the application that owns the components. Most of the time a property
 * says what it shows with `mock`, written in the content type; this is what
 * fills everything else, and what a preview page passes to override it.
 *
 * A separate entry point because an application rendering real pages has no
 * use for generated content and should not reach for it by accident. The
 * page that renders a component on its own is in
 * `@optimizely/cms-sdk/react/standalone`; the contract it reports over is in
 * `@optimizely/cms-sdk/protocol`.
 *
 * @module
 */

export { generateMockContent } from '../render/mockContent.js';
export type {
  FakerLike,
  MockContentOptions,
  MockData,
  MockDataFactory,
  MockDataOverrides,
  MockDataSource,
} from '../render/mockContent.js';
