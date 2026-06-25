import { beforeAll, describe, expect, test } from 'vitest';
import { allContentTypes, MyExperience } from './createQueryExperiences.fixtures.js';
import { initContentTypeRegistry } from '../../model/index.js';
import { createFragment } from '../createQuery.js';

beforeAll(() => {
  initContentTypeRegistry(allContentTypes);
});

describe('createFragment()', () => {
  // Will be changed after Graph bug for @recursive directive is fixed and nested fragments are no longer needed for composition nodes
  test('for experience types', async () => {
    const result = await createFragment(MyExperience.key);
    expect(result.fragments).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment _IExperience on _IExperience { composition {...ICompositionNode }}",
        "fragment ICompositionNode on ICompositionNode { __typename key type nodeType layoutType displayName displayTemplateKey displaySettings {key value} ...on CompositionStructureNode { nodes { __typename key type nodeType layoutType displayName displayTemplateKey displaySettings {key value} ...on CompositionStructureNode { nodes { __typename key type nodeType layoutType displayName displayTemplateKey displaySettings {key value} ...on CompositionStructureNode { nodes { __typename key type nodeType layoutType displayName displayTemplateKey displaySettings {key value} ...on CompositionStructureNode { nodes { __typename key type nodeType layoutType displayName displayTemplateKey displaySettings {key value} ...on CompositionComponentNode { nodeType component { ..._IComponent } } ...on CompositionSectionNode { nodeType section { ..._ISection } } } } ...on CompositionComponentNode { nodeType component { ..._IComponent } } ...on CompositionSectionNode { nodeType section { ..._ISection } } ...on CompositionComponentNode { nodeType component { ..._IComponent } } ...on CompositionSectionNode { nodeType section { ..._ISection } } } } ...on CompositionComponentNode { nodeType component { ..._IComponent } } ...on CompositionSectionNode { nodeType section { ..._ISection } } ...on CompositionComponentNode { nodeType component { ..._IComponent } } ...on CompositionSectionNode { nodeType section { ..._ISection } } } } ...on CompositionComponentNode { nodeType component { ..._IComponent } } ...on CompositionSectionNode { nodeType section { ..._ISection } } ...on CompositionComponentNode { nodeType component { ..._IComponent } } ...on CompositionSectionNode { nodeType section { ..._ISection } } } } ...on CompositionComponentNode { nodeType component { ..._IComponent } } ...on CompositionSectionNode { nodeType section { ..._ISection } } }",
        "fragment CallToAction on CallToAction { __typename CallToAction__label:label CallToAction__link:link ..._IContent }",
        "fragment ExpSection on ExpSection { __typename ExpSection__heading:heading ..._IContent }",
        "fragment ImageComponent on ImageComponent { __typename ImageComponent__title:title image { key url { ...ContentUrl } } ..._IContent }",
        "fragment HeroSection on HeroSection { __typename HeroSection__heading:heading backgroundImage { key url { ...ContentUrl } } ..._IContent }",
        "fragment _IComponent on _IComponent { __typename ...CallToAction ...ExpSection ...ImageComponent }",
        "fragment _ISection on _ISection { __typename ...HeroSection }",
        "fragment MyExperience on MyExperience { __typename ..._IContent ..._IExperience }",
      ]
    `);
    expect(result.includesDamAssetsFragments).toBe(false);
  });

  test('includes DAM fragments when experience components have contentReference with damEnabled', async () => {
    const result = await createFragment(MyExperience.key, new Set(), '', { damEnabled: true });

    // Should include DAM fragments
    const fragmentsString = result.fragments.join('\n');
    expect(fragmentsString).toContain('fragment PublicImageAsset');
    expect(fragmentsString).toContain('fragment PublicVideoAsset');
    expect(fragmentsString).toContain('fragment PublicRawFileAsset');
    expect(fragmentsString).toContain('fragment ContentReferenceItem');

    // Should have DAM flag set to true
    expect(result.includesDamAssetsFragments).toBe(true);
  });

  test('generates fragments for section content types with custom properties', async () => {
    const result = await createFragment('HeroSection');

    const fragmentsString = result.fragments.join('\n');
    expect(fragmentsString).toContain('fragment HeroSection on HeroSection');
    expect(fragmentsString).toContain('HeroSection__heading:heading');
    expect(fragmentsString).toContain('backgroundImage { key url');
  });

  test('includes section fragments in experience queries', async () => {
    const result = await createFragment(MyExperience.key);

    const fragmentsString = result.fragments.join('\n');

    // Should include HeroSection fragment
    expect(fragmentsString).toContain('fragment HeroSection');

    // Should include _ISection interface with HeroSection spread
    expect(fragmentsString).toContain('fragment _ISection on _ISection { __typename ...HeroSection }');

    // Should include CompositionSectionNode in composition tree
    expect(fragmentsString).toContain('CompositionSectionNode { nodeType section { ..._ISection }');
  });
});

