import { describe, expect, test } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import FormWrapper, { useFormSteps } from '../forms/FormWrapper.js';
import { FormSubmissionProvider } from '../forms/FormSubmissionProvider.js';
import { useFormButton } from '../forms/useFormButton.js';

function Button({
  id,
  label,
  labels,
}: {
  id: string;
  label: string;
  labels?: { next?: string[]; previous?: string[] };
}) {
  const { role, buttonProps } = useFormButton({ Label: label }, { labels });

  return (
    <button {...buttonProps} data-testid={id} data-role={role}>
      {label}
    </button>
  );
}

function StepReadout() {
  const { currentStepIndex } = useFormSteps();
  return <span data-testid='step'>{currentStepIndex}</span>;
}

const renderButtons = (children: React.ReactNode) =>
  render(
    <FormSubmissionProvider>
      <FormWrapper action='/submit' steps={[{}, {}] as never}>
        {children}
        <StepReadout />
      </FormWrapper>
    </FormSubmissionProvider>,
  );

const roleOf = (label: string) => screen.getByTestId(label).getAttribute('data-role');
const typeOf = (label: string) => screen.getByTestId(label).getAttribute('type');

describe('useFormButton', () => {
  test('reads the role from the label, case and padding insensitively', () => {
    renderButtons(
      <>
        <Button id='next' label='  NeXt ' />
        <Button id='prev' label='Previous' />
        <Button id='other' label='Send enquiry' />
      </>,
    );

    expect(roleOf('next')).toBe('next');
    expect(roleOf('prev')).toBe('previous');
    expect(roleOf('other')).toBe('submit');
  });

  // Only the real submit button may submit the form; a step button that submits
  // sends a half-filled form instead of advancing.
  test('only the submit button gets type=submit', () => {
    renderButtons(
      <>
        <Button id='next' label='Next' />
        <Button id='prev' label='Previous' />
        <Button id='submit' label='Submit' />
      </>,
    );

    expect(typeOf('next')).toBe('button');
    expect(typeOf('prev')).toBe('button');
    expect(typeOf('submit')).toBe('submit');
  });

  test('next and previous move between steps', () => {
    renderButtons(
      <>
        <Button id='next' label='Next' />
        <Button id='prev' label='Previous' />
      </>,
    );

    expect(screen.getByTestId('step').textContent).toBe('0');

    act(() => screen.getByTestId('next').click());
    expect(screen.getByTestId('step').textContent).toBe('1');

    act(() => screen.getByTestId('prev').click());
    expect(screen.getByTestId('step').textContent).toBe('0');
  });

  // A form authored in another language would otherwise submit on "Nästa".
  test('accepts custom labels for non-English forms', () => {
    renderButtons(
      <>
        <Button id='next' label='Nästa' labels={{ next: ['nästa'] }} />
        <Button id='prev' label='Tillbaka' labels={{ previous: ['tillbaka'] }} />
      </>,
    );

    expect(roleOf('next')).toBe('next');
    expect(roleOf('prev')).toBe('previous');
  });

  test('an unrecognised label stays a submit button', () => {
    renderButtons(<Button id='next' label='Nästa' />);

    expect(roleOf('next')).toBe('submit');
    expect(typeOf('next')).toBe('submit');
  });
});
