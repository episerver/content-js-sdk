import { describe, it, expect, beforeAll } from 'vitest';
import { contract, contentType, initContentTypeRegistry } from '../../model/index.js';
import { createFragment } from '../createQuery.js';

describe('contracts', () => {
  it('should create Categorizable contract with Category and Tags properties', async () => {
    const Categorizable = contract({
      key: 'categorizable',
      displayName: 'Categorizable',
      properties: {
        Category: {
          type: 'string',
        },
        Tags: {
          type: 'string',
        },
      },
    });

    initContentTypeRegistry([Categorizable]);

    const result = await createFragment('categorizable');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment categorizable on categorizable { __typename categorizable__Category:Category categorizable__Tags:Tags ..._IContent }",
      ]
    `);
  });

  it('should create experience with array of content and content property with allowedTypes', async () => {
    const Categorizable = contract({
      key: 'categorizable',
      displayName: 'Categorizable',
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
      extends: [Categorizable],
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
      extends: [Categorizable],
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
            allowedTypes: [Categorizable],
          },
        },
        mainContent: {
          type: 'content',
          allowedTypes: [Categorizable],
        },
      },
    });

    initContentTypeRegistry([Categorizable, ContentTypeA, ContentTypeB, TestExperience]);

    const result = await createFragment('TestExperience');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment categorizable on categorizable { __typename categorizable__Category:Category categorizable__Tags:Tags ..._IContent }",
        "fragment _IExperience on _IExperience { composition {...ICompositionNode }}",
        "fragment ICompositionNode on ICompositionNode { __typename key type nodeType layoutType displayName displayTemplateKey displaySettings {key value} ...on CompositionStructureNode { nodes @recursive } ...on CompositionComponentNode { nodeType component { ..._IComponent } } }",
        "fragment _IComponent on _IComponent { __typename  }",
        "fragment TestExperience on TestExperience { __typename TestExperience__sections:sections { __typename ...categorizable } TestExperience__mainContent:mainContent { __typename ...categorizable } ..._IContent ..._IExperience }",
      ]
    `);
  });

  it('Test when section enabled or element enabled is used in the contentTypes ContentTypeA & ContentTypeB that extends contract ', async () => {
    const Categorizable = contract({
      key: 'categorizable',
      displayName: 'Categorizable',
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
      extends: [Categorizable],
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
      extends: [Categorizable],
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
            allowedTypes: [Categorizable],
          },
        },
        mainContent: {
          type: 'content',
          allowedTypes: [Categorizable],
        },
      },
    });

    initContentTypeRegistry([Categorizable, ContentTypeA, ContentTypeB, TestExperience]);

    const result = await createFragment('TestExperience');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment categorizable on categorizable { __typename categorizable__Category:Category categorizable__Tags:Tags ..._IContent }",
        "fragment _IExperience on _IExperience { composition {...ICompositionNode }}",
        "fragment ICompositionNode on ICompositionNode { __typename key type nodeType layoutType displayName displayTemplateKey displaySettings {key value} ...on CompositionStructureNode { nodes @recursive } ...on CompositionComponentNode { nodeType component { ..._IComponent } } }",
        "fragment ContentTypeA on ContentTypeA { __typename ContentTypeA__Category:Category ContentTypeA__Tags:Tags ContentTypeA__headingA:headingA ..._IContent }",
        "fragment ContentTypeB on ContentTypeB { __typename ContentTypeB__Category:Category ContentTypeB__Tags:Tags ContentTypeB__headingB:headingB ..._IContent }",
        "fragment _IComponent on _IComponent { __typename ...ContentTypeA ...ContentTypeB }",
        "fragment TestExperience on TestExperience { __typename TestExperience__sections:sections { __typename ...categorizable } TestExperience__mainContent:mainContent { __typename ...categorizable } ..._IContent ..._IExperience }",
      ]
    `);
  });

  it('should create experience with array of content and content property with restrictedTypes', async () => {
    const Categorizable = contract({
      key: 'categorizable',
      displayName: 'Categorizable',
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
      extends: [Categorizable],
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
      extends: [Categorizable],
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

            restrictedTypes: [Categorizable],
          },
        },
        mainContent: {
          type: 'content',
          restrictedTypes: [Categorizable],
        },
      },
    });

    initContentTypeRegistry([Categorizable, ContentTypeA, ContentTypeB, TestExperience]);

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

