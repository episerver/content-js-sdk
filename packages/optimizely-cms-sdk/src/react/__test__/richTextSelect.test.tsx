import React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { createSelectComponent, createHtmlComponent } from '../richText/lib.js';
import { RichText } from '../richText/component.js';
import type { Node } from '../../components/richText/renderer.js';

const Select = createSelectComponent();
const Option = createHtmlComponent('option');

const option = (value: string, attributes: Record<string, unknown> = {}) =>
  React.createElement(Option, { key: value, element: {} as never, attributes: { value, ...attributes } }, value);

const renderSelect = (children: React.ReactNode[], attributes: Record<string, unknown> = {}, Component = Select) =>
  render(React.createElement(Component, { element: {} as never, attributes }, children));

describe('Select default selection', () => {
  test('hoists a selected option onto the select', () => {
    const { container } = renderSelect([option('us'), option('uk', { selected: '' })]);

    expect(container.querySelector('select')).toHaveValue('uk');
  });

  test('hoists every selected option on a multiple select', () => {
    const { container } = renderSelect(
      [option('us', { selected: '' }), option('uk'), option('vn', { selected: '' })],
      { multiple: '' },
    );

    expect(container.querySelector('select')).toHaveValue(['us', 'vn']);
  });

  test('hoists an option selected inside an optgroup', () => {
    const Optgroup = createHtmlComponent('optgroup');
    const { container } = renderSelect([
      option('us'),
      React.createElement(
        Optgroup,
        { key: 'europe', element: {} as never, attributes: { label: 'Europe' } },
        option('uk', { selected: '' }),
      ),
    ]);

    expect(container.querySelector('select')).toHaveValue('uk');
  });

  test('honours multiple coming from the component config', () => {
    const MultiSelect = createSelectComponent({ attributes: { multiple: true } });
    const { container } = renderSelect([option('us', { selected: '' }), option('uk', { selected: '' })], {}, MultiSelect);

    expect(container.querySelector('select')).toHaveValue(['us', 'uk']);
  });

  test('leaves a select with no selected option alone', () => {
    const { container } = renderSelect([option('us'), option('uk')]);

    expect(container.querySelector('select')).toHaveValue('us');
  });

  test('selects an option without a value by its text', () => {
    const content = {
      type: 'richText' as const,
      children: [
        {
          type: 'select',
          children: [
            { type: 'option', children: [{ text: 'US' }] },
            { type: 'option', selected: '', children: [{ text: 'UK' }] },
          ],
        },
      ] as Node[],
    };

    const { container } = render(<RichText content={content} />);

    expect(container.querySelector('select')).toHaveValue('UK');
  });
});
