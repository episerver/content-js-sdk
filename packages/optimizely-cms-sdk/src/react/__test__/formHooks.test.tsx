import { afterEach, describe, expect, test, vi } from 'vitest';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { useFormStep } from '../forms/index.js';
import { useFormSubmission } from '../forms/FormSubmissionProvider.js';
import { FormValidationProvider, useFormValidation } from '../forms/FormValidationContext.js';
import { FormRulesProvider, useFormRules, type DependencyRule } from '../forms/FormRulesContext.js';
import { useFormField } from '../forms/useFormField.js';
import { Field, Probe, REQUIRED, renderForm } from './formsTestUtils.js';

afterEach(() => vi.restoreAllMocks());

const silenceConsoleError = () => vi.spyOn(console, 'error').mockImplementation(() => {});

/** A field wired through `fieldProps` and `errorProps`, as the templates do. */
function FieldWithErrors({ name, required = true }: { name: string; required?: boolean }) {
  const { fieldProps, errorProps, errors, showErrors } = useFormField({ name, validators: required ? REQUIRED : [] });

  return (
    <>
      <input aria-label={name} {...fieldProps} />
      {showErrors && <ul {...errorProps}>{errors.map(it => <li key={it}>{it}</li>)}</ul>}
    </>
  );
}

describe('hooks used outside their providers', () => {
  test('useFormSubmission throws without a FormSubmissionProvider', () => {
    silenceConsoleError();

    expect(() => renderHook(() => useFormSubmission())).toThrow('within a FormSubmissionProvider');
  });

  test('useFormValidation throws without a FormValidationProvider', () => {
    silenceConsoleError();

    expect(() => renderHook(() => useFormValidation())).toThrow('within a FormValidationProvider');
  });

  test('useFormStep stays on the first step with inert navigation', () => {
    const { result } = renderHook(() => useFormStep());

    expect(result.current.currentStepIndex).toBe(0);
    expect(() => result.current.nextStep()).not.toThrow();
    expect(() => result.current.prevStep()).not.toThrow();
  });

  test('useFormRules shows everything through a stable fallback', () => {
    const { result, rerender } = renderHook(() => useFormRules());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
    expect(first.isElementVisible('any')).toBe(true);
    expect(first.isStepVisible('any')).toBe(true);
    expect(first.getJumpTarget('any')).toBeNull();
  });
});

describe('FormValidationProvider', () => {
  test('validates fields mounted outside a FormWrapper', () => {
    function HasErrors() {
      return <span data-testid='has-errors'>{String(useFormValidation().hasAnyErrors)}</span>;
    }

    render(
      <FormValidationProvider>
        <Field name='email' />
        <HasErrors />
      </FormValidationProvider>,
    );

    expect(screen.getByTestId('has-errors').textContent).toBe('true');

    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'a@b.c' } });

    expect(screen.getByTestId('has-errors').textContent).toBe('false');
  });
});

describe('FormRulesProvider.setFieldValue', () => {
  test('publishes a new value but not an unchanged one or an empty id list', () => {
    const seen: ReturnType<typeof useFormRules>[] = [];
    function Reader() {
      seen.push(useFormRules());
      return null;
    }

    render(
      <FormRulesProvider>
        <Reader />
      </FormRulesProvider>,
    );
    const { setFieldValue } = seen[0];

    act(() => setFieldValue('field-a', 'x'));
    const rendersAfterChange = seen.length;
    act(() => setFieldValue('field-a', 'x'));
    act(() => setFieldValue([], 'y'));

    expect(rendersAfterChange).toBe(2);
    expect(seen).toHaveLength(2);
    expect(seen[1].fieldValues.get('field-a')).toBe('x');
    expect([...seen[1].fieldValues.keys()]).toEqual(['field-a']);
  });
});

describe('useFormField', () => {
  test('shows errors only once the field has been touched', () => {
    renderForm(<FieldWithErrors name='email' />);
    const input = screen.getByLabelText('email');

    expect(screen.queryByRole('alert')).toBeNull();
    expect(input.getAttribute('aria-invalid')).toBe('false');
    expect(input.hasAttribute('aria-describedby')).toBe(false);

    fireEvent.blur(input);

    expect(screen.getByRole('alert').id).toBe('email-error');
    expect(screen.getByRole('alert').textContent).toBe('This field is required');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('email-error');
  });

  test('fieldProps.onChange updates the value and clears the error', () => {
    renderForm(<FieldWithErrors name='email' />);
    const input = screen.getByLabelText('email') as HTMLInputElement;

    fireEvent.blur(input);
    fireEvent.change(input, { target: { value: 'a@b.c' } });

    expect(input.value).toBe('a@b.c');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  test('marks the input required only with a required validator', () => {
    renderForm(
      <>
        <FieldWithErrors name='required' />
        <FieldWithErrors name='optional' required={false} />
      </>,
    );

    expect((screen.getByLabelText('required') as HTMLInputElement).required).toBe(true);
    expect((screen.getByLabelText('optional') as HTMLInputElement).required).toBe(false);
  });

  test('registers again for validation when a rule reveals it', () => {
    const showWhenTriggered: DependencyRule[] = [
      {
        TargetElement: 'target-field',
        SatisfiedAction: 'Show',
        ConditionCombination: 'All',
        Conditions: [{ DependsOnField: 'trigger-field', ComparisonOperator: 'Equals', ComparisonValue: 'show' }],
      },
    ];

    renderForm(
      <>
        <Field name='trigger' elementId='trigger-field' validators={[]} />
        <Field name='target' elementId='target-field' />
        <Probe />
      </>,
      showWhenTriggered,
    );

    expect(screen.getByTestId('has-errors').textContent).toBe('false');

    fireEvent.change(screen.getByLabelText('trigger'), { target: { value: 'show' } });

    expect(screen.getByLabelText('target')).toBeTruthy();
    expect(screen.getByTestId('has-errors').textContent).toBe('true');
  });
});
