/**
 * Stand-in content for a component nobody has authored yet.
 *
 * For the application that owns the components: `withMock` declares what a
 * component should look like in a preview, written next to the component
 * itself.
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
export { withMock, mockOf } from '../render/withMock.js';
export type {
  ComponentMock,
  FakerLike,
  MockContentOptions,
  MockData,
  MockDataFactory,
  MockDataOverrides,
  MockDataSource,
} from '../render/mockContent.js';
