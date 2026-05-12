import { describe, it, expect } from 'vitest';
import { contract, contentType, initContentTypeRegistry } from '../../model/index.js';
import { createFragment } from '../createQuery.js';

describe('contracts', () => {
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
    expect(result).toMatchInlineSnapshot(`
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

  it('should create fragments for page with allowedTypes that accepts contracts', async () => {
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

    const TestPage = contentType({
      baseType: '_page',
      key: 'TestPage',
      displayName: 'Test Page',
      properties: {
        sections: {
          type: 'array',
          items: {
            type: 'content',
            allowedTypes: [TestContract],
          },
        },
        mainContent: {
          type: 'content',
          allowedTypes: [TestContract],
        },
      },
    });

    initContentTypeRegistry([TestContract, TestPage]);

    const result = await createFragment('TestPage');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment TestContract on ITestContract { __typename TestContract__Category:Category TestContract__Tags:Tags ..._IContent }",
        "fragment TestPage on TestPage { __typename TestPage__sections:sections { __typename ...TestContract } TestPage__mainContent:mainContent { __typename ...TestContract } ..._IContent }",
      ]
    `);
  });

  it('should create experience with allowedTypes contract when extending components have no composition behaviors', async () => {
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
      properties: {
        sections: {
          type: 'array',
          items: {
            type: 'content',
            allowedTypes: [TestContract],
          },
        },
        mainContent: {
          type: 'content',
          allowedTypes: [TestContract],
        },
      },
    });

    initContentTypeRegistry([TestContract, ContentTypeA, ContentTypeB, TestExperience]);

    const result = await createFragment('TestExperience');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment TestContract on ITestContract { __typename TestContract__Category:Category TestContract__Tags:Tags ..._IContent }",
        "fragment _IExperience on _IExperience { composition {...ICompositionNode }}",
        "fragment ICompositionNode on ICompositionNode { __typename key type nodeType layoutType displayName displayTemplateKey displaySettings {key value} ...on CompositionStructureNode { nodes @recursive } ...on CompositionComponentNode { nodeType component { ..._IComponent } } }",
        "fragment _IComponent on _IComponent { __typename  }",
        "fragment TestExperience on TestExperience { __typename TestExperience__sections:sections { __typename ...TestContract } TestExperience__mainContent:mainContent { __typename ...TestContract } ..._IContent ..._IExperience }",
      ]
    `);
  });

  it('should create experience with allowedTypes contract when extending components have composition behaviors', async () => {
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
      properties: {
        sections: {
          type: 'array',
          items: {
            type: 'content',
            allowedTypes: [TestContract],
          },
        },
        mainContent: {
          type: 'content',
          allowedTypes: [TestContract],
        },
      },
    });

    initContentTypeRegistry([TestContract, ContentTypeA, ContentTypeB, TestExperience]);

    const result = await createFragment('TestExperience');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment TestContract on ITestContract { __typename TestContract__Category:Category TestContract__Tags:Tags ..._IContent }",
        "fragment _IExperience on _IExperience { composition {...ICompositionNode }}",
        "fragment ICompositionNode on ICompositionNode { __typename key type nodeType layoutType displayName displayTemplateKey displaySettings {key value} ...on CompositionStructureNode { nodes @recursive } ...on CompositionComponentNode { nodeType component { ..._IComponent } } }",
        "fragment ContentTypeA on ContentTypeA { __typename ContentTypeA__Category:Category ContentTypeA__Tags:Tags ContentTypeA__headingA:headingA ..._IContent }",
        "fragment ContentTypeB on ContentTypeB { __typename ContentTypeB__Category:Category ContentTypeB__Tags:Tags ContentTypeB__headingB:headingB ..._IContent }",
        "fragment _IComponent on _IComponent { __typename ...ContentTypeA ...ContentTypeB }",
        "fragment TestExperience on TestExperience { __typename TestExperience__sections:sections { __typename ...TestContract } TestExperience__mainContent:mainContent { __typename ...TestContract } ..._IContent ..._IExperience }",
      ]
    `);
  });

  it('should create experience with array of content and content property with restrictedTypes', async () => {
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

    const TestExperience = contentType({
      baseType: '_experience',
      key: 'TestExperience',
      displayName: 'Test Experience',
      properties: {
        sections: {
          type: 'array',
          items: {
            type: 'content',
            restrictedTypes: [TestContract],
          },
        },
        mainContent: {
          type: 'content',
          restrictedTypes: [TestContract],
        },
      },
    });

    initContentTypeRegistry([TestContract, ContentTypeA, ContentTypeB, TestExperience]);

    const result = await createFragment('TestExperience');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment ContentTypeA on ContentTypeA { __typename ContentTypeA__Category:Category ContentTypeA__Tags:Tags ContentTypeA__headingA:headingA ..._IContent }",
        "fragment ContentTypeB on ContentTypeB { __typename ContentTypeB__Category:Category ContentTypeB__Tags:Tags ContentTypeB__headingB:headingB ..._IContent }",
        "fragment _IExperience on _IExperience { composition {...ICompositionNode }}",
        "fragment ICompositionNode on ICompositionNode { __typename key type nodeType layoutType displayName displayTemplateKey displaySettings {key value} ...on CompositionStructureNode { nodes @recursive } ...on CompositionComponentNode { nodeType component { ..._IComponent } } }",
        "fragment _IComponent on _IComponent { __typename  }",
        "fragment TestExperience on TestExperience { __typename TestExperience__sections:sections { __typename ...ContentTypeA ...ContentTypeB ...TestExperience } TestExperience__mainContent:mainContent { __typename ...ContentTypeA ...ContentTypeB ...TestExperience } ..._IContent ..._IExperience }",
      ]
    `);
  });
});


