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
import { initForms } from '@optimizely/cms-sdk/react/server';
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
import { initReactComponentRegistry, FORM_HANDLER_TO_CONTENT_TYPE } from '@optimizely/cms-sdk/react/server';
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

## Client-Side Form Validation

The SDK provides built-in client-side validation utilities that understand Optimizely Forms validation rules from the CMS. This enables real-time validation feedback without server round-trips.

**Quick Start:** For most use cases, use the `useFormField` hook which handles validation, error tracking, and field registration automatically. See the [Using `useFormField` Hook (Simplified)](#using-useformfield-hook-simplified) section for a minimal example.

### Validation Utilities

The SDK exports validation functions that work with validator data from the CMS:

```ts
import {
  validateField,
  getErrorMessages,
  isFieldRequired,
  getHtmlValidationAttributes,
  extractErrorMessage,
  extractValidatorType,
  getFieldName,
  type ValidatorType,
  type Validator,
} from '@optimizely/cms-sdk/forms/validation';
```

#### `validateField(value, validators)`

Validates a field value against an array of validators from the CMS.

```ts
import { validateField, extractErrorMessage } from '@optimizely/cms-sdk/forms/validation';

const validators = fieldContent.Validators; // From CMS
const value = inputElement.value;
const errors = validateField(value, validators);

if (errors.length > 0) {
  // Field has validation errors
  errors.forEach(({ validator, isValid }) => {
    if (!isValid) {
      console.log(extractErrorMessage(validator)); // Show error message
    }
  });
}
```

#### Supported Validator Types

The SDK supports all Optimizely Forms validator types:

- **`requirevalidator`** - Field is required (non-empty)
- **`emailvalidator`** - Valid email format
- **`integervalidator`** - Integer value (negative allowed)
- **`positiveintegervalidator`** - Positive integer only
- **`decimalvalidator`** - Decimal number format
- **`urlvalidator`** - Valid URL format
- **`regularexpressionvalidator`** - Matches regex pattern from CMS

#### Helper Functions

**`getErrorMessages(errors)`** - Extract all error messages from validation results:

```ts
const errors = validateField(value, validators);
const messages = getErrorMessages(errors);
// ["Email is invalid", "This field is required"]
```

**`isFieldRequired(validators)`** - Check if a field has a require validator:

```ts
const required = isFieldRequired(validators);
// true if field must be filled
```

**`getHtmlValidationAttributes(validators)`** - Generate HTML5 validation attributes:

```ts
const attrs = getHtmlValidationAttributes(validators);
// { required: true, type: 'email', pattern: '...' }

<input {...attrs} />
```

**`extractErrorMessage(validator)`** - Get error message from a single validator:

```ts
const message = extractErrorMessage(validator);
// "Please enter a valid email address"
```

**`extractValidatorType(validator)`** - Get normalized validator type:

```ts
const validatorType = extractValidatorType(validator);
// 'emailvalidator' (normalized to lowercase)
```

**`getFieldName(field)`** - Get display name for a field:

```ts
const name = getFieldName(field);
// 'email_field' or 'Email' (prefers submission name)
```

## Form Components and Hooks

The SDK provides ready-to-use components for managing form state and validation:

### `FormWrapper`

Orchestrates form submission with built-in validation. Handles client-side validation, prevents submission of invalid forms, and provides scroll behavior.

```tsx
'use client';

import { FormWrapper } from '@optimizely/cms-sdk/forms/react';
import FormInput from './FormInput';
import FormSubmit from './FormSubmit';

export default function MyForm() {
  return (
    <FormWrapper
      action="/api/forms/submit"
      scrollToOnSuccess="success-message"
      scrollToOnError="error-message"
    >
      <FormInput name="email" />
      <FormSubmit />
    </FormWrapper>
  );
}
```

**Props:**

- **`action`** - Form submission endpoint URL
- **`scrollToOnSuccess`** - Element ID to scroll to on successful submission (or `false` to disable)
- **`scrollToOnError`** - Element ID to scroll to on validation error (or `false` to disable)

### `FormValidationProvider` & `useFormValidation`

Manages field registration, validation state, and error tracking. Use `useFormValidation` in field components to register with the validation system.

```tsx
'use client';

import { useFormValidation } from '@optimizely/cms-sdk/forms/react';
import { validateField } from '@optimizely/cms-sdk/forms/validation';
import { useEffect, useRef, useState } from 'react';

function FormInput({ name, validators }) {
  const [value, setValue] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { registerField, unregisterField, setFieldError, attemptedSubmit } = useFormValidation();

  useEffect(() => {
    const errors = validateField(value, validators);
    const hasErrors = errors.length > 0;
    
    setFieldError(name, hasErrors);
    setShowErrors((attemptedSubmit || false) && hasErrors);

    const validate = () => !hasErrors;
    registerField(name, inputRef.current, validate);

    return () => unregisterField(name);
  }, [value, validators, name, registerField, unregisterField, setFieldError, attemptedSubmit]);

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={e => setValue(e.target.value)}
      // ...
    />
  );
}
```

### `FormStatusProvider` & `useFormStatus`

Manages form submission state (submitting, success, error). Use in components that need to respond to submission status.

```tsx
'use client';

import { useFormStatus } from '@optimizely/cms-sdk/forms/react';

function FormSubmit() {
  const { isSubmitting } = useFormStatus();

  return (
    <button disabled={isSubmitting}>
      {isSubmitting ? 'Submitting...' : 'Submit'}
    </button>
  );
}

function FormAlerts() {
  const { formSuccess, formError } = useFormStatus();

  return (
    <>
      {formSuccess && <div className="alert-success">Form submitted!</div>}
      {formError && <div className="alert-error">Submission failed</div>}
    </>
  );
}
```

## Complete Example

A minimal form with validation, submission, and user feedback:

```tsx
'use client';

import { FormWrapper, useFormValidation, useFormStatus } from '@optimizely/cms-sdk/forms/react';
import { validateField, getErrorMessages } from '@optimizely/cms-sdk/forms/validation';
import { useState, useRef, useEffect } from 'react';

// Field component with real-time validation
function TextField({ name, label, validators }) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { registerField, unregisterField, setFieldError, attemptedSubmit } = useFormValidation();
  
  const errors = validateField(value, validators);
  const showErrors = (attemptedSubmit || false) && errors.length > 0;

  useEffect(() => {
    const validate = () => errors.length === 0;
    registerField(name, inputRef.current, validate);
    setFieldError(name, !validate());
    return () => unregisterField(name);
  }, [errors, name, registerField, unregisterField, setFieldError, attemptedSubmit]);

  return (
    <div>
      <label>{label}</label>
      <input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        name={name}
      />
      {showErrors && (
        <div className="error">
          {getErrorMessages(errors).map(msg => (
            <p key={msg}>{msg}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// Submit button with loading state
function SubmitButton() {
  const { isSubmitting } = useFormStatus();
  return (
    <button disabled={isSubmitting} type="submit">
      {isSubmitting ? 'Submitting...' : 'Submit'}
    </button>
  );
}

// Success/error alerts
function FormAlerts() {
  const { formSuccess, formError } = useFormStatus();
  return (
    <div id="form-alerts">
      {formSuccess && (
        <div style={{ color: 'green' }}>
          Thank you! Your form has been submitted.
        </div>
      )}
      {formError && (
        <div style={{ color: 'red' }}>
          Sorry, there was an error submitting your form. Please try again.
        </div>
      )}
    </div>
  );
}

// Main form component
export default function ContactForm({ form }) {
  return (
    <div>
      <FormWrapper action="/api/forms/submit" scrollToOnSuccess="form-alerts">
        <TextField
          name="email"
          label="Email"
          validators={form.email?.Validators}
        />
        <TextField
          name="message"
          label="Message"
          validators={form.message?.Validators}
        />
        <SubmitButton />
      </FormWrapper>
      <FormAlerts />
    </div>
  );
}
```

## Using `useFormField` Hook (Simplified)

The `useFormField` hook encapsulates all common field setup logic and is the recommended approach for most form fields. It handles validation, error tracking, registration, and provides all necessary props.

```tsx
'use client';

import { FormWrapper, useFormField } from '@optimizely/cms-sdk/forms/react';
import { getHtmlValidationAttributes } from '@optimizely/cms-sdk/forms/validation';

// Minimal field component
function EmailField({ validators, label }) {
  const { value, setValue, inputRef, errors, showErrors, isRequired } = useFormField({
    name: 'email',
    validators,
  });

  return (
    <div>
      <label>
        {label}
        {isRequired && <span className="text-red-600">*</span>}
      </label>
      <input
        ref={inputRef}
        type="email"
        name="email"
        value={value}
        onChange={e => setValue(e.target.value)}
        {...getHtmlValidationAttributes(validators)}
      />
      {showErrors && (
        <div className="text-red-600">
          {errors.map(err => <p key={err}>{err}</p>)}
        </div>
      )}
    </div>
  );
}

// Usage
export default function SimpleForm({ form }) {
  return (
    <FormWrapper action="/api/submit" scrollToOnSuccess="alerts">
      <EmailField 
        validators={form.email?.Validators} 
        label="Email"
      />
      <button type="submit">Submit</button>
      <div id="alerts">Success or error messages here</div>
    </FormWrapper>
  );
}
```

### `useFormField` Hook API

Returns an object with all field state and handlers:

```ts
const {
  value,           // Current input value
  setValue,        // Update input value
  inputRef,        // Ref to attach to input element
  errors,          // Array of error messages
  showErrors,      // Boolean: show errors if touched or attempted submit
  hasErrors,       // Boolean: field has validation errors
  isRequired,      // Boolean: field has a require validator
} = useFormField({
  name: 'fieldName',
  validators: fieldContent.Validators,
  defaultValue: '' // optional
});
```

This hook eliminates the need to manually:

- Call `validateField()`, `getErrorMessages()`, etc.
- Register/unregister with the validation context
- Track touched/attempted submit state
- Manage error display logic

Perfect for building reusable, type-safe form field components.

## Multi-Step Forms

The SDK provides built-in support for multi-step forms through the `FormWrapper` component's `steps` prop and the `useFormStep` hook.

### How It Works

1. **Define steps** - Define multiple form steps in the CMS
2. **Track visibility** - Use `FormStepContainer` to conditionally render each step
3. **Navigate between steps** - Use the `useFormStep` hook to access `nextStep` and `prevStep` functions

### Step Navigation

Each field component automatically works with the step system:

```tsx
'use client';

import { useFormStep } from '@optimizely/cms-sdk/forms/react';

function NavigationButton({ label }) {
  const { nextStep, prevStep, currentStepIndex } = useFormStep();
  
  if (label?.toLowerCase() === 'next') {
    return <button onClick={nextStep}>Next</button>;
  }
  
  if (label?.toLowerCase() === 'previous') {
    return <button onClick={prevStep}>Previous</button>;
  }
  
  return <button type="submit">{label || 'Submit'}</button>;
}
```

### Key Components

**`useFormStep()`** - Access step state and navigation:

```ts
const { 
  currentStepIndex,  // Current step (0-based)
  nextStep,          // Function: move to next step
  prevStep,          // Function: move to previous step
} = useFormStep();
```

**`FormStepContainer`** - Wrap a step's content to control visibility:

```tsx
<FormStepContainer index={0}>
  <YourFormFieldsHere />
</FormStepContainer>
<FormStepContainer index={1}>
  <MoreFormFieldsHere />
</FormStepContainer>
```

**`FormStepTracker`** - Show visual progress indicator:

```tsx
<FormStepTracker steps={3} />
```

### Example: Multi-Step Contact Form

```tsx
'use client';

import {
  FormWrapper,
  FormStepContainer,
  FormStepTracker,
} from '@optimizely/cms-sdk/forms/react';
import FormInput from './FormInput';
import FormTextarea from './FormTextarea';
import FormSubmit from './FormSubmit';

export default function MultiStepForm({ stepNodes, buttonNodes }) {
  return (
    <FormWrapper
      action="/api/forms/submit"
      steps={stepNodes}
      scrollToOnSuccess="success-alert"
    >
      <FormStepTracker steps={stepNodes.length} />
      
      {stepNodes.map((step, index) => (
        <FormStepContainer key={index} index={index}>
          <OptimizelyGridSection nodes={[step]} row={GridRow} column={GridColumn} />
        </FormStepContainer>
      ))}
      
      <div className='mt-8 flex items-center gap-4'>
        <OptimizelyGridSection nodes={buttonNodes} row={GridRow} column={GridColumn} />
      </div>
    </FormWrapper>
  );
}
```

### Validation Across Steps

All fields remain in the DOM when hidden (using CSS `display: none`), so validation runs on all steps before submission. This ensures that when users navigate back or submit, they can't bypass validation on earlier steps.

## Form Dependency Rules

Form dependency rules enable conditional visibility of fields based on the values of other fields. You can configure rules in the CMS to show or hide form elements dynamically based on user input.

### Overview

Dependency rules are defined in the CMS and passed to the form through the `rules` prop of `FormWrapper`. The SDK evaluates these rules in real-time as users fill out the form, automatically showing or hiding fields based on their conditions.

### Setting Up Rules

Pass dependency rules to `FormWrapper` via the `rules` prop:

```tsx
'use client';

import { FormWrapper } from '@optimizely/cms-sdk/forms/react';
import FormContainer from './FormContainer';

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

### Using `FormElement` Wrapper

Wrap form field components with `FormElement` to enable conditional rendering based on rules. The wrapper automatically handles visibility logic:

```tsx
'use client';

import { FormElement } from '@optimizely/cms-sdk/forms/react';
import FormInput from './FormInput';

export default function MyInput({ content }) {
  return (
    <FormElement content={content}>
      <FormInput content={content} />
    </FormElement>
  );
}
```

The `FormElement` wrapper:

- Extracts the field's unique ID from the content
- Checks if the field should be visible based on dependency rules
- Returns `null` (hiding the field) if visibility conditions aren't met
- Renders children if the field should be visible

### Tracking Field Values for Rules

For rules to evaluate conditions, field components must track their values. Use the `useFormRules` hook in field components to register value changes:

```tsx
'use client';

import { useFormRules } from '@optimizely/cms-sdk/forms/react';
import { getElementId } from '@optimizely/cms-sdk/forms/react';
import { useEffect, useState } from 'react';

function FormSelectionField({ content }) {
  const [value, setValue] = useState('');
  const { setFieldValue } = useFormRules();
  const elementId = getElementId(content);

  useEffect(() => {
    if (elementId) {
      setFieldValue(elementId, value);
    }
  }, [value, elementId, setFieldValue]);

  return (
    <select value={value} onChange={e => setValue(e.target.value)}>
      {/* options */}
    </select>
  );
}
```

### Rule Conditions

The CMS supports several condition types for evaluating field visibility:

- **Equals** - Field value matches a specific value
- **NotEquals** - Field value does not match a specific value
- **Contains** - Field value contains a substring
- **NotContains** - Field value does not contain a substring

### Rule Operators

Rules can combine multiple conditions using:

- **All** - All conditions must be true for the field to be visible
- **Any** - At least one condition must be true for the field to be visible

### Example: Conditional Visibility

Suppose you have a form where a "Specify Other" text field only appears when a user selects "Other" from a choice field:

1. **In the CMS:**
   - Create a choice field with options (Standard, Premium, Other)
   - Create a text field for "Please specify"
   - Add a dependency rule: Show "Please specify" when choice field = "Other"

2. **In your component:**

```tsx
'use client';

import { FormElement, useFormRules } from '@optimizely/cms-sdk/forms/react';
import { useEffect, useState } from 'react';

function ServiceChoice({ content }) {
  const [value, setValue] = useState('');
  const { setFieldValue } = useFormRules();
  const elementId = getElementId(content);

  useEffect(() => {
    if (elementId) {
      setFieldValue(elementId, value);
    }
  }, [value, elementId, setFieldValue]);

  return (
    <div>
      <label>{content.Label}</label>
      <select value={value} onChange={e => setValue(e.target.value)}>
        <option value="">Select...</option>
        <option value="Standard">Standard Service</option>
        <option value="Premium">Premium Service</option>
        <option value="Other">Other</option>
      </select>
    </div>
  );
}

function SpecifyOtherField({ content }) {
  // This field will automatically hide/show based on the rule
  return (
    <FormElement content={content}>
      <FormInput content={content} />
    </FormElement>
  );
}

export default function ServiceForm({ content }) {
  return (
    <FormWrapper action="/api/forms/submit" rules={content.DependencyRules}>
      <ServiceChoice content={content.serviceType} />
      <SpecifyOtherField content={content.specifyOther} />
      <button type="submit">Submit</button>
    </FormWrapper>
  );
}
```

### Advanced: Custom `useFormRules` Usage

For more control over rule evaluation, use the `useFormRules` hook directly:

```ts
const { 
  rules,              // The configured dependency rules
  fieldValues,        // Map of field IDs to their current values
  setFieldValue,      // Function to update a field's value
  isElementVisible,   // Function to check if an element should be visible
} = useFormRules();

// Check if a specific element is visible
const shouldShowField = isElementVisible(elementId);
```

This allows you to build custom conditional rendering logic beyond the standard `FormElement` wrapper.
