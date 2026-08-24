import { describe, expect, test, beforeAll, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import FormWrapper, { useFormSteps } from '../forms/FormWrapper.js';
import { FormStep } from '../forms/FormStep.js';
import { FormElement } from '../forms/FormElement.js';
import { useFormField } from '../forms/useFormField.js';
import { useFormValidation } from '../forms/FormValidationContext.js';
import { FormSubmissionProvider } from '../forms/FormSubmissionProvider.js';
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
      <button type='submit'>Submit</button>
    </>
  );
}

const renderForm = (children: React.ReactNode, rules?: DependencyRule[]) =>
  render(
    <FormSubmissionProvider>
      <FormWrapper action='/submit' steps={[{}, {}] as never} rules={rules}>
        {children}
      </FormWrapper>
    </FormSubmissionProvider>,
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

describe('submitting', () => {
  const type = (label: string, value: string) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value } });

  const clickSubmit = () => act(() => screen.getByText('Submit').click());

  const twoStepForm = () => (
    <>
      <FormStep index={0}>
        <Field name='step0' />
      </FormStep>
      <FormStep index={1}>
        <Field name='step1' />
      </FormStep>
      <Probe />
    </>
  );

  // Submitting checks every step, so the blocking field can be on one that is
  // hidden. Without jumping to it, the form just refuses to send and nothing
  // on screen explains why.
  test('jumps to the step holding the first invalid field', () => {
    renderForm(twoStepForm());

    type('step0', 'filled');
    clickNext();
    expect(step()).toBe('1');

    // Empty the first step again while standing on the second, then submit.
    type('step0', '');
    clickSubmit();

    expect(step()).toBe('0');
  });

  test('stays put when the invalid field is already on screen', () => {
    renderForm(twoStepForm());

    type('step0', 'filled');
    clickNext();
    clickSubmit();

    expect(step()).toBe('1');
  });

  test('does not post while a field is invalid', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    renderForm(twoStepForm());
    clickSubmit();

    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  test('posts to the action and clears the fields once it succeeds', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => {
      return { ok: true } as Response;
    });
    vi.stubGlobal('fetch', fetchMock);

    renderForm(twoStepForm());

    type('step0', 'filled');
    clickNext();
    type('step1', 'also filled');

    await act(async () => {
      screen.getByText('Submit').click();
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe('/submit');

    // Controlled inputs keep their value through `form.reset()`, so a form that
    // submitted fine still looks untouched unless the fields are reset too.
    expect((screen.getByLabelText('step0') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('step1') as HTMLInputElement).value).toBe('');
    expect(step()).toBe('0');

    vi.unstubAllGlobals();
  });
});

describe('a field hidden by a rule', () => {
  const hideRule: DependencyRule[] = [
    {
      TargetElement: 'hidden-field',
      SatisfiedAction: 'Hide',
      ConditionCombination: 'Any',
      Conditions: null,
    },
  ];

  /** Like `Field`, but able to carry the CMS edit context. */
  function EditableField({ editing }: { editing: boolean }) {
    const content = {
      _id: 'hidden-field',
      ...(editing ? { __context: { edit: true, preview_token: 't' } } : {}),
    };
    const { value, setValue, inputRef } = useFormField({
      name: 'hidden',
      validators: [],
      content,
    });

    return (
      <FormElement content={content}>
        <input
          ref={inputRef}
          aria-label='hidden'
          value={value}
          onChange={e => setValue(e.target.value)}
        />
      </FormElement>
    );
  }

  test('is hidden from a visitor', () => {
    renderForm(<EditableField editing={false} />, hideRule);

    expect(screen.queryByLabelText('hidden')).toBeNull();
  });

  // Otherwise the CMS shows an empty, selectable block where the field should be.
  test('is still rendered for an editor', () => {
    renderForm(<EditableField editing={true} />, hideRule);

    expect(screen.getByLabelText('hidden')).toBeTruthy();
  });
});
