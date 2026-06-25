import { beforeAll, describe, expect, test } from 'vitest';
import {
  allContentTypes,
  MyExperience,
  HeroSection,
  SectionsOnlyExperience,
} from './createQueryExperiences.fixtures.js';
import { initContentTypeRegistry } from '../../model/index.js';
import { createFragment, createSingleContentQuery, createMultipleContentQuery } from '../createQuery.js';

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
        "fragment CardSection on CardSection { __typename CardSection__title:title CardSection__cards:cards { __typename ...CallToAction } ..._IContent }",
        "fragment EmptySection on EmptySection { __typename ..._IContent }",
        "fragment ImageComponentProperty on ImageComponentProperty { __typename ImageComponentProperty__title:title image { key url { ...ContentUrl } } }",
        "fragment SectionWithComponent on SectionWithComponent { __typename SectionWithComponent__component:component { ...ImageComponentProperty } ..._IContent }",
        "fragment _IComponent on _IComponent { __typename ...CallToAction ...ExpSection ...ImageComponent }",
        "fragment _ISection on _ISection { __typename ...HeroSection ...CardSection ...EmptySection ...SectionWithComponent }",
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

    // Should include _ISection interface with all section spreads
    expect(fragmentsString).toContain('fragment _ISection on _ISection');
    expect(fragmentsString).toContain('...HeroSection');
    expect(fragmentsString).toContain('...CardSection');
    expect(fragmentsString).toContain('...EmptySection');
    expect(fragmentsString).toContain('...SectionWithComponent');

    // Should include CompositionSectionNode in composition tree
    expect(fragmentsString).toContain('CompositionSectionNode { nodeType section { ..._ISection }');
  });

  test('includes multiple section fragments in experience queries', async () => {
    const result = await createFragment(MyExperience.key);

    const fragmentsString = result.fragments.join('\n');

    // Should include all section fragments
    expect(fragmentsString).toContain('fragment HeroSection');
    expect(fragmentsString).toContain('fragment CardSection');
    expect(fragmentsString).toContain('fragment EmptySection');
    expect(fragmentsString).toContain('fragment SectionWithComponent');

    // _ISection should include all sections
    const iSectionMatch = fragmentsString.match(/fragment _ISection on _ISection \{ __typename (.*?) \}/);
    expect(iSectionMatch).toBeTruthy();
    const sectionSpreads = iSectionMatch![1];
    expect(sectionSpreads).toContain('...HeroSection');
    expect(sectionSpreads).toContain('...CardSection');
    expect(sectionSpreads).toContain('...EmptySection');
    expect(sectionSpreads).toContain('...SectionWithComponent');
  });

  test('generates fragments for section with array of content', async () => {
    const result = await createFragment('CardSection');

    const fragmentsString = result.fragments.join('\n');

    expect(fragmentsString).toContain('fragment CardSection on CardSection');
    expect(fragmentsString).toContain('CardSection__title:title');
    expect(fragmentsString).toContain('CardSection__cards:cards');
    // Should include CallToAction fragment for the array items
    expect(fragmentsString).toContain('fragment CallToAction');
  });

  test('generates fragments for section without properties', async () => {
    const result = await createFragment('EmptySection');

    const fragmentsString = result.fragments.join('\n');

    expect(fragmentsString).toContain('fragment EmptySection on EmptySection');
    // Should only have __typename and base fragments
    const emptySectionFragment = result.fragments.find(f => f.startsWith('fragment EmptySection on'));
    expect(emptySectionFragment).toContain('__typename');
    expect(emptySectionFragment).toContain('..._IContent');
  });

  test('generates fragments for section with component property', async () => {
    const result = await createFragment('SectionWithComponent');

    const fragmentsString = result.fragments.join('\n');

    expect(fragmentsString).toContain('fragment SectionWithComponent on SectionWithComponent');
    expect(fragmentsString).toContain('SectionWithComponent__component:component');
    // Should include ImageComponent fragment
    expect(fragmentsString).toContain('fragment ImageComponentProperty');
  });

  test('includes DAM fragments when sections have contentReference with damEnabled', async () => {
    const result = await createFragment('HeroSection', new Set(), '', { damEnabled: true });

    const fragmentsString = result.fragments.join('\n');

    // Should include DAM fragments for the backgroundImage
    expect(fragmentsString).toContain('fragment PublicImageAsset');
    expect(fragmentsString).toContain('fragment ContentReferenceItem');

    expect(result.includesDamAssetsFragments).toBe(true);
  });

  test('experience with only sections generates correct fragments', async () => {
    const result = await createFragment('SectionsOnlyExperience');

    const fragmentsString = result.fragments.join('\n');

    // Should include _ISection with all sections
    expect(fragmentsString).toContain('fragment _ISection on _ISection');

    // Should include _IComponent even if empty
    expect(fragmentsString).toContain('fragment _IComponent on _IComponent');

    // Should have experience composition fragments
    expect(fragmentsString).toContain('fragment _IExperience on _IExperience');
    expect(fragmentsString).toContain('CompositionSectionNode');
  });
});

describe('Query generation with sections', () => {
  test('createSingleContentQuery for section type', async () => {
    const query = createSingleContentQuery(HeroSection.key);

    expect(query).toContain('query GetContent');
    expect(query).toContain('fragment HeroSection on HeroSection');
    expect(query).toContain('HeroSection__heading:heading');
    expect(query).toContain('backgroundImage');
  });

  test('createMultipleContentQuery for section type', async () => {
    const query = createMultipleContentQuery(HeroSection.key);

    expect(query).toContain('query ListContent');
    expect(query).toContain('fragment HeroSection on HeroSection');
    expect(query).toContain('HeroSection__heading:heading');
    expect(query).toContain('items {');
  });

  test('createSingleContentQuery for experience includes section fragments', async () => {
    const query = createSingleContentQuery(MyExperience.key);

    expect(query).toContain('fragment _ISection on _ISection');
    expect(query).toContain('CompositionSectionNode');
    expect(query).toContain('fragment HeroSection');
    expect(query).toContain('fragment CardSection');
  });

  test('createSingleContentQuery for experience with only sections', async () => {
    const query = createSingleContentQuery(SectionsOnlyExperience.key);

    expect(query).toContain('fragment _ISection on _ISection');
    expect(query).toContain('fragment _IComponent on _IComponent');
    expect(query).toContain('CompositionSectionNode { nodeType section { ..._ISection }');
  });

  test('createSingleContentQuery with damEnabled includes DAM fragments for sections', async () => {
    const query = createSingleContentQuery(HeroSection.key, true);

    expect(query).toContain('fragment PublicImageAsset');
    expect(query).toContain('fragment ContentReferenceItem');
  });
});

