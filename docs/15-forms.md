# Working with Optimizely Forms

The Optimizely CMS JavaScript SDK includes built-in support for Optimizely Forms, enabling you to model, fetch, and render forms in your headless applications.

> [!IMPORTANT]
> Forms support requires that Optimizely Forms is enabled in your CMS instance. Log in to the CMS, navigate to **Settings > Forms Settings**, and click **Activate**. The SDK detects this automatically — there is no configuration flag.

> [!WARNING]
> **The SDK does not submit form entries to Optimizely.** `FormWrapper` POSTs the form's `FormData` to whatever URL the editor put in the container's **Submit URL** field, and treats any `response.ok` as success. You are responsible for the endpoint that receives it and for storing or forwarding the data. The route in the Alloy template only logs the submission.

## Contents

- [Quick Start](#quick-start) - Get running in 5 minutes
- [Form Validation](#form-validation) - Using `useFormField` hook
- [Form Dependency Rules](#form-dependency-rules) - Conditional field visibility
- [Multi-Step Forms](#multi-step-forms) - Step-by-step forms
- [Editing in the CMS](#editing-in-the-cms) - Preview attributes and edit-mode behaviour
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

The FormContainer is the root component that wraps all form content. It uses `FormSubmissionProvider` to manage submission state, and `FormWrapper` to orchestrate validation and submission:

```tsx
// src/components/forms/FormContainer.tsx
import { OptiFormsContainerContentType } from '@optimizely/cms-sdk';
import { OptimizelyGridSection } from '@optimizely/cms-sdk/react/server';
import {
  FormSubmissionProvider,
  FormStep,
  FormWrapper,
  isFormButtonNode,
  partitionFormNodes,
} from '@optimizely/cms-sdk/forms/react';
import FormAlerts from './FormAlerts';
import GridRow from './GridRow';
import GridColumn from './GridColumn';

export default function FormContainer({ content }: { content: OptiFormsContainerContentType }) {
  const nodes = content.nodes ?? [];
  const stepNodes = nodes.filter(node => !isFormButtonNode(node));

  return (
    <FormSubmissionProvider>
      <div id="form-alert" className="max-w-2xl space-y-5">
        {content.Title && <h2>{content.Title}</h2>}
        {content.Description && <p>{content.Description}</p>}

        <FormAlerts submitConfirmationMessage={content.SubmitConfirmationMessage} />

        <FormWrapper
          scrollToOnSuccess="form-alert"
          scrollToOnError={false}
          action={content.SubmitUrl?.default ?? ''}
          steps={stepNodes}
          rules={content.DependencyRules}
        >
          {stepNodes.map((node, index) => {
            // Editors place Next, Previous and Submit wherever they like, often
            // each in its own row. Lifting them out lets you lay them out as one
            // footer regardless of how the form was authored.
            const step = partitionFormNodes([node]);

            return (
              // `node` makes the step selectable in the CMS editor.
              <FormStep key={node.key} index={index} node={node}>
                <OptimizelyGridSection nodes={step.content} row={GridRow} column={GridColumn} />
                {step.buttons.length > 0 && (
                  <div className="mt-6 flex items-center justify-end gap-3">
                    <OptimizelyGridSection nodes={step.buttons} row={GridRow} column={GridColumn} />
                  </div>
                )}
              </FormStep>
            );
          })}
        </FormWrapper>
      </div>
    </FormSubmissionProvider>
  );
}
```

### 3. Create field components

Field components render individual form inputs with validation and error display. Pass the element's `content` to `useFormField` and it derives the field name, validators and initial value for you, and hands back the props to spread:

```tsx
// src/components/forms/FormInput.tsx
'use client';

import { FormElement, useFormField } from '@optimizely/cms-sdk/forms/react';
import {
  getHtmlValidationAttributes,
  toValidators,
} from '@optimizely/cms-sdk/forms/validation';

export default function FormInput({ content }) {
  const { fieldProps, errorProps, errors, showErrors, isRequired } = useFormField({
    content,
  });

  const htmlAttrs = getHtmlValidationAttributes(toValidators(content.Validators));

  return (
    // Hides the field while a dependency rule turns it off.
    <FormElement content={content}>
      <div>
        <label htmlFor={fieldProps.id}>
          {content.Label}
          {isRequired && <span className="text-red-600">*</span>}
        </label>
        <input
          {...fieldProps}
          type={(htmlAttrs.type as string) ?? 'text'}
          placeholder={content.Placeholder ?? ''}
        />
        {showErrors && (
          <div {...errorProps} className="text-red-600">
            {errors.map(e => <p key={e}>{e}</p>)}
          </div>
        )}
      </div>
    </FormElement>
  );
}
```

`fieldProps` carries the ref, `id`, `name`, `value`, `required`, `aria-invalid`, `aria-describedby`, `onChange` and `onBlur`. `errorProps` carries the matching `id` and `role="alert"`. Spreading both keeps the accessibility wiring consistent across every field type.

To let editors click a label or placeholder and edit it in the CMS, add preview attributes — see [Editing in the CMS](#editing-in-the-cms). The footer above aligns its buttons with `justify-end`, which is deliberate: aligning them individually with `ml-auto` works for a visitor but not in edit mode, for the reason explained in the same section.

For a control that cannot take those directly — a radio group, where the name and change handler belong on each radio and the ref on the fieldset — use `inputRef`, `value`, `setValue`, `onBlur` and `errorId` instead.

### 4. Create alerts component

The alerts component shows success or error messages based on form submission state:

```tsx
// src/components/forms/FormAlerts.tsx
'use client';

import { useFormSubmission } from '@optimizely/cms-sdk/forms/react';

export default function FormAlerts({ submitConfirmationMessage }) {
  const { formSuccess, formError } = useFormSubmission();
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
import {
  getHtmlValidationAttributes,
  toValidators,
} from '@optimizely/cms-sdk/forms/validation';

function EmailField({ content }) {
  // Name, validators and initial value all come from `content`.
  const { fieldProps, errorProps, errors, showErrors, isRequired } = useFormField({
    content,
  });

  return (
    <div>
      <label htmlFor={fieldProps.id}>
        {content.Label}
        {isRequired && <span>*</span>}
      </label>
      <input {...fieldProps} {...getHtmlValidationAttributes(toValidators(content.Validators))} />
      {showErrors && <div {...errorProps}>{errors.map(e => <p key={e}>{e}</p>)}</div>}
    </div>
  );
}
```

Errors appear once the field has been blurred or the form has been submitted, so a visitor is not told a field is invalid before they have had a chance to fill it in.

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

Show and hide fields based on other fields' values. Rules come from the container and are passed to `FormWrapper` once, as shown in the Quick Start:

```tsx
<FormWrapper action={...} rules={content.DependencyRules}>
```

Each field component then needs two things:

1. Wrap its markup in `FormElement`, which renders nothing for a visitor while a rule hides the field.
2. Pass `content` to `useFormField`, which reports the field's value so rules that depend on it can be evaluated. No manual `setFieldValue()` calls are needed.

```tsx
export default function FormInput({ content }) {
  const { fieldProps } = useFormField({ content });

  return (
    <FormElement content={content}>
      <input {...fieldProps} />
    </FormElement>
  );
}
```

> [!IMPORTANT]
> `FormElement` must wrap the markup **inside** the field component, not the component itself. A field hidden by a rule is excluded from validation, and `useFormField` can only do that from inside the component. Wrapping from the outside would leave a hidden required field registered, blocking submission with no visible error.

A hidden field is rendered anyway while editing in the CMS. A rule describes what a visitor sees, and an editor still has to be able to find the field to change it — otherwise the CMS shows an empty, selectable block with no indication of what it is.

### Rule Conditions

Supported conditions: `Equals`, `NotEquals`, `Contains`, `NotContains`

Supported operators: `All` (AND), `Any` (OR)

---

## Multi-Step Forms

Use `FormStep` to render one step at a time, as shown in the Quick Start container. Inactive steps stay mounted behind `display: none`, so values survive stepping back and forth and submitting validates every step, not just the visible one.

Advancing validates only the current step. Submitting validates all of them, and jumps to the step holding the first invalid field so the visitor can see what is blocking them.

### Step buttons

Optimizely Forms has no property marking a button as step navigation: Next, Previous and Submit are all the same element type, distinguished **only by their label**. `useFormButton` resolves the role and wires it up:

```tsx
'use client';

import { useFormButton } from '@optimizely/cms-sdk/forms/react';

export default function FormSubmit({ content }) {
  const { role, label, isSubmitting, buttonProps } = useFormButton(content);

  return (
    <button {...buttonProps} className={role === 'previous' ? 'secondary' : 'primary'}>
      {isSubmitting ? 'Submitting…' : label}
    </button>
  );
}
```

`role` is `'next'`, `'previous'` or `'submit'`. `buttonProps` sets the right `type`, the click handler, `disabled` while the request is in flight, and the tooltip.

> [!IMPORTANT]
> Label your CMS buttons exactly **Next** and **Previous** (matching ignores case and surrounding spaces). Any other label is treated as a submit button, so a step button would submit the half-filled form instead of navigating. For a form authored in another language, pass your own labels:
>
> ```tsx
> useFormButton(content, { labels: { next: ['nästa'], previous: ['tillbaka'] } });
> ```

### After a successful submit

The fields are cleared and the form returns to the first step. Because the inputs are controlled by `useFormField`, this is driven by the SDK rather than by `form.reset()`, which only clears uncontrolled inputs.

---

## Editing in the CMS

### Selecting a block

Every component the SDK renders is wrapped in a `data-epi-block-id` marker while in edit mode, so form elements, rows and columns are selectable without you doing anything. Pass the step's node to `FormStep` to make the step selectable too:

```tsx
<FormStep index={index} node={node}>
```

### Editing a property

Property markers are yours to add, because only your component knows which element shows which property. Field components run on the client, so import the helper from `forms/react` — `react/server` pulls in server components and cannot be imported from a `'use client'` file:

```tsx
'use client';

import { getPreviewUtils, useFormField } from '@optimizely/cms-sdk/forms/react';

export default function FormInput({ content }) {
  const { fieldProps } = useFormField({ content });
  const { pa } = getPreviewUtils(content);

  return (
    <label htmlFor={fieldProps.id} {...pa('Label')}>
      {content.Label}
    </label>
  );
}
```

`pa` returns an empty object outside edit mode, so it is safe to spread unconditionally.

> [!WARNING]
> **CSS that depends on a component being a direct child breaks in edit mode.** The marker div sits between the parent and your component, so it becomes the flex or grid item instead. `ml-auto` on a button will align it while a visitor views the page and do nothing while an editor does. The same applies to `first:`, `last:`, `space-x-*` and sibling selectors.
>
> Let the container decide the layout. For a row of buttons, choose `justify-between` or `justify-end` on the wrapper rather than pushing individual buttons with a margin. `getFormButtonRole` answers "is one of these a back button" without React, so a server component can make that decision:
>
> ```tsx
> import { getFormButtonRole } from '@optimizely/cms-sdk/forms/react';
>
> const goesBack = nodes.some(n => getFormButtonRole(n.component ?? {}) === 'previous');
> ```

### Previewing a form on its own

A form container is a shared block, so the CMS can preview it outside any page. That works the same way as a page: the SDK fetches the section's own composition, and its steps arrive on `content.nodes` exactly as they do when the form sits on a page. No separate code path is needed in your container component.

If a form renders with its title but no fields, the container's nodes were not fetched. That happens when the container is not a top-level section of the composition — see the note under [Available Content Types](#available-content-types).

---

## Advanced Topics

### Available Content Types

`initForms` registers all of these for you. Import them individually only if you need to reference one in your own content model:

```ts
import { OptiFormsContainerDataContentType } from '@optimizely/cms-sdk';

// Available:
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

`initForms` can be called before or after `initContentTypeRegistry` and `initReactComponentRegistry`, works with a resolver function as well as a component map, and is safe to call more than once — a hot reload will not register anything twice.

### How form fragments are fetched

These types add a substantial amount to a query — on a site with fifteen components they more than double an experience query — so they are only requested for pages that actually contain a form. The content metadata request the SDK already sends for each page also asks whether that page's composition holds a form container, which costs no extra round trip.

This relies on a form container being a **top-level section** of the composition, which is where the CMS puts one: a container is a section, and sections do not nest. If a future CMS release allows a section inside a section, a form nested that way would not be detected and would render with no fields. The Alloy template logs a development warning when a container renders with no nodes, which is what that would look like.

Nothing about this is configurable, and nothing in your components needs to account for it.

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
  fieldProps,   // Spread onto an <input> or <textarea>
  errorProps,   // Spread onto the element listing the messages
  value,        // Current input value
  setValue,     // Update value
  inputRef,     // Attach to the element to scroll to and focus
  onBlur,       // Marks the field touched, so errors can show
  errorId,      // id of the error element, or undefined when not showing
  errors,       // Array of error messages
  showErrors,   // Boolean: errors should be displayed now
  hasErrors,    // Boolean: field has validation errors
  isRequired,   // Boolean: field is required
  isVisible,    // Boolean: false while a dependency rule hides the field
} = useFormField({
  content: fieldContent,  // Name, validators and initial value are read from this
  name: 'fieldName',      // Optional: overrides SubmissionFieldName / Label
  validators: [...],      // Optional: overrides the Validators property
  defaultValue: '',       // Optional: overrides PredefinedValue
});
```

Pass a type parameter when the ref is not an `<input>`:

```ts
useFormField<HTMLTextAreaElement>({ content });
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
```

`initForms` registers the form content types and their components. It can be called before or after `initContentTypeRegistry` and `initReactComponentRegistry`, works alongside a resolver function as well as a component map, and is safe to call more than once — a hot reload will not register anything twice.

Handlers you leave out render a development-only placeholder, so you can add field types as you need them. The available keys are `container`, `textbox`, `textarea`, `number`, `range`, `url`, `choice`, `selection`, `submit` and `reset`.

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

### The form renders its title but no fields

The container's nodes were not fetched. Its fields are only requested when the SDK can tell the page holds a form, which it does by looking for a form container among the composition's top-level sections. A container nested deeper than that is not found. See [How form fragments are fetched](#how-form-fragments-are-fetched).

### Form won't submit

1. Verify `action` prop points to valid API endpoint
2. Check fields pass validation (no error messages)
3. Ensure form component is `'use client'`
4. Check network tab for POST request failures

If nothing at all happens, the blocking field may be on a step that is not showing. Submitting validates every step and moves to the one holding the first invalid field, so check that your field components render their error messages — a field that validates but shows nothing looks identical to a form that ignores the button.

### Buttons sit in the wrong place while editing

Layout that depends on a component being a direct child of its parent breaks in edit mode, because the CMS marker div sits in between. See the warning under [Editing in the CMS](#editing-in-the-cms).

---

## API Reference

### Core Exports

**From `@optimizely/cms-sdk/forms/react`:**

- `FormWrapper` - Main form orchestrator
- `useFormField` - Field setup hook (recommended for most fields)
- `useFormButton` - Resolves a button to next / previous / submit and wires it
- `getFormButtonRole` - The same role, without React, for use in a server component
- `DEFAULT_STEP_BUTTON_LABELS` - The labels treated as step navigation
- `partitionFormNodes` / `isFormButtonNode` - Separate a form's buttons from its fields
- `FormValidationProvider` / `useFormValidation` - Manual validation control
- `FormSubmissionProvider` / `useFormSubmission` - Submission state
- `FormRulesProvider` / `useFormRules` - Rule evaluation
- `FormElement` - Conditional field visibility wrapper
- `FormStep` - Multi-step renderer; inactive steps stay mounted and hidden
- `useFormStep` - Step navigation hook
- `getElementId` - Extract element ID from content
- `getPreviewUtils` - Edit-mode attributes, importable from a client component

**From `@optimizely/cms-sdk/forms/validation`:**

- `validateField` - Validate against validators
- `getErrorMessages` - Extract error array
- `isFieldRequired` - Check required status
- `getHtmlValidationAttributes` - Generate HTML5 attrs
- `extractErrorMessage` - Get validator message
- `extractValidatorType` - Normalize validator type
- `getFieldName` - Get display name
- `toValidators` - Safely read a `Validators` property
- `getSelectionOptions` - Safely read an `Options` property
- `VALIDATION_PATTERNS` - Reusable regex patterns

**From `@optimizely/cms-sdk`:**

- `OptiFormsContainerDataContentType` - Form container type
- Individual field types (textbox, textarea, etc.)
