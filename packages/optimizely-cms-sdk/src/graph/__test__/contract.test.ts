import { describe, it, expect } from 'vitest';
import { contract, contentType, initContentTypeRegistry } from '../../model/index.js';
import { createFragment } from '../createQuery.js';

describe('Fragment generation for single contract', () => {
  it('should create TestContract with Category and Tags properties', async () => {
    const TestContract = contract({
      key: 'TestContract',
      displayName: 'Test Contract',
      properties: {
        Category: {
          type: 'string',
        },
        Tags: {
          type: 'string',
        },
      },
    });

    initContentTypeRegistry([TestContract]);

    const result = await createFragment('TestContract');
    expect(result.fragments).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment TestContract on ITestContract { __typename TestContract__Category:Category TestContract__Tags:Tags ..._IContent }",
      ]
    `);
  });
});

describe('Fragment generation of contracts used in pages', () => {
  const TestContract = contract({
    key: 'TestContract',
    displayName: 'Test Contract',
    properties: {
      Category: {
        type: 'string',
      },
      Tags: {
        type: 'string',
      },
    },
  });

  it('should create fragments for page with inline content areas having allowedTypes that accepts contracts', async () => {
    const TestPage = contentType({
      baseType: '_page',
      key: 'TestPage',
      displayName: 'Test Page',
      properties: {
        main: {
          type: 'content',
          allowedTypes: [TestContract],
        },
      },
    });

    initContentTypeRegistry([TestContract, TestPage]);

    const result = await createFragment('TestPage');
    expect(result.fragments).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment TestContract on ITestContract { __typename TestContract__Category:Category TestContract__Tags:Tags ..._IContent }",
        "fragment TestPage on TestPage { __typename TestPage__main:main { __typename ...TestContract } ..._IContent }",
      ]
    `);
  });

  it('should create fragments for page with content areas having allowedTypes that accepts contracts', async () => {
    const TestPage = contentType({
      baseType: '_page',
      key: 'TestPage',
      displayName: 'Test Page',
      properties: {
        areas: {
          type: 'array',
          items: {
            type: 'content',
            allowedTypes: [TestContract],
          },
        },
      },
    });

    initContentTypeRegistry([TestContract, TestPage]);

    const result = await createFragment('TestPage');
    expect(result.fragments).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment TestContract on ITestContract { __typename TestContract__Category:Category TestContract__Tags:Tags ..._IContent }",
        "fragment TestPage on TestPage { __typename TestPage__areas:areas { __typename ...TestContract } ..._IContent }",
      ]
    `);
  });
});

describe('Fragment generation of contracts with experiences', () => {
  // Will be changed after Graph bug for @recursive directive is fixed and nested fragments are no longer needed for composition nodes
  it('should create fragments for experience with contracts, components without composition behaviors', async () => {
    const TestContract = contract({
      key: 'TestContract',
      displayName: 'Test Contract',
      properties: {
        Category: {
          type: 'string',
        },
        Tags: {
          type: 'string',
        },
      },
    });

    const ContentTypeA = contentType({
      baseType: '_component',
      key: 'ContentTypeA',
      extends: [TestContract],
      displayName: 'ContentTypeA',
      properties: {
        headingA: {
          type: 'string',
        },
        Category: {
          type: 'string',
        },
        Tags: {
          type: 'string',
        },
      },
    });

    const ContentTypeB = contentType({
      baseType: '_component',
      key: 'ContentTypeB',
      extends: [TestContract],
      displayName: 'ContentTypeB',
      properties: {
        headingB: {
          type: 'string',
        },
        Category: {
          type: 'string',
        },
        Tags: {
          type: 'string',
        },
      },
    });

    const TestExperience = contentType({
      baseType: '_experience',
      key: 'TestExperience',
      displayName: 'Test Experience',
      properties: {},
    });

    initContentTypeRegistry([TestContract, ContentTypeA, ContentTypeB, TestExperience]);

    const result = await createFragment('TestExperience');
    expect(result.fragments).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment _IExperience on _IExperience { composition {...ICompositionNode }}",
        "fragment ICompositionNode on ICompositionNode { __typename key type nodeType layoutType displayName displayTemplateKey displaySettings {key value} ...on CompositionStructureNode { nodes { __typename key type nodeType layoutType displayName displayTemplateKey displaySettings {key value} ...on CompositionStructureNode { nodes { __typename key type nodeType layoutType displayName displayTemplateKey displaySettings {key value} ...on CompositionStructureNode { nodes { __typename key type nodeType layoutType displayName displayTemplateKey displaySettings {key value} ...on CompositionStructureNode { nodes { __typename key type nodeType layoutType displayName displayTemplateKey displaySettings {key value} ...on CompositionComponentNode { nodeType component { ..._IComponent } } } } ...on CompositionComponentNode { nodeType component { ..._IComponent } } ...on CompositionComponentNode { nodeType component { ..._IComponent } } } } ...on CompositionComponentNode { nodeType component { ..._IComponent } } ...on CompositionComponentNode { nodeType component { ..._IComponent } } } } ...on CompositionComponentNode { nodeType component { ..._IComponent } } ...on CompositionComponentNode { nodeType component { ..._IComponent } } } } ...on CompositionComponentNode { nodeType component { ..._IComponent } } }",
        "fragment _IComponent on _IComponent { __typename  }",
        "fragment TestExperience on TestExperience { __typename ..._IContent ..._IExperience }",
      ]
    `);
  });

  // Will be changed after Graph bug for @recursive directive is fixed and nested fragments are no longer needed for composition nodes
  it('should create fragments for experience with contracts, components with composition behaviors', async () => {
    const TestContract = contract({
      key: 'TestContract',
      displayName: 'Test Contract',
      properties: {
        Category: {
          type: 'string',
        },
        Tags: {
          type: 'string',
        },
      },
    });

    const ContentTypeA = contentType({
      baseType: '_component',
      key: 'ContentTypeA',
      extends: [TestContract],
      displayName: 'ContentTypeA',
      compositionBehaviors: ['elementEnabled'],
      properties: {
        headingA: {
          type: 'string',
        },
        Category: {
          type: 'string',
        },
        Tags: {
          type: 'string',
        },
      },
    });

    const ContentTypeB = contentType({
      baseType: '_component',
      key: 'ContentTypeB',
      extends: [TestContract],
      displayName: 'ContentTypeB',
      compositionBehaviors: ['sectionEnabled'],
      properties: {
        headingB: {
          type: 'string',
        },
        Category: {
          type: 'string',
        },
        Tags: {
          type: 'string',
        },
      },
    });

    const TestExperience = contentType({
      baseType: '_experience',
      key: 'TestExperience',
      displayName: 'Test Experience',
      properties: {},
    });

    initContentTypeRegistry([TestContract, ContentTypeA, ContentTypeB, TestExperience]);

    const result = await createFragment('TestExperience');
    expect(result.fragments).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment _IExperience on _IExperience { composition {...ICompositionNode }}",
        "fragment ICompositionNode on ICompositionNode { __typename key type nodeType layoutType displayName displayTemplateKey displaySettings {key value} ...on CompositionStructureNode { nodes { __typename key type nodeType layoutType displayName displayTemplateKey displaySettings {key value} ...on CompositionStructureNode { nodes { __typename key type nodeType layoutType displayName displayTemplateKey displaySettings {key value} ...on CompositionStructureNode { nodes { __typename key type nodeType layoutType displayName displayTemplateKey displaySettings {key value} ...on CompositionStructureNode { nodes { __typename key type nodeType layoutType displayName displayTemplateKey displaySettings {key value} ...on CompositionComponentNode { nodeType component { ..._IComponent } } } } ...on CompositionComponentNode { nodeType component { ..._IComponent } } ...on CompositionComponentNode { nodeType component { ..._IComponent } } } } ...on CompositionComponentNode { nodeType component { ..._IComponent } } ...on CompositionComponentNode { nodeType component { ..._IComponent } } } } ...on CompositionComponentNode { nodeType component { ..._IComponent } } ...on CompositionComponentNode { nodeType component { ..._IComponent } } } } ...on CompositionComponentNode { nodeType component { ..._IComponent } } }",
        "fragment ContentTypeA on ContentTypeA { __typename ContentTypeA__Category:Category ContentTypeA__Tags:Tags ContentTypeA__headingA:headingA ..._IContent }",
        "fragment ContentTypeB on ContentTypeB { __typename ContentTypeB__Category:Category ContentTypeB__Tags:Tags ContentTypeB__headingB:headingB ..._IContent }",
        "fragment _IComponent on _IComponent { __typename ...ContentTypeA ...ContentTypeB }",
        "fragment TestExperience on TestExperience { __typename ..._IContent ..._IExperience }",
      ]
    `);
  });

  // Will be changed after Graph bug for @recursive directive is fixed and nested fragments are no longer needed for composition nodes
  it('should create fragments for experience with content areas that do not have contracts', async () => {
    const TestContract = contract({
      key: 'testContract',
      displayName: 'Test Contract',
      properties: {
        Category: {
          type: 'string',
        },
        Tags: {
          type: 'string',
        },
      },
    });

    const ContentTypeA = contentType({
      baseType: '_component',
      key: 'ContentTypeA',
      extends: [TestContract],
      displayName: 'ContentTypeA',
      properties: {
        headingA: {
          type: 'string',
        },
        Category: {
          type: 'string',
        },
        Tags: {
          type: 'string',
        },
      },
    });

    const ContentTypeB = contentType({
      baseType: '_component',
      key: 'ContentTypeB',
      extends: [TestContract],
      displayName: 'ContentTypeB',
      properties: {
        headingB: {
          type: 'string',
        },
        Category: {
          type: 'string',
        },
        Tags: {
          type: 'string',
        },
      },
    });

    const ContentTypeC = contentType({
      baseType: '_component',
      key: 'ContentTypeC',
      extends: [TestContract],
      displayName: 'ContentTypeC',
      properties: {
        headingC: {
          type: 'string',
        },
        Category: {
          type: 'string',
        },
        Tags: {
          type: 'string',
        },
      },
    });

    const TestExperience = contentType({
      baseType: '_experience',
      key: 'TestExperience',
      displayName: 'Test Experience',
      properties: {
        main_area: {
          type: 'content',
          allowedTypes: [ContentTypeC],
        },
      },
    });

    initContentTypeRegistry([
      TestContract,
      ContentTypeA,
      ContentTypeB,
      ContentTypeC,
      TestExperience,
    ]);

    const result = await createFragment('TestExperience');
    expect(result.fragments).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment ContentTypeC on ContentTypeC { __typename ContentTypeC__Category:Category ContentTypeC__Tags:Tags ContentTypeC__headingC:headingC ..._IContent }",
        "fragment _IExperience on _IExperience { composition {...ICompositionNode }}",
        "fragment ICompositionNode on ICompositionNode { __typename key type nodeType layoutType displayName displayTemplateKey displaySettings {key value} ...on CompositionStructureNode { nodes { __typename key type nodeType layoutType displayName displayTemplateKey displaySettings {key value} ...on CompositionStructureNode { nodes { __typename key type nodeType layoutType displayName displayTemplateKey displaySettings {key value} ...on CompositionStructureNode { nodes { __typename key type nodeType layoutType displayName displayTemplateKey displaySettings {key value} ...on CompositionStructureNode { nodes { __typename key type nodeType layoutType displayName displayTemplateKey displaySettings {key value} ...on CompositionComponentNode { nodeType component { ..._IComponent } } } } ...on CompositionComponentNode { nodeType component { ..._IComponent } } ...on CompositionComponentNode { nodeType component { ..._IComponent } } } } ...on CompositionComponentNode { nodeType component { ..._IComponent } } ...on CompositionComponentNode { nodeType component { ..._IComponent } } } } ...on CompositionComponentNode { nodeType component { ..._IComponent } } ...on CompositionComponentNode { nodeType component { ..._IComponent } } } } ...on CompositionComponentNode { nodeType component { ..._IComponent } } }",
        "fragment _IComponent on _IComponent { __typename  }",
        "fragment TestExperience on TestExperience { __typename TestExperience__main_area:main_area { __typename ...ContentTypeC } ..._IContent ..._IExperience }",
      ]
    `);
  });
});
