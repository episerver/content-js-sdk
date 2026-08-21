import { describe, expect, test, beforeAll } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import FormWrapper, { useFormSteps } from '../forms/FormWrapper.js';
import { FormStep } from '../forms/FormStep.js';
import { FormElement } from '../forms/FormElement.js';
import { useFormField } from '../forms/useFormField.js';
import { useFormValidation } from '../forms/FormValidationContext.js';
import { FormStatusProvider } from '../forms/FormStatusProvider.js';
import type { DependencyRule } from '../forms/FormRulesContext.js';
import type { Validator } from '../../forms/validation.js';

beforeAll(() => {
  // jsdom implements neither of these, and both run on a failed submit.
  Element.prototype.scrollIntoView = () => {};
});

const REQUIRED: Validator[] = [
  { type: 'requirevalidator', errorMessage: 'This field is required' },
];

/** A field driven entirely by `useFormField`, like the template components are. */
function Field({
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
      <input
        ref={inputRef}
        aria-label={name}
        name={name}
        value={value}
        onChange={e => setValue(e.target.value)}
      />
    </FormElement>
  );
}

/** Surfaces the bits of form state the assertions care about. */
function Probe() {
  const { hasAnyErrors } = useFormValidation();
  const { currentStepIndex, nextStep } = useFormSteps();

  return (
    <>
      <span data-testid='has-errors'>{String(hasAnyErrors)}</span>
      <span data-testid='step'>{currentStepIndex}</span>
      <button type='button' onClick={nextStep}>
        Next
      </button>
    </>
  );
}

const renderForm = (children: React.ReactNode, rules?: DependencyRule[]) =>
  render(
    <FormStatusProvider>
      <FormWrapper action='/submit' steps={[{}, {}] as never} rules={rules}>
        {children}
      </FormWrapper>
    </FormStatusProvider>,
  );

const clickNext = () => act(() => screen.getByText('Next').click());
const step = () => screen.getByTestId('step').textContent;

describe('rule-hidden fields', () => {
  // A field hidden by a rule used to stay registered, so an empty required field
  // kept `hasAnyErrors` true and disabled submit with no error anywhere on screen.
  const hideRule: DependencyRule[] = [
    {
      TargetElement: 'hidden-field',
      SatisfiedAction: 'Hide',
      ConditionCombination: 'Any',
      Conditions: null,
    },
  ];

  test('a hidden required field is not rendered and does not block the form', () => {
    renderForm(
      <>
        <Field name='visible' elementId='visible-field' validators={[]} />
        <Field name='hidden' elementId='hidden-field' />
        <Probe />
      </>,
      hideRule,
    );

    expect(screen.queryByLabelText('hidden')).toBeNull();
    expect(screen.getByTestId('has-errors').textContent).toBe('false');
  });

  test('the same field does block the form when no rule hides it', () => {
    renderForm(
      <>
        <Field name='hidden' elementId='hidden-field' />
        <Probe />
      </>,
    );

    expect(screen.getByLabelText('hidden')).toBeTruthy();
    expect(screen.getByTestId('has-errors').textContent).toBe('true');
  });
});

describe('step navigation', () => {
  test('an invalid field on the current step blocks advancing', () => {
    renderForm(
      <>
        <FormStep index={0}>
          <Field name='step0' />
        </FormStep>
        <FormStep index={1}>
          <Field name='step1' validators={[]} />
        </FormStep>
        <Probe />
      </>,
    );

    expect(step()).toBe('0');
    clickNext();
    expect(step()).toBe('0');
  });

  test('an invalid field on a later step does not block advancing', () => {
    renderForm(
      <>
        <FormStep index={0}>
          <Field name='step0' validators={[]} />
        </FormStep>
        <FormStep index={1}>
          <Field name='step1' />
        </FormStep>
        <Probe />
      </>,
    );

    clickNext();
    expect(step()).toBe('1');
  });

  test('advancing stops at the last step', () => {
    renderForm(
      <>
        <FormStep index={0}>
          <Field name='step0' validators={[]} />
        </FormStep>
        <FormStep index={1}>
          <Field name='step1' validators={[]} />
        </FormStep>
        <Probe />
      </>,
    );

    clickNext();
    clickNext();
    clickNext();

    // `steps` has length 2, so the last index is 1. Overshooting to 2 would
    // leave every step hidden and render a blank form.
    expect(step()).toBe('1');
    expect(screen.getByLabelText('step1')).toBeTruthy();
  });

  test('fields on inactive steps stay mounted so their values survive', () => {
    renderForm(
      <>
        <FormStep index={0}>
          <Field name='step0' validators={[]} />
        </FormStep>
        <FormStep index={1}>
          <Field name='step1' validators={[]} />
        </FormStep>
        <Probe />
      </>,
    );

    fireEvent.change(screen.getByLabelText('step0'), { target: { value: 'typed' } });

    clickNext();

    expect(step()).toBe('1');
    expect((screen.getByLabelText('step0') as HTMLInputElement).value).toBe('typed');
  });
});
