import { describe, expect, test } from 'vitest';
import { buildFieldProps, computeFieldState, defineFormField } from '../forms/field.js';

const required = { type: 'RequiredValidator', errorMessage: 'Required' };

const content = {
  SubmissionFieldName: 'email',
  Label: 'Email address',
  Validators: [required],
  PredefinedValue: 'someone@example.com',
  _metadata: { key: 'meta-key' },
  __composition: { key: 'node-key' },
};

const visibleUntouched = { value: '', isTouched: false, attemptedSubmit: false, isVisible: true };

describe('defineFormField', () => {
  test('reads name, validators, initial value and ids from the content', () => {
    expect(defineFormField({ content })).toEqual({
      name: 'email',
      validators: [required],
      initialValue: 'someone@example.com',
      elementIds: ['node-key', 'meta-key'],
    });
  });

  test('falls back to Label, and to empty values without content', () => {
    expect(defineFormField({ content: { Label: 'Email address' } }).name).toBe('Email address');
    expect(defineFormField({})).toEqual({
      name: '',
      validators: [],
      initialValue: '',
      elementIds: [],
    });
  });

  test('overrides win over the content', () => {
    const definition = defineFormField({
      content,
      name: 'override',
      validators: [],
      defaultValue: 'x',
    });

    expect(definition).toMatchObject({ name: 'override', validators: [], initialValue: 'x' });
  });
});

describe('computeFieldState', () => {
  const definition = defineFormField({ content });

  test('errors are computed but hidden until touched or submitted', () => {
    expect(computeFieldState(definition, visibleUntouched)).toEqual({
      errors: ['Required'],
      hasErrors: true,
      showErrors: false,
      isRequired: true,
      errorId: undefined,
    });
  });

  test('touching or submitting shows them', () => {
    expect(computeFieldState(definition, { ...visibleUntouched, isTouched: true })).toMatchObject(
      { showErrors: true, errorId: 'email-error' },
    );
    expect(
      computeFieldState(definition, { ...visibleUntouched, attemptedSubmit: true }).showErrors,
    ).toBe(true);
  });

  test('a hidden field never shows errors', () => {
    const state = computeFieldState(definition, {
      ...visibleUntouched,
      attemptedSubmit: true,
      isVisible: false,
    });

    expect(state).toMatchObject({ hasErrors: true, showErrors: false });
  });
});

describe('buildFieldProps', () => {
  test('ties the input to its error list', () => {
    const definition = defineFormField({ content });
    const state = computeFieldState(definition, { ...visibleUntouched, isTouched: true });

    expect(buildFieldProps(definition, state, '')).toEqual({
      fieldProps: {
        id: 'email',
        name: 'email',
        value: '',
        required: true,
        'aria-invalid': true,
        'aria-describedby': 'email-error',
      },
      errorProps: { id: 'email-error', role: 'alert' },
    });
  });
});
