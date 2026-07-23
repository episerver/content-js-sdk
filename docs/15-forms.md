# Working with Optimizely Forms

The Optimizely CMS JavaScript SDK includes built-in support for Optimizely Forms, enabling you to model, fetch, and render forms in your headless applications.

> [!IMPORTANT]
> Forms support requires that Optimizely Forms is enabled in your CMS instance. See [Enabling Forms in the CMS](#enabling-forms-in-the-cms) below.

## Enabling Forms in the CMS

To use Optimizely Forms in your CMS instance:

1. Log in to the Optimizely CMS UI
2. Navigate to **Settings > Forms Settings**
3. Click the **Activate** button
4. Wait for the CMS to complete the activation

Once activated, Forms-related content types become available in your GraphQL schema, and the SDK will automatically detect that Forms is enabled.

## Available Forms Content Types

The SDK exports pre-defined content type definitions for Optimizely Forms field types. These are ready to use in your content models:

### Container & Structure

- `OptiFormsContainerDataContentType` - The main form container that holds all form fields

### Input Fields

- `OptiFormsTextboxElementContentType` - Single-line text input
- `OptiFormsTextareaElementContentType` - Multi-line text input
- `OptiFormsNumberElementContentType` - Numeric input field
- `OptiFormsUrlElementContentType` - URL input field

### Selection Fields

- `OptiFormsChoiceElementContentType` - Single or multiple choice selection
- `OptiFormsSelectionElementContentType` - Dropdown/select field with autocomplete support

### Special Input Fields

- `OptiFormsRangeElementContentType` - Slider or range input

### Actions

- `OptiFormsSubmitElementContentType` - Form submit button
- `OptiFormsResetElementContentType` - Form reset button

### Advanced

- `OptiFormsConditionContentType` - Conditional display logic
- `OptiFormsDependencyRuleContentType` - Field dependency rules

## Importing Forms Content Types

Import the pre-defined Forms content types from the SDK:

```ts
import {
  OptiFormsContainerDataContentType,
  OptiFormsTextboxElementContentType,
  OptiFormsSubmitElementContentType,
  FormContentTypes, // Exports all form types in an array
} from '@optimizely/cms-sdk';
```

## Using Forms in Your Content Model

You can include Forms content types in your custom content types:

```ts
import { contentType } from '@optimizely/cms-sdk';
import { OptiFormsContainerDataContentType } from '@optimizely/cms-sdk';

export const PageWithFormContentType = contentType({
  key: 'PageWithForm',
  baseType: '_page',
  properties: {
    title: {
      type: 'string',
      displayName: 'Page Title',
    },
    form: {
      type: 'component',
      displayName: 'Contact Form',
      contentType: OptiFormsContainerDataContentType,
    },
  },
});
```
