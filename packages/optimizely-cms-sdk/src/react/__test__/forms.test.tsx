import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { FormStep } from '../forms/FormStep.js';
import { FormElement } from '../forms/FormElement.js';
import { useFormField } from '../forms/useFormField.js';
import { useFormValidation } from '../forms/FormValidationContext.js';
import type { DependencyRule } from '../forms/FormRulesContext.js';
import type { FormSubmitHandler } from '../forms/FormWrapper.js';
import { Field, Probe, renderForm } from './formsTestUtils.js';

beforeAll(() => {
  // jsdom does not implement it, and it runs on a failed submit.
  Element.prototype.scrollIntoView = () => {};
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const hideRule: DependencyRule[] = [
  {
    TargetElement: 'hidden-field',
    SatisfiedAction: 'Hide',
    ConditionCombination: 'Any',
    Conditions: null,
  },
];

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

const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const valueOf = (label: string) => (screen.getByLabelText(label) as HTMLInputElement).value;
const clickNext = () => act(() => screen.getByText('Next').click());
const clickSubmit = () => act(() => screen.getByText('Submit').click());
const step = () => screen.getByTestId('step').textContent;
const status = () => screen.getByTestId('status').textContent;

describe('FormWrapper', () => {
  test('warns in development when there is neither an action nor a submitHandler', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderForm(<Probe />, undefined, { action: undefined });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no `action` and no `submitHandler`'));
  });

  test('does not warn when an action is set', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderForm(<Probe />);

    expect(warn).not.toHaveBeenCalled();
  });

  test('a native reset clears the fields and returns to the first step', () => {
    const { container } = renderForm(twoStepForm());

    type('step0', 'filled');
    clickNext();
    type('step1', 'also filled');
    act(() => void fireEvent.reset(container.querySelector('form')!));

    expect(valueOf('step0')).toBe('');
    expect(valueOf('step1')).toBe('');
    expect(step()).toBe('0');
  });

  test('ignores rules that are not an array', () => {
    renderForm(<Field name='hidden' elementId='hidden-field' />, hideRule[0] as never);

    expect(screen.getByLabelText('hidden')).toBeTruthy();
  });
});

describe('a field hidden by a rule', () => {
  /** Like `Field`, but able to carry the CMS edit context. */
  function EditableField({ editing }: { editing: boolean }) {
    const content = {
      _id: 'hidden-field',
      ...(editing ? { __context: { edit: true, preview_token: 't' } } : {}),
    };
    const { value, setValue, inputRef } = useFormField({ name: 'hidden', validators: [], content });

    return (
      <FormElement content={content}>
        <input ref={inputRef} aria-label='hidden' value={value} onChange={e => setValue(e.target.value)} />
      </FormElement>
    );
  }

  // A hidden field used to stay registered, so an empty required one disabled submit with no error on screen.
  test('is not rendered and does not block the form', () => {
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

  test('blocks the form when no rule hides it', () => {
    renderForm(
      <>
        <Field name='hidden' elementId='hidden-field' />
        <Probe />
      </>,
    );

    expect(screen.getByLabelText('hidden')).toBeTruthy();
    expect(screen.getByTestId('has-errors').textContent).toBe('true');
  });

  // Otherwise the CMS shows an empty, selectable block where the field should be.
  test('is still rendered for an editor', () => {
    renderForm(<EditableField editing={true} />, hideRule);

    expect(screen.getByLabelText('hidden')).toBeTruthy();
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

  test('changing step does not re-render components reading validation state', () => {
    let renders = 0;
    function Counter() {
      useFormValidation();
      renders++;
      return null;
    }

    renderForm(
      <>
        <Counter />
        <Probe />
      </>,
    );

    const initial = renders;
    clickNext();

    expect(step()).toBe('1');
    expect(renders).toBe(initial);
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

    type('step0', 'typed');
    clickNext();

    expect(step()).toBe('1');
    expect(valueOf('step0')).toBe('typed');
  });
});

describe('FormStep', () => {
  const node = (edit: boolean) => ({ key: 'step-1', __context: { edit, preview_token: 't' } });

  test('marks the step for the editor in edit mode', () => {
    const { container } = render(<FormStep index={0} node={node(true)}>x</FormStep>);

    expect(container.querySelector('fieldset')?.getAttribute('data-epi-block-id')).toBe('step-1');
  });

  test('adds no marker outside edit mode', () => {
    const { container } = render(<FormStep index={0} node={node(false)}>x</FormStep>);

    expect(container.querySelector('fieldset')?.hasAttribute('data-epi-block-id')).toBe(false);
  });
});

describe('submitting', () => {
  // Submitting checks every step, so without jumping to the blocking field the form refuses silently.
  test('jumps to the step holding the first invalid field', () => {
    renderForm(twoStepForm());

    type('step0', 'filled');
    clickNext();
    expect(step()).toBe('1');

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
  });

  test('posts to the action and clears the fields once it succeeds', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => ({ ok: true }) as Response);
    vi.stubGlobal('fetch', fetchMock);

    renderForm(twoStepForm());

    type('step0', 'filled');
    clickNext();
    type('step1', 'also filled');
    await act(async () => screen.getByText('Submit').click());

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe('/submit');

    // Controlled inputs keep their value through `form.reset()`, so the fields are reset too.
    expect(valueOf('step0')).toBe('');
    expect(valueOf('step1')).toBe('');
    expect(step()).toBe('0');
  });
});

describe('a submitHandler', () => {
  /** Fills both steps and submits, which is the only way to reach the handler. */
  const submitValidForm = async (handler: FormSubmitHandler) => {
    renderForm(twoStepForm(), undefined, { submitHandler: handler });
    type('step0', 'filled');
    clickNext();
    type('step1', 'also filled');
    await act(async () => screen.getByText('Submit').click());
  };

  test('replaces the post and receives the form values', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const handler = vi.fn<FormSubmitHandler>(async () => {});

    await submitValidForm(handler);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(handler).toHaveBeenCalledOnce();

    const formData = handler.mock.calls[0][0];
    expect(formData.get('step0')).toBe('filled');
    expect(formData.get('step1')).toBe('also filled');
    // Passed through so a handler shared between forms can still read it.
    expect(handler.mock.calls[0][1]).toEqual({ action: '/submit' });
  });

  // Resolving has to mean the same as an `ok` response, or swapping the transport loses the reset.
  test('resolving runs the whole success path', async () => {
    await submitValidForm(async () => {});

    expect(status()).toBe('success');
    expect(valueOf('step0')).toBe('');
    expect(valueOf('step1')).toBe('');
    expect(step()).toBe('0');
  });

  test('is never called while a field is invalid', () => {
    const handler = vi.fn<FormSubmitHandler>(async () => {});

    renderForm(twoStepForm(), undefined, { submitHandler: handler });
    clickSubmit();

    expect(handler).not.toHaveBeenCalled();
  });

  test('makes `action` unnecessary', async () => {
    const handler = vi.fn<FormSubmitHandler>(async () => {});

    renderForm(twoStepForm(), undefined, { submitHandler: handler, action: undefined });
    type('step0', 'filled');
    clickNext();
    type('step1', 'also filled');
    await act(async () => screen.getByText('Submit').click());

    expect(handler).toHaveBeenCalledOnce();
    expect(status()).toBe('success');
  });
});

describe('a rule naming its target by content key', () => {
  // A rule carries whichever key the CMS holds; matching only the node key left such rules targetless.
  const cmsField = (name: string) => ({
    _id: 'graph-id',
    _metadata: { key: `${name}-content-key` },
    __composition: { key: `${name}-node-key` },
  });

  const showWhenTextboxSaysSubmit: DependencyRule[] = [
    {
      TargetElement: 'button-content-key',
      SatisfiedAction: 'Show',
      ConditionCombination: 'All',
      Conditions: [
        {
          DependsOnField: 'textbox-content-key',
          ComparisonOperator: 'Equals',
          ComparisonValue: 'submit',
        },
      ],
    },
  ];

  /** A field whose content carries all three keys, as a CMS-rendered one does. */
  function CmsField() {
    const content = cmsField('textbox');
    const { value, setValue, inputRef } = useFormField({ name: 'textbox', validators: [], content });

    return (
      <FormElement content={content}>
        <input ref={inputRef} aria-label='textbox' value={value} onChange={e => setValue(e.target.value)} />
      </FormElement>
    );
  }

  /** A button, which is not a field and so only wraps in `FormElement`. */
  const CmsButton = () => (
    <FormElement content={cmsField('button')}>
      <button type='submit'>Send</button>
    </FormElement>
  );

  const renderPair = () =>
    renderForm(
      <>
        <CmsField />
        <CmsButton />
      </>,
      showWhenTextboxSaysSubmit,
    );

  test('hides the button until the condition is met', () => {
    renderPair();

    expect(screen.queryByText('Send')).toBeNull();
  });

  test('shows the button once the field it depends on matches', () => {
    renderPair();

    type('textbox', 'submit');

    expect(screen.getByText('Send')).toBeTruthy();
  });

  test('hides the button again when the value stops matching', () => {
    renderPair();

    type('textbox', 'submit');
    type('textbox', 'something else');

    expect(screen.queryByText('Send')).toBeNull();
  });
});
