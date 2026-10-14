import type { ReactNode } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import FormWrapper, { useFormSteps, type FormSubmitHandler } from '../forms/FormWrapper.js';
import { FormElement } from '../forms/FormElement.js';
import { useFormField } from '../forms/useFormField.js';
import { useFormValidation } from '../forms/FormValidationContext.js';
import { FormSubmissionProvider, useFormSubmission } from '../forms/FormSubmissionProvider.js';
import type { DependencyRule } from '../forms/FormRulesContext.js';
import type { Validator } from '../../forms/validation.js';

export const REQUIRED: Validator[] = [{ type: 'requirevalidator', errorMessage: 'This field is required' }];

/** A field driven entirely by `useFormField`, like the template components are. */
export function Field({
  name,
  elementId,
  validators = REQUIRED,
}: {
  name: string;
  elementId?: string;
  validators?: Validator[];
}) {
  const content = elementId ? { _id: elementId } : undefined;
  const { value, setValue, inputRef } = useFormField({ name, validators, content });

  return (
    <FormElement content={content ?? {}}>
      <input ref={inputRef} aria-label={name} name={name} value={value} onChange={e => setValue(e.target.value)} />
    </FormElement>
  );
}

/** Surfaces the form state assertions care about, plus Next and Submit buttons. */
export function Probe() {
  const { hasAnyErrors } = useFormValidation();
  const { currentStepIndex, nextStep } = useFormSteps();
  const { status, errorMessage } = useFormSubmission();

  return (
    <>
      <span data-testid='has-errors'>{String(hasAnyErrors)}</span>
      <span data-testid='step'>{currentStepIndex}</span>
      <span data-testid='status'>{status}</span>
      <span data-testid='error-message'>{errorMessage ?? ''}</span>
      <button type='button' onClick={nextStep}>
        Next
      </button>
      <button type='submit'>Submit</button>
    </>
  );
}

/** Renders a two-step form posting to `/submit` unless `props` says otherwise. */
export const renderForm = (
  children: ReactNode,
  rules?: DependencyRule[],
  props?: { submitHandler?: FormSubmitHandler; action?: string },
): RenderResult =>
  render(
    <FormSubmissionProvider>
      <FormWrapper action='/submit' steps={[{}, {}] as never} rules={rules} {...props}>
        {children}
      </FormWrapper>
    </FormSubmissionProvider>,
  );
