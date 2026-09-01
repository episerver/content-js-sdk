# Working with Optimizely Forms

The Optimizely CMS JavaScript SDK includes built-in support for Optimizely Forms, enabling
you to model, fetch, and render forms in your headless applications.

> [!IMPORTANT] Forms support requires that Optimizely Forms is enabled in your CMS
> instance. Log in to the CMS, navigate to **Settings > Forms Settings**, and click
> **Activate**. The SDK detects this automatically — there is no configuration flag.

> [!WARNING] **The SDK does not submit form entries to Optimizely.** By default
> `FormWrapper` POSTs the form's `FormData` to whatever URL the editor put in the
> container's **Submit URL** field, and treats any `response.ok` as success. You are
> responsible for the endpoint that receives it and for storing or forwarding the data.
> The route in the Alloy template only logs the submission. To send it yourself instead —
> a server action, JSON, a third-party SDK — see
> [Submitting from code](#submitting-from-code).

## Quick Start

Rendering forms takes two things, done once each:

1. **In code** — write a component for the container and for each field type, then
   register them with `initForms`. Steps 1 to 4 below.
2. **In the CMS** — editors author each form and place it on a page. No further code is
   needed per form. See [Creating a form in the CMS](#creating-a-form-in-the-cms).

If you are using the Alloy or Stride template, step 1 is already done and you can go
straight to the CMS.

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

The FormContainer is the root component that wraps all form content. It uses
`FormSubmissionProvider` to manage submission state, and `FormWrapper` to orchestrate
validation and submission:

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

export default function FormContainer({
  content,
}: {
  content: OptiFormsContainerContentType;
}) {
  const nodes = content.nodes ?? [];
  const stepNodes = nodes.filter(node => !isFormButtonNode(node));

  return (
    <FormSubmissionProvider>
      <div id='form-alert' className='max-w-2xl space-y-5'>
        {content.Title && <h2>{content.Title}</h2>}
        {content.Description && <p>{content.Description}</p>}

        <FormAlerts submitConfirmationMessage={content.SubmitConfirmationMessage} />

        <FormWrapper
          scrollToOnSuccess='form-alert'
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
                <OptimizelyGridSection
                  nodes={step.content}
                  row={GridRow}
                  column={GridColumn}
                />
                {step.buttons.length > 0 && (
                  <div className='mt-6 flex items-center justify-end gap-3'>
                    <OptimizelyGridSection
                      nodes={step.buttons}
                      row={GridRow}
                      column={GridColumn}
                    />
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

Field components render individual form inputs with validation and error display. Pass the
element's `content` to `useFormField` and it derives the field name, validators and
initial value for you, and hands back the props to spread:

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
          {isRequired && <span className='text-red-600'>*</span>}
        </label>
        <input
          {...fieldProps}
          type={(htmlAttrs.type as string) ?? 'text'}
          placeholder={content.Placeholder ?? ''}
        />
        {showErrors && (
          <div {...errorProps} className='text-red-600'>
            {errors.map(e => (
              <p key={e}>{e}</p>
            ))}
          </div>
        )}
      </div>
    </FormElement>
  );
}
```

`fieldProps` carries the ref, `id`, `name`, `value`, `required`, `aria-invalid`,
`aria-describedby`, `onChange` and `onBlur`. `errorProps` carries the matching `id` and
`role="alert"`. Spreading both keeps the accessibility wiring consistent across every
field type.

To let editors click a label or placeholder and edit it in the CMS, add preview attributes
— see [Editing in the CMS](#editing-in-the-cms). The footer above aligns its buttons with
`justify-end`, which is deliberate: aligning them individually with `ml-auto` works for a
visitor but not in edit mode, for the reason explained in the same section.

For a control that cannot take those directly — a radio group, where the name and change
handler belong on each radio and the ref on the fieldset — use `inputRef`, `value`,
`setValue`, `onBlur` and `errorId` instead.

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
        <div className='bg-green-100 text-green-800 p-4 rounded'>
          {submitConfirmationMessage || 'Thank you! Your form has been submitted.'}
        </div>
      )}
      {formError && (
        <div className='bg-red-100 text-red-800 p-4 rounded'>
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

A form is a **shared block** of type _Form Container_, laid out like a section: the
container holds one or more **steps**, each step holds **rows** and **columns**, and the
elements sit inside the columns.

```text
Form Container          the shared block
└── Form Step           at least one, even in a single-step form
    └── Row
        └── Column
            └── Textbox / Selection / Submit button / ...
```

This is the shape `FormStep` and `partitionFormNodes` work with, and it is
why a single-step form still has a step in it. A container with no step, or fields placed
outside one, renders as a title with no fields.

### What to get right

Five things trip people up, because none of them fail loudly:

|                           |                                                                                                                                                                                                             |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Submit URL**            | Leave it empty and the form posts to its own page, which answers `405`. Point it at your endpoint, or send the form yourself — see [Submitting from code](#submitting-from-code).                           |
| **Submission field name** | The key the field uses in the submitted data. Falls back to the label, so set it when your endpoint expects a particular name.                                                                              |
| **Validators combine**    | An email validator alone accepts an empty field; it only checks what was typed. Add a required validator too.                                                                                               |
| **Step button labels**    | Label them exactly `Next` and `Previous` — matching ignores case and spacing. Any other label is treated as submit, so a mislabelled button sends a half-filled form.                                       |
| **Where you place it**    | A content area's `allowedTypes` must admit the container, or its fields are never fetched — see [How form fragments are fetched](#how-form-fragments-are-fetched). A composition works with no extra setup. |

### Adding steps

Add a second **Form Step** and the SDK shows one at a time, keeping values entered on the
others. Each step carries its own navigation buttons: `Next` on the first, `Previous` and
`Next` in the middle, `Previous` plus a submit button on the last.

Advancing validates only the step on screen. Submitting validates every step and jumps to
the one holding the first invalid field. For the rendering side, see
[Multi-Step Forms](#multi-step-forms).

---

## Form Validation

Validators are set on each field in the CMS. `useFormField` reads them from `content` and
handles the checking, error messages and field registration — the Quick Start field
component above already has everything needed.

Errors appear once the field has been blurred or the form submitted, so a visitor is not
told a field is invalid before they have had a chance to fill it in. Validators are
independent: an email validator accepts an empty field, so pair it with a required
validator.

Supported validators:

| Validator                    | Checks                     |
| ---------------------------- | -------------------------- |
| `requirevalidator`           | A value was entered        |
| `emailvalidator`             | Email format               |
| `integervalidator`           | Integer, negatives allowed |
| `positiveintegervalidator`   | Positive integer           |
| `decimalvalidator`           | Decimal number             |
| `urlvalidator`               | Valid URL                  |
| `regularexpressionvalidator` | A custom pattern           |

The underlying patterns are exported if you need them elsewhere:

```ts
import { VALIDATION_PATTERNS } from '@optimizely/cms-sdk/forms/validation';

// email, integer, positiveInteger, decimal
VALIDATION_PATTERNS.email.test(value);
```

---

## Form Dependency Rules

Show and hide fields based on other fields' values. Rules come from the container and are
passed to `FormWrapper` once, as shown in the Quick Start:

```tsx
<FormWrapper action={...} rules={content.DependencyRules}>
```

Each field component then needs two things:

1. Wrap its markup in `FormElement`, which renders nothing for a visitor while a rule
   hides the field.
2. Pass `content` to `useFormField`, which reports the field's value so rules that depend
   on it can be evaluated. No manual `setFieldValue()` calls are needed.

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

`FormElement` must wrap the markup **inside** the field component, not the component
itself. A hidden field is excluded from validation, and `useFormField` can only do that
from inside. Wrapping from outside leaves a hidden required field registered, blocking
submission with no visible error.

A hidden field is rendered anyway while editing in the CMS. A rule describes what a
visitor sees, and an editor still has to be able to find the field to change it —
otherwise the CMS shows an empty, selectable block with no indication of what it is.

### Rule Conditions

Supported conditions: `Equals`, `NotEquals`, `Contains`, `NotContains`

Supported operators: `All` (AND), `Any` (OR)

---

## Multi-Step Forms

This section covers the rendering side. For authoring one in the CMS — adding steps and
labelling their buttons — see [Adding steps](#adding-steps).

Use `FormStep` to render one step at a time, as shown in the Quick Start container.
Inactive steps stay mounted behind `display: none`, so values survive stepping back and
forth and submitting validates every step, not just the visible one.

Advancing validates only the current step. Submitting validates all of them, and jumps to
the step holding the first invalid field so the visitor can see what is blocking them.

### Step buttons

Optimizely Forms has no property marking a button as step navigation: Next, Previous and
Submit are all the same element type, distinguished **only by their label**.
`useFormButton` resolves the role and wires it up:

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

`role` is `'next'`, `'previous'` or `'submit'`. `buttonProps` sets the right `type`, the
click handler, `disabled` while the request is in flight, and the tooltip.

For a form authored in another language, pass your own labels:

```tsx
useFormButton(content, { labels: { next: ['nästa'], previous: ['tillbaka'] } });
```

### After a successful submit

The fields are cleared and the form returns to the first step. Because the inputs are
controlled by `useFormField`, this is driven by the SDK rather than by `form.reset()`,
which only clears uncontrolled inputs.

---

## Editing in the CMS

### Selecting a block

Every component the SDK renders is wrapped in a `data-epi-block-id` marker while in edit
mode, so form elements, rows and columns are selectable without you doing anything. Pass
the step's node to `FormStep` to make the step selectable too:

```tsx
<FormStep index={index} node={node}>
```

### Editing a property

Property markers are yours to add, because only your component knows which element shows
which property. Field components run on the client, so import the helper from
`forms/react` — `react/server` pulls in server components and cannot be imported from a
`'use client'` file:

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

**CSS that depends on a component being a direct child breaks in edit mode.** The marker
div sits between the parent and your component, so it becomes the flex or grid item
instead — `ml-auto`, `first:`, `last:`, `space-x-*` and sibling selectors all stop
working. Let the container decide the layout instead: for a row of buttons, put
`justify-between` or `justify-end` on the wrapper.

`getFormButtonRole` answers "is one of these a back button" without React, so a server
component can make that choice:

```tsx
import { getFormButtonRole } from '@optimizely/cms-sdk/forms/react';

const goesBack = nodes.some(n => getFormButtonRole(n.component ?? {}) === 'previous');
```

### Previewing a form on its own

A form container is a shared block, so the CMS can preview it outside any page. That works
the same way as a page: the SDK fetches the section's own composition, and its steps
arrive on `content.nodes` exactly as they do when the form sits on a page. No separate
code path is needed in your container component.

If a form renders with its title but no fields, the container's nodes were not fetched.
See [How form fragments are fetched](#how-form-fragments-are-fetched).

---

## Advanced Topics

### Available Content Types

`initForms` registers all of these for you. Import them individually only if you need to
reference one in your own content model:

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

### How form fragments are fetched

Form fragments are large, so the SDK only requests them for pages that actually contain a
form. It detects one either in the page's composition, or — for a form in a content area —
by checking whether the page's content model permits a form container at all.

For the second case the content area has to allow `_component`. The container is declared
`_component` with `sectionEnabled`, and it is the base type that matters here:

```ts
extras: {
  type: 'array',
  items: {
    type: 'content',
    allowedTypes: ['_component'],
  },
},
```

A container has to be a top-level section of a composition, or a direct entry in a content
area. Nested deeper it is not detected and renders with no fields; the templates log a
development warning when that happens.

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
  action='/api/submit' // Optional: endpoint for the built-in POST
  submitHandler={sendLead} // Optional: send it yourself instead
  scrollToOnSuccess='element-id' // Optional: scroll on success
  scrollToOnError='element-id' // Optional: scroll on error
  steps={stepNodes} // Optional: multi-step form nodes
  rules={dependencyRules} // Optional: visibility rules
>
  {children}
</FormWrapper>
```

One of `action` or `submitHandler` is needed. With neither, the form posts to the page it
is on, which answers `405`; the SDK logs a development warning when that happens.

### Submitting from code

`submitHandler` replaces the built-in POST. The form still validates first, and on success
still clears its fields and returns to the first step. **Resolve means success, throw
means failure** — and a thrown `Error`'s message reaches
`useFormSubmission().errorMessage`, so an API can explain itself rather than the visitor
seeing a generic failure.

```tsx
<FormWrapper
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
  steps={stepNodes}
>
  {children}
</FormWrapper>
```

A server action works the same way: `submitHandler={saveLead}`. The handler also receives
the container's Submit URL as `context.action`, so one handler can serve forms with
different destinations.

Note that `submitHandler` runs in the browser, so anything needing a credential belongs in
a server action or a route handler called from it.

### useFormSubmission API

```ts
const {
  formSuccess, // Boolean: the last submit succeeded
  formError, // Boolean: the last submit failed
  isSubmitting, // Boolean: a submit is in flight
  errorMessage, // Message from a throwing `submitHandler`, else undefined
  error, // Whatever that handler threw
  status, // 'idle' | 'submitting' | 'success' | 'error'
  setStatus, // Drive the state yourself: setStatus(status, error?)
} = useFormSubmission();
```

The three booleans cover most components. `status` is the same state as one value, useful
for a switch. `setStatus` is there for a container that submits outside `FormWrapper` —
pass an `Error` alongside `'error'` to surface its message as `errorMessage`.

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
  validateField, // Validate value against validators
  getErrorMessages, // Extract error messages
  isFieldRequired, // Check if field is required
  getHtmlValidationAttributes, // Generate HTML5 attributes
  extractErrorMessage, // Get single validator message
  extractValidatorType, // Get normalized validator type
  getFieldName, // Get field display name
  VALIDATION_PATTERNS, // Regex patterns: email, integer, etc.
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

`initForms` registers the form content types and their components. It can be called before
or after `initContentTypeRegistry` and `initReactComponentRegistry`, works alongside a
resolver function as well as a component map, and is safe to call more than once — a hot
reload will not register anything twice.

Handlers you leave out render a development-only placeholder, so you can add field types
as you need them. The available keys are `container`, `textbox`, `textarea`, `number`,
`range`, `url`, `choice`, `selection`, `submit` and `reset`.

---

## Troubleshooting

| Symptom                             | Likely cause                                                                                                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Title renders, no fields**        | The container is nested deeper than a top-level section or a direct content area entry, so it is not detected. See [How form fragments are fetched](#how-form-fragments-are-fetched). |
| **Nothing renders at all**          | A component is missing from `initForms`, or a field component is missing `'use client'`. Check the browser console for resolution errors.                                             |
| **Validation never fires**          | `FormWrapper` is not wrapping the form, so there is no validation context.                                                                                                            |
| **Rules never fire**                | `FormWrapper` did not get the `rules` prop, or a field component does not pass `content` to `useFormField`.                                                                           |
| **Submit does nothing**             | The blocking field is on a step that is not showing. The form moves to it — check your field components actually render their error messages.                                         |
| **Submit always fails**             | Empty Submit URL posts to the page and gets a `405`. Check the network tab.                                                                                                           |
| **Buttons misplaced while editing** | Layout depending on a direct-child relationship; the CMS marker div sits in between. See [Editing in the CMS](#editing-in-the-cms).                                                   |
