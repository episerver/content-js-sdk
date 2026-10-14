import { describe, expect, test } from 'vitest';
import { screen, act } from '@testing-library/react';
import { useFormButton } from '../forms/useFormButton.js';
import { Probe, renderForm } from './formsTestUtils.js';

function Button({
  id,
  label,
  tooltip,
  labels,
  roleOverride,
}: {
  id: string;
  label?: string;
  tooltip?: string;
  labels?: { next?: string[]; previous?: string[] };
  roleOverride?: 'next' | 'previous' | 'submit' | 'reset';
}) {
  const { role, label: text, buttonProps } = useFormButton({ Label: label, Tooltip: tooltip }, { labels, role: roleOverride });

  return (
    <button {...buttonProps} data-testid={id} data-role={role}>
      {text}
    </button>
  );
}

const renderButtons = (children: React.ReactNode, submitHandler?: () => Promise<void>) =>
  renderForm(
    <>
      {children}
      <Probe />
    </>,
    undefined,
    submitHandler ? { submitHandler } : undefined,
  );

const button = (id: string) => screen.getByTestId(id);
const roleOf = (id: string) => button(id).getAttribute('data-role');
const typeOf = (id: string) => button(id).getAttribute('type');
const step = () => screen.getByTestId('step').textContent;

describe('useFormButton', () => {
  test('reads the role from the label, case and padding insensitively', () => {
    renderButtons(
      <>
        <Button id='next' label='  NeXt ' />
        <Button id='prev' label='Previous' />
        <Button id='back' label='Back' />
        <Button id='other' label='Send enquiry' />
      </>,
    );

    expect(roleOf('next')).toBe('next');
    expect(roleOf('prev')).toBe('previous');
    expect(roleOf('back')).toBe('previous');
    expect(roleOf('other')).toBe('submit');
  });

  // Only the real submit button may submit; a step button that submits sends a half-filled form.
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

    expect(step()).toBe('0');

    act(() => button('next').click());
    expect(step()).toBe('1');

    act(() => button('prev').click());
    expect(step()).toBe('0');
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

  test('a reset role override produces type=reset', () => {
    renderButtons(<Button id='reset' label='Reset' roleOverride='reset' />);

    expect(roleOf('reset')).toBe('reset');
    expect(typeOf('reset')).toBe('reset');
  });

  test('an unrecognised label stays a submit button', () => {
    renderButtons(<Button id='next' label='Nästa' />);

    expect(roleOf('next')).toBe('submit');
    expect(typeOf('next')).toBe('submit');
  });

  test('a button without a label is a submit button labelled Submit', () => {
    renderButtons(<Button id='unlabelled' />);

    expect(roleOf('unlabelled')).toBe('submit');
    expect(button('unlabelled').textContent).toBe('Submit');
  });

  test('the tooltip becomes the title', () => {
    renderButtons(<Button id='submit' label='Send' tooltip='Sends the form' />);

    expect(button('submit').getAttribute('title')).toBe('Sends the form');
  });

  test('is disabled while the form is submitting', async () => {
    let finish: () => void = () => {};
    const submitHandler = () => new Promise<void>(resolve => (finish = resolve));
    renderButtons(<Button id='send' label='Send' />, submitHandler);

    await act(async () => button('send').click());
    expect(button('send')).toHaveProperty('disabled', true);

    await act(async () => finish());
    expect(button('send')).toHaveProperty('disabled', false);
  });
});
