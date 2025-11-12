import { beforeAll, describe, expect, test } from 'vitest';
import {
  allContentTypes,
  MyExperience,
} from './createQueryExperiences.fixtures.js';
import { initContentTypeRegistry } from '../../model/index.js';
import { createFragment } from '../createQuery.js';

beforeAll(() => {
  initContentTypeRegistry(allContentTypes);
});

describe('createFragment()', () => {
  test('for experience types', async () => {
    const result = await createFragment(MyExperience.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment _IExperience on _IExperience { composition {...ICompositionNode }}",
        "fragment ICompositionNode on ICompositionNode { __typename key type nodeType displayName displayTemplateKey displaySettings {key value} ...on CompositionStructureNode { nodes @recursive } ...on CompositionComponentNode { nodeType component { ..._IComponent } } }",
        "fragment CallToAction on CallToAction { __typename CallToAction__label:label CallToAction__link:link ..._IContent }",
        "fragment ExpSection on ExpSection { __typename ExpSection__heading:heading ..._IContent }",
        "fragment _IComponent on _IComponent { __typename ...CallToAction ...ExpSection }",
        "fragment MyExperience on MyExperience { __typename ..._IContent ..._IExperience }",
      ]
    `);
  });
});
