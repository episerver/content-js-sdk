# Working with Optimizely Forms

The Optimizely CMS JavaScript SDK includes built-in support for Optimizely Forms, enabling you to model, fetch, and render forms in your headless applications.

> [!IMPORTANT]
> Forms support requires that Optimizely Forms is enabled in your CMS instance. Log in to the CMS, navigate to **Settings > Forms Settings**, and click **Activate**. The SDK detects this automatically — there is no configuration flag.

> [!WARNING]
> **The SDK does not submit form entries to Optimizely.** By default `FormWrapper` POSTs the form's `FormData` to whatever URL the editor put in the container's **Submit URL** field, and treats any `response.ok` as success. You are responsible for the endpoint that receives it and for storing or forwarding the data. The route in the Alloy template only logs the submission. To send it yourself instead — a server action, JSON, a third-party SDK — see [Submitting from code](#submitting-from-code).

## Contents

- [Quick Start](#quick-start) - Get running in 5 minutes
- [Creating a form in the CMS](#creating-a-form-in-the-cms) - Authoring forms and multi-step forms
- [Form Validation](#form-validation) - Using `useFormField` hook
- [Form Dependency Rules](#form-dependency-rules) - Conditional field visibility
- [Multi-Step Forms](#multi-step-forms) - Step-by-step forms
- [Editing in the CMS](#editing-in-the-cms) - Preview attributes and edit-mode behaviour
- [Advanced Topics](#advanced-topics) - API reference and advanced usage
- [Troubleshooting](#troubleshooting) - Common issues

## Quick Start

Rendering forms takes two things, done once each:

1. **In code** — write a component for the container and for each field type, then register
   them with `initForms`. Steps 1 to 4 below.
2. **In the CMS** — editors author each form and place it on a page. No further code is
   needed per form. See [Creating a form in the CMS](#creating-a-form-in-the-cms).

If you are using the Alloy or Stride template, step 1 is already done and you can go straight
to the CMS.

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
import { getFormNodes, OptimizelyGridSection } from '@optimizely/cms-sdk/react/server';
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

export default async function FormContainer({ content }: { content: OptiFormsContainerContentType }) {
  const nodes = await getFormNodes(content);
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

With the components registered, everything else happens in the CMS — no further code is
needed for each new form. See [Creating a form in the CMS](#creating-a-form-in-the-cms).

---

## Creating a form in the CMS

Once the components above are registered, editors author forms in the CMS and your
application renders them automatically — you do not write code for each new form. This
section covers only what affects the SDK; for the editor interface itself, see the
Optimizely Forms product documentation.

### How a form is structured

A form is a **shared block** of type *Form Container*, laid out like a section: the container
holds one or more **steps**, each step holds **rows** and **columns**, and the elements sit
inside the columns.

```
Form Container          the shared block
└── Form Step           at least one, even in a single-step form
    └── Row
        └── Column
            └── Textbox / Selection / Submit button / ...
```

This is the shape `FormStep`, `partitionFormNodes` and `getFormNodes` work with, and it is
why a single-step form still has a step in it. A container with no step, or fields placed
outside one, renders as a title with no fields.

### What to get right

Five things trip people up, because none of them fail loudly:

| | |
| --- | --- |
| **Submit URL** | Leave it empty and the form posts to its own page, which answers `405`. Point it at your endpoint, or send the form yourself — see [Submitting from code](#submitting-from-code). |
| **Submission field name** | The key the field uses in the submitted data. Falls back to the label, so set it when your endpoint expects a particular name. |
| **Validators combine** | An email validator alone accepts an empty field; it only checks what was typed. Add a required validator too. |
| **Step button labels** | Label them exactly `Next` and `Previous` — matching ignores case and spacing. Any other label is treated as submit, so a mislabelled button sends a half-filled form. |
| **Where you place it** | A content area's `allowedTypes` must admit the container, or its fields are never fetched — see [How form fragments are fetched](#how-form-fragments-are-fetched). A composition works with no extra setup. |

### Adding steps

Add a second **Form Step** and the SDK shows one at a time, keeping values entered on the
others. Each step carries its own navigation buttons: `Next` on the first, `Previous` and
`Next` in the middle, `Previous` plus a submit button on the last.

Advancing validates only the step on screen. Submitting validates every step and jumps to the
one holding the first invalid field. For the rendering side, see
[Multi-Step Forms](#multi-step-forms).

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

This section covers the rendering side. For authoring one in the CMS — adding steps and
labelling their buttons — see
[Adding steps](#adding-steps).

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

If a form renders with its title but no fields, the container's nodes were not fetched. See [Reading a form's steps](#reading-a-forms-steps).

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

A form placed in a **content area** rather than a composition is not visible to that probe, because a content area is an ordinary reference and `_ContentWhereInput` has no field to filter on it. The SDK falls back to the content model: if the page's type permits a form container in one of its content properties, the fragments are included. That errs towards including them, so a page type that allows a form pays for the fragments even when the particular page has none.

For that to work the content area has to admit the container. It is declared `_component` with `sectionEnabled`, and base-type expansion matches on the declared base type, so `_section` on its own reaches nothing:

```ts
extras: {
  type: 'array',
  items: {
    type: 'content',
    // Any of these work. `['_section']` alone does not.
    allowedTypes: ['_component'],
  },
},
```

Detection relies on a form container being a **top-level section** of a composition, or a direct entry in a content area. A container nested deeper than that would render with no fields; the templates log a development warning when that happens.

This applies to form containers only. `composition` comes from Graph's `_ISection` interface, and an application component declaring `sectionEnabled` is not necessarily given that interface — asking one for `composition` fails the whole query. A section-enabled component of your own placed in a content area still renders only its own fields.

Nothing about this is configurable. The one thing your components need is `getFormNodes`, described below.

### Reading a form's steps

Graph resolves a section's `composition` only when that section is asked for directly. Reached through a content area, the container arrives with `composition` empty, so reading `content.nodes` yields nothing and the form renders as a bare title.

`getFormNodes` covers both cases:

```tsx
import { getFormNodes } from '@optimizely/cms-sdk/react/server';

export default async function FormContainer({ content }) {
  const nodes = await getFormNodes(content);
  // ...
}
```

It returns `content.nodes` unchanged when the page query already brought them — a form in an experience composition, or previewed on its own — and fetches the container by key when it did not. Only the content-area case costs an extra Graph request. It is exported from `react/server` rather than `forms/react`, since it reaches Graph and must not end up in a client bundle.

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
  action="/api/submit"                    // Optional: endpoint for the built-in POST
  submitHandler={sendLead}                // Optional: send it yourself instead
  scrollToOnSuccess="element-id"          // Optional: scroll on success
  scrollToOnError="element-id"            // Optional: scroll on error
  steps={stepNodes}                       // Optional: multi-step form nodes
  rules={dependencyRules}                 // Optional: visibility rules
>
  {children}
</FormWrapper>
```

One of `action` or `submitHandler` is needed. With neither, the form posts to the page it is
on, which answers `405`; the SDK logs a development warning when that happens.

### Submitting from code

`submitHandler` replaces the built-in POST. Everything around it is unchanged: the form still
validates before it sends, still shows the submitting state, and on success still clears the
fields, returns to the first step and scrolls.

The contract is plain JavaScript — **resolve means success, throw means failure**:

```tsx
'use server';
export async function saveLead(formData: FormData) { /* ... */ }
```

```tsx
<FormWrapper
  submitHandler={async formData => {
    await saveLead(formData);
  }}
  steps={stepNodes}
>
```

A thrown `Error`'s message reaches `useFormSubmission().errorMessage`, so an API can explain
itself rather than the visitor seeing a generic failure:

```tsx
submitHandler={async formData => {
  const response = await fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.fromEntries(formData)),
  });

  // A 200 carrying a rejection is still a failure.
  const result = await response.json();
  if (!result.ok) throw new Error(result.message);
}}
```

Both template alert components already prefer `errorMessage` and fall back to their own
wording, so this works without further changes.

The handler receives the container's Submit URL as `context.action`, which lets one handler
be shared across forms that differ in destination:

```tsx
submitHandler={async (formData, { action }) => { /* ... */ }}
```

> [!WARNING]
> `submitHandler` runs in the **browser** — `FormWrapper` is a client component. Anything
> needing a credential belongs in a server action or a route handler called from the handler.
> An API key used directly inside it is shipped to every visitor.

`errorMessage` is only set when a `submitHandler` throws. A failed built-in POST leaves it
undefined on purpose, so a template that renders it cannot put `Failed to fetch` or a bare
status code in front of a visitor.

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

The container's nodes were not fetched. Two things to check:

1. The container component reads its steps with `await getFormNodes(content)`, not `content.nodes`. Graph returns an empty `composition` for a form in a content area, and only `getFormNodes` fetches it. See [Reading a form's steps](#reading-a-forms-steps).
2. The container is a top-level section of the composition, or a direct entry in a content area. A container nested deeper is not detected, so the form fragments are left out of the query. See [How form fragments are fetched](#how-form-fragments-are-fetched).

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
