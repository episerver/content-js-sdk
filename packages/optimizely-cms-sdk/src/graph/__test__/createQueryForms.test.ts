import { describe, expect, test } from 'vitest';
import { createFragment } from '../createQuery.js';
import { initContentTypeRegistry } from '../../model/index.js';
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
