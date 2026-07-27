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

## Setting Up Forms in Your React Application

### Using `initForms` (Recommended)

The `initForms` function provides a simplified way to initialize both the content type registry and React component registry for all Optimizely Forms types in a single call.

In your application's entry point (e.g., `src/app/layout.tsx`):

```tsx
import { initForms } from '@optimizely/cms-sdk';
import FormContainer from '@/components/forms/FormContainer';
import FormInput from '@/components/forms/FormInput';
import FormTextarea from '@/components/forms/FormTextarea';
import FormSelection from '@/components/forms/FormSelection';
import FormSubmit from '@/components/forms/FormSubmit';

initForms({
  container: FormContainer,
  textbox: FormInput,
  textarea: FormTextarea,
  selection: FormSelection,
  submitButton: FormSubmit,
  // Add more form components as needed
});
```

Available form handler keys:

- `container` - Form container component
- `textbox` - Single-line text input
- `textarea` - Multi-line text input
- `number` - Numeric input field
- `range` - Range/slider input
- `url` - URL input field
- `choice` - Single/multiple choice selection
- `selection` - Dropdown/select field
- `submitButton` - Form submit button
- `resetButton` - Form reset button
- `condition` - Conditional display logic
- `rule` - Field dependency rules

#### Using Components with Tagged Variants

You can provide different component variants using the tag system:

```tsx
initForms({
  container: {
    default: DefaultFormContainer,
    tags: {
      compact: CompactFormContainer,
      modal: ModalFormContainer,
    }
  },
  textbox: TextInputComponent,
});
```

### Manual Setup (Advanced)

If you need more control, you can use the existing functions separately:

```tsx
import {
  initContentTypeRegistry,
  FormContentTypes,
} from '@optimizely/cms-sdk';
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';
import FormContainer from '@/components/forms/FormContainer';
import FormInput from '@/components/forms/FormInput';

// Initialize content types
initContentTypeRegistry(FormContentTypes);

// Initialize React components
initReactComponentRegistry({
  resolver: {
    OptiFormsContainerData: FormContainer,
    OptiFormsTextboxElement: FormInput,
    // ... other mappings
  },
});
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
