import { describe, expect, test } from 'vitest';
import { createFragment, createSingleContentQuery } from '../createQuery.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';
import {
  FormContentTypes,
  OptiFormsContainerDataContentType,
  OptiFormsTextboxElementContentType,
  OptiFormsRangeElementContentType,
} from '../../model/formContentTypes.js';
import { GraphMissingContentTypeError } from '../error.js';

describe('createFragment() for form content types', () => {
  test('container type generates correct fragment (string + url + boolean properties)', async () => {
    initContentTypeRegistry([OptiFormsContainerDataContentType]);

    const result = await createFragment('OptiFormsContainerData');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment OptiFormsContainerData on OptiFormsContainerData { __typename OptiFormsContainerData__Title:Title OptiFormsContainerData__Description:Description OptiFormsContainerData__ShowSummaryMessageAfterSubmission:ShowSummaryMessageAfterSubmission OptiFormsContainerData__SubmitConfirmationMessage:SubmitConfirmationMessage OptiFormsContainerData__ResetConfirmationMessage:ResetConfirmationMessage OptiFormsContainerData__SubmitUrl:SubmitUrl { ...ContentUrl } ..._IContent }",
      ]
    `);
  });

  test('simple field type (Textbox — string + json properties) generates correct fragment', async () => {
    initContentTypeRegistry([OptiFormsTextboxElementContentType]);

    const result = await createFragment('OptiFormsTextboxElement');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment OptiFormsTextboxElement on OptiFormsTextboxElement { __typename OptiFormsTextboxElement__Label:Label OptiFormsTextboxElement__Placeholder:Placeholder OptiFormsTextboxElement__Tooltip:Tooltip OptiFormsTextboxElement__PredefinedValue:PredefinedValue OptiFormsTextboxElement__Validators:Validators OptiFormsTextboxElement__AutoComplete:AutoComplete ..._IContent }",
      ]
    `);
  });

  test('mixed field type (Range — string + integer properties) generates correct fragment', async () => {
    initContentTypeRegistry([OptiFormsRangeElementContentType]);

    const result = await createFragment('OptiFormsRangeElement');
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment MediaMetadata on MediaMetadata { mimeType thumbnail content }",
        "fragment ItemMetadata on ItemMetadata { changeset displayOption }",
        "fragment InstanceMetadata on InstanceMetadata { changeset locales expired container owner routeSegment lastModifiedBy path createdBy }",
        "fragment ContentUrl on ContentUrl { type default hierarchical internal graph base }",
        "fragment IContentMetadata on IContentMetadata { key locale fallbackForLocale version displayName url {...ContentUrl} types published status created lastModified sortOrder variation ...MediaMetadata ...ItemMetadata ...InstanceMetadata }",
        "fragment _IContent on _IContent { _id _metadata {...IContentMetadata} }",
        "fragment OptiFormsRangeElement on OptiFormsRangeElement { __typename OptiFormsRangeElement__Label:Label OptiFormsRangeElement__Tooltip:Tooltip OptiFormsRangeElement__PredefinedValue:PredefinedValue OptiFormsRangeElement__Min:Min OptiFormsRangeElement__Max:Max OptiFormsRangeElement__Increment:Increment ..._IContent }",
      ]
    `);
  });

  test('all form types can be registered and queried without errors', async () => {
    initContentTypeRegistry(FormContentTypes);

    for (const ct of FormContentTypes) {
      const result = await createFragment(ct.key);
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      // Last fragment should be for the form type itself
      const lastFragment = result[result.length - 1];
      expect(lastFragment).toContain(`fragment ${ct.key} on ${ct.key}`);
    }
  });

  test('missing form type still throws GraphMissingContentTypeError', async () => {
    initContentTypeRegistry([OptiFormsTextboxElementContentType]);

    try {
      await createFragment('OptiFormsNonExistentType');
      expect.unreachable('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(GraphMissingContentTypeError);
      expect((e as GraphMissingContentTypeError).contentType).toBe(
        'OptiFormsNonExistentType'
      );
    }
  });
});

describe('formsEnabled feature detection in experience fragments', () => {
  test('formsEnabled = true includes form types in _IComponent fragment', async () => {
    const myExperience = contentType({
      key: 'TestExperience',
      baseType: '_experience',
      properties: {},
    });
    initContentTypeRegistry([
      myExperience,
      OptiFormsTextboxElementContentType,
      OptiFormsContainerDataContentType,
    ]);

    const result = await createFragment('TestExperience', new Set(), '', true, false, true);

    // _IComponent fragment should include form types
    const componentFragment = result.find((f) => f.startsWith('fragment _IComponent'));
    expect(componentFragment).toBeDefined();
    expect(componentFragment).toContain('...OptiFormsTextboxElement');
    expect(componentFragment).toContain('...OptiFormsContainerData');
  });

  test('formsEnabled = false excludes form types from _IComponent fragment', async () => {
    const myExperience = contentType({
      key: 'TestExperience',
      baseType: '_experience',
      properties: {},
    });
    initContentTypeRegistry([
      myExperience,
      OptiFormsTextboxElementContentType,
      OptiFormsContainerDataContentType,
    ]);

    const result = await createFragment('TestExperience', new Set(), '', true, false, false);

    // _IComponent fragment should NOT include form types
    const componentFragment = result.find((f) => f.startsWith('fragment _IComponent'));
    expect(componentFragment).toBeDefined();
    expect(componentFragment).not.toContain('...OptiFormsTextboxElement');
    expect(componentFragment).not.toContain('...OptiFormsContainerData');
  });

  test('formsEnabled = false does not affect non-form component types', async () => {
    const nonFormComponent = contentType({
      key: 'CallToAction',
      baseType: '_component',
      compositionBehaviors: ['elementEnabled'],
      properties: {
        label: { type: 'string' },
      },
    });
    const myExperience = contentType({
      key: 'TestExperience',
      baseType: '_experience',
      properties: {},
    });
    initContentTypeRegistry([
      myExperience,
      nonFormComponent,
      OptiFormsTextboxElementContentType,
    ]);

    const result = await createFragment('TestExperience', new Set(), '', true, false, false);

    const componentFragment = result.find((f) => f.startsWith('fragment _IComponent'));
    expect(componentFragment).toBeDefined();
    // Non-form component should still be included
    expect(componentFragment).toContain('...CallToAction');
    // Form type should be excluded
    expect(componentFragment).not.toContain('...OptiFormsTextboxElement');
  });

  test('createSingleContentQuery passes formsEnabled through to experience fragments', async () => {
    const nonFormComponent = contentType({
      key: 'CallToAction',
      baseType: '_component',
      compositionBehaviors: ['elementEnabled'],
      properties: {
        label: { type: 'string' },
      },
    });
    const myExperience = contentType({
      key: 'TestExperience',
      baseType: '_experience',
      properties: {},
    });
    initContentTypeRegistry([
      myExperience,
      nonFormComponent,
      ...FormContentTypes,
    ]);

    // formsEnabled = false
    const queryDisabled = createSingleContentQuery('TestExperience', false, false);
    expect(queryDisabled).toContain('...CallToAction');
    expect(queryDisabled).not.toContain('...OptiFormsTextboxElement');
    expect(queryDisabled).not.toContain('...OptiFormsContainerData');

    // formsEnabled = true
    const queryEnabled = createSingleContentQuery('TestExperience', false, true);
    expect(queryEnabled).toContain('...CallToAction');
    expect(queryEnabled).toContain('...OptiFormsTextboxElement');
    expect(queryEnabled).toContain('...OptiFormsContainerData');
  });
});
