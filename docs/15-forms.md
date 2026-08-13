# Working with Optimizely Forms

The Optimizely CMS JavaScript SDK includes built-in support for Optimizely Forms, enabling you to model, fetch, and render forms in your headless applications.

> [!IMPORTANT]
> Forms support requires that Optimizely Forms is enabled in your CMS instance. Log in to the CMS, navigate to **Settings > Forms Settings**, and click **Activate**.

## Contents

- [Quick Start](#quick-start) - Get running in 5 minutes
- [Form Validation](#form-validation) - Using `useFormField` hook
- [Form Dependency Rules](#form-dependency-rules) - Conditional field visibility
- [Multi-Step Forms](#multi-step-forms) - Step-by-step forms
- [Advanced Topics](#advanced-topics) - API reference and advanced usage
- [Troubleshooting](#troubleshooting) - Common issues

## Quick Start

### 1. Set up form components

Register your form components with the SDK so the CMS can render them:

```tsx
// src/app/layout.tsx
import { initForms } from '@optimizely/cms-sdk/react/server';
import FormContainer from '@/components/forms/FormContainer';
import FormInput from '@/components/forms/FormInput';
import FormSubmit from '@/components/forms/FormSubmit';

initForms({
  container: FormContainer,
  textbox: FormInput,
  submit: FormSubmit,
});
```

### 2. Create FormContainer component

The FormContainer is the root component that wraps all form content. It uses `FormStatusProvider` to manage submission state, and `FormWrapper` to orchestrate validation and submission:

```tsx
// src/components/forms/FormContainer.tsx
import { OptiFormsContainerContentType } from '@optimizely/cms-sdk';
import { getPreviewUtils, OptimizelyGridSection } from '@optimizely/cms-sdk/react/server';
import { FormStatusProvider, FormWrapper } from '@optimizely/cms-sdk/forms/react';
import FormAlerts from './FormAlerts';
import GridRow from './GridRow';
import GridColumn from './GridColumn';

export default function FormContainer({ content }: { content: OptiFormsContainerContentType }) {
  const { pa } = getPreviewUtils(content);
  const nodes = content.nodes ?? [];

  return (
    <FormStatusProvider>
      <div className="max-w-7xl py-6 space-y-6">
        {content.Title && <h2>{content.Title}</h2>}
        {content.Description && <p>{content.Description}</p>}
        
        <FormAlerts submitConfirmationMessage={content.SubmitConfirmationMessage} />

        <FormWrapper
          scrollToOnSuccess="form-alert"
          scrollToOnError={false}
          action={content.SubmitUrl?.default ?? ''}
          rules={content.DependencyRules}
        >
          <OptimizelyGridSection nodes={nodes} row={GridRow} column={GridColumn} />
        </FormWrapper>
      </div>
    </FormStatusProvider>
  );
}
```

### 3. Create field components

Field components render individual form inputs with validation and error display. Use the `useFormField` hook to handle state, validation, and rules tracking automatically:

```tsx
// src/components/forms/FormInput.tsx
'use client';

import { useFormField } from '@optimizely/cms-sdk/forms/react';
import { getHtmlValidationAttributes } from '@optimizely/cms-sdk/forms/validation';

export default function FormInput({ content }) {
  const { value, setValue, inputRef, errors, showErrors, isRequired } = useFormField({
    name: content.SubmissionFieldName || content.Label,
    validators: content.Validators,
    content,
  });

  return (
    <div>
      <label>
        {content.Label}
        {isRequired && <span className="text-red-600">*</span>}
      </label>
      <input
        ref={inputRef}
        name={content.SubmissionFieldName || content.Label}
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={content.Placeholder}
        {...getHtmlValidationAttributes(content.Validators)}
      />
      {showErrors && <div className="text-red-600">{errors.map(e => <p key={e}>{e}</p>)}</div>}
    </div>
  );
}
```

### 4. Create alerts component

The alerts component shows success or error messages based on form submission state:

```tsx
// src/components/forms/FormAlerts.tsx
'use client';

import { useFormStatus } from '@optimizely/cms-sdk/forms/react';

export default function FormAlerts({ submitConfirmationMessage }) {
  const { formSuccess, formError } = useFormStatus();
  if (!formSuccess && !formError) return null;

  return (
    <>
      {formSuccess && (
        <div className="bg-green-100 text-green-800 p-4 rounded">
          {submitConfirmationMessage || 'Thank you! Your form has been submitted.'}
        </div>
      )}
      {formError && (
        <div className="bg-red-100 text-red-800 p-4 rounded">
          Sorry, there was an error. Please try again.
        </div>
      )}
    </>
  );
}
```

### 5. Add forms in the CMS

1. Create a shared block of type **Form Container**
2. Configure title, description, and submission URL
3. Add form fields to the container
4. (optional) Set up validation rules and dependency rules
5. Add the Form Container block to any page

That's it! Forms now render and validate automatically.

---

## Form Validation

The `useFormField` hook handles validation, error tracking, and field registration automatically:

```tsx
'use client';

import { useFormField } from '@optimizely/cms-sdk/forms/react';
import { getHtmlValidationAttributes } from '@optimizely/cms-sdk/forms/validation';

function EmailField({ content }) {
  const { value, setValue, inputRef, errors, showErrors, isRequired } = useFormField({
    name: content.SubmissionFieldName || content.Label,
    validators: content.Validators,
    content,  // Auto-tracks for dependency rules
  });

  return (
    <div>
      <label>
        {content.Label}
        {isRequired && <span>*</span>}
      </label>
      <input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        {...getHtmlValidationAttributes(content.Validators)}
      />
      {showErrors && <div>{errors.map(e => <p key={e}>{e}</p>)}</div>}
    </div>
  );
}
```

### Supported Validators

- `requirevalidator` - Field is required
- `emailvalidator` - Valid email format
- `integervalidator` - Integer (with negatives)
- `positiveintegervalidator` - Positive integers only
- `decimalvalidator` - Decimal numbers
- `urlvalidator` - Valid URL
- `regularexpressionvalidator` - Custom regex pattern

### Validation Patterns

Reuse the SDK's built-in validation patterns:

```ts
import { VALIDATION_PATTERNS } from '@optimizely/cms-sdk/forms/validation';

// Available: email, integer, positiveInteger, decimal
if (VALIDATION_PATTERNS.email.test(value)) {
  // Valid email
}
```

---

## Form Dependency Rules

Show/hide fields based on other field values:

```tsx
'use client';

import { FormWrapper, FormElement } from '@optimizely/cms-sdk/forms/react';

export default function MyForm({ content }) {
  return (
    <FormWrapper
      action="/api/forms/submit"
      rules={content.DependencyRules}
    >
      <FormContainer content={content} />
    </FormWrapper>
  );
}
```

Wrap fields with `FormElement` to enable conditional rendering. Your field components should pass `content` to `useFormField` to automatically track values for rule evaluation:

```tsx
export default function MyInput({ content }) {
  return (
    <FormElement content={content}>
      <FormInput content={content} />
    </FormElement>
  );
}
```

Inside FormInput, the hook automatically tracks field values:

```tsx
export default function FormInput({ content }) {
  const { value, setValue, inputRef, errors, showErrors } = useFormField({
    name: content.SubmissionFieldName || content.Label,
    validators: content.Validators,
    content,  // Automatically tracks for rule evaluation
  });
  // ...
}
```

No manual `setFieldValue()` calls needed—the hook handles it all.

### Rule Conditions

Supported conditions: `Equals`, `NotEquals`, `Contains`, `NotContains`

Supported operators: `All` (AND), `Any` (OR)

---

## Multi-Step Forms

Use `FormStep` to conditionally render steps:

```tsx
'use client';

import { FormWrapper, FormStep } from '@optimizely/cms-sdk/forms/react';

export default function MultiStepForm({ stepNodes }) {
  return (
    <FormWrapper action="/api/forms/submit" steps={stepNodes}>
      {stepNodes.map((step, i) => (
        <FormStep key={i} index={i}>
          <div className="mb-8">
            <h2>Step {i + 1}</h2>
            <OptimizelyGridSection nodes={[step]} row={GridRow} column={GridColumn} />
          </div>
        </FormStep>
      ))}
    </FormWrapper>
  );
}
```

All fields validate across steps before submission (fields remain in DOM while hidden).

---

## Advanced Topics

### Available Content Types

```ts
import { FormContentTypes } from '@optimizely/cms-sdk';

// Includes:
// - OptiFormsContainerDataContentType
// - OptiFormsTextboxElementContentType
// - OptiFormsTextareaElementContentType
// - OptiFormsNumberElementContentType
// - OptiFormsRangeElementContentType
// - OptiFormsUrlElementContentType
// - OptiFormsChoiceElementContentType
// - OptiFormsSelectionElementContentType
// - OptiFormsSubmitElementContentType
// - OptiFormsResetElementContentType
// - OptiFormsDependencyRuleContentType
// - OptiFormsConditionContentType
```

### Using Forms in Content Models

```ts
import { contentType } from '@optimizely/cms-sdk';
import { OptiFormsContainerDataContentType } from '@optimizely/cms-sdk';

export const PageWithFormContentType = contentType({
  key: 'PageWithForm',
  baseType: '_page',
  properties: {
    title: { type: 'string', displayName: 'Page Title' },
    form: {
      type: 'component',
      displayName: 'Contact Form',
      contentType: OptiFormsContainerDataContentType,
    },
  },
});
```

### FormWrapper Props

```tsx
<FormWrapper
  action="/api/submit"                    // Required: submission endpoint
  scrollToOnSuccess="element-id"          // Optional: scroll on success
  scrollToOnError="element-id"            // Optional: scroll on error
  steps={stepNodes}                       // Optional: multi-step form nodes
  rules={dependencyRules}                 // Optional: visibility rules
>
  {children}
</FormWrapper>
```

### useFormField API

```ts
const {
  value,        // Current input value
  setValue,     // Update value
  inputRef,     // Attach to input element
  errors,       // Array of error messages
  showErrors,   // Boolean: show errors on attempted submit
  hasErrors,    // Boolean: field has validation errors
  isRequired,   // Boolean: field is required
} = useFormField({
  name: 'fieldName',
  validators: fieldContent.Validators,
  content: fieldContent,  // Optional: auto-track for rules
  defaultValue: '',       // Optional: initial value
});
```

### Validation Utilities

```ts
import {
  validateField,              // Validate value against validators
  getErrorMessages,           // Extract error messages
  isFieldRequired,            // Check if field is required
  getHtmlValidationAttributes, // Generate HTML5 attributes
  extractErrorMessage,        // Get single validator message
  extractValidatorType,       // Get normalized validator type
  getFieldName,              // Get field display name
  VALIDATION_PATTERNS,       // Regex patterns: email, integer, etc.
} from '@optimizely/cms-sdk/forms/validation';
```

### Advanced: Custom Rule Evaluation

```ts
import { useFormRules } from '@optimizely/cms-sdk/forms/react';

const { rules, fieldValues, setFieldValue, isElementVisible } = useFormRules();

// Check if element should be visible
const visible = isElementVisible(elementId);
```

### Component Setup Options

```tsx
// Simple setup (recommended)
initForms({
  container: FormContainer,
  textbox: FormInput,
  submit: FormSubmit,
});

// With tagged variants
initForms({
  container: {
    default: DefaultContainer,
    tags: { compact: CompactContainer },
  },
});

// Manual setup for complete control
import { initContentTypeRegistry, initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';

initContentTypeRegistry(FormContentTypes);
initReactComponentRegistry({
  resolver: {
    OptiFormsContainerData: FormContainer,
    OptiFormsTextboxElement: FormInput,
    // ...
  },
});
```

---

## Troubleshooting

### Validation isn't working

1. Ensure `FormWrapper` wraps your form (provides `FormValidationProvider`)
2. Check that `useFormField` uses the correct `validators` prop
3. Verify field names match between content and components

### Rules aren't evaluating

1. Ensure `FormWrapper` receives the `rules` prop
2. Pass `content` to `useFormField` to auto-track values
3. Verify element IDs are correct with `getElementId(content)`

### Fields not showing

1. Verify `initForms()` was called with all components
2. Check content types are registered correctly
3. Ensure components are marked `'use client'`
4. Check browser console for resolution errors

### Form won't submit

1. Verify `action` prop points to valid API endpoint
2. Check fields pass validation (no error messages)
3. Ensure form component is `'use client'`
4. Check network tab for POST request failures

---

## API Reference

### Core Exports

**From `@optimizely/cms-sdk/forms/react`:**

- `FormWrapper` - Main form orchestrator
- `useFormField` - Field setup hook (recommended for most fields)
- `FormValidationProvider` / `useFormValidation` - Manual validation control
- `FormStatusProvider` / `useFormStatus` - Submission state
- `FormRulesProvider` / `useFormRules` - Rule evaluation
- `FormElement` - Conditional field visibility wrapper
- `FormStep` - Multi-step conditional renderer
- `useFormStep` - Step navigation hook
- `getElementId` - Extract element ID from content

**From `@optimizely/cms-sdk/forms/validation`:**

- `validateField` - Validate against validators
- `getErrorMessages` - Extract error array
- `isFieldRequired` - Check required status
- `getHtmlValidationAttributes` - Generate HTML5 attrs
- `extractErrorMessage` - Get validator message
- `extractValidatorType` - Normalize validator type
- `getFieldName` - Get display name
- `VALIDATION_PATTERNS` - Reusable regex patterns

**From `@optimizely/cms-sdk`:**

- `FormContentTypes` - All form content type definitions
- `OptiFormsContainerDataContentType` - Form container type
- Individual field types (textbox, textarea, etc.)
