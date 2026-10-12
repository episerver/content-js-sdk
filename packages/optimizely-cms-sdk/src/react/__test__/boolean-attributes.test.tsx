import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { toReactProps, createSelectComponent, createHtmlComponent } from '../richText/lib.js';

const Select = createSelectComponent();
const Option = createHtmlComponent('option');

const option = (value: string, attributes: Record<string, unknown> = {}) =>
  React.createElement(Option, { key: value, element: {} as never, attributes: { value, ...attributes } }, value);

describe('Boolean attribute handling', () => {
  it('should turn an empty boolean attribute into true', () => {
    expect(toReactProps({ autofocus: '' }, 'input').autoFocus).toBe(true);
  });

  it('should turn a valueless-style boolean attribute into true', () => {
    expect(toReactProps({ disabled: 'disabled' }, 'input').disabled).toBe(true);
    expect(toReactProps({ readonly: 'true' }, 'input').readOnly).toBe(true);
  });

  it('should treat the literal "false" as false', () => {
    expect(toReactProps({ required: 'false' }, 'input').required).toBe(false);
  });

  it('should pass real booleans through', () => {
    expect(toReactProps({ multiple: false }, 'select').multiple).toBe(false);
  });

  it('should leave non-boolean attributes as strings', () => {
    const props = toReactProps({ maxlength: '5', placeholder: '' }, 'input');
    expect(props.maxLength).toBe('5');
    expect(props.placeholder).toBe('');
  });

  it('should turn checked into defaultChecked', () => {
    const props = toReactProps({ checked: '' }, 'input');
    expect(props.defaultChecked).toBe(true);
    expect(props.checked).toBeUndefined();
  });

  it('should drop selected, which React rejects on an option', () => {
    expect(toReactProps({ selected: '', value: 'uk' }, 'option')).toEqual({ value: 'uk' });
  });

  it('should keep hidden="until-found", which is a value rather than a flag', () => {
    expect(toReactProps({ hidden: 'until-found' }, 'div').hidden).toBe('until-found');
    expect(toReactProps({ hidden: '' }, 'div').hidden).toBe(true);
  });

  it('should convert boolean attributes that React also renames', () => {
    expect(toReactProps({ ismap: '' }, 'img').isMap).toBe(true);
    expect(toReactProps({ itemscope: '' }, 'div').itemScope).toBe(true);
  });
});

describe('Select default selection', () => {
  it('should hoist a selected option onto the select', () => {
    const { container } = render(
      React.createElement(Select, { element: {} as never, attributes: {} }, [
        option('us'),
        option('uk', { selected: '' }),
      ]),
    );

    expect(container.querySelector('select')).toHaveValue('uk');
  });

  it('should hoist every selected option on a multiple select', () => {
    const { container } = render(
      React.createElement(Select, { element: {} as never, attributes: { multiple: '' } }, [
        option('us', { selected: '' }),
        option('uk'),
        option('vn', { selected: '' }),
      ]),
    );

    expect(container.querySelector('select')).toHaveValue(['us', 'vn']);
  });

  it('should hoist an option selected inside an optgroup', () => {
    const Optgroup = createHtmlComponent('optgroup');
    const { container } = render(
      React.createElement(Select, { element: {} as never, attributes: {} }, [
        option('us'),
        React.createElement(
          Optgroup,
          { key: 'europe', element: {} as never, attributes: { label: 'Europe' } },
          option('uk', { selected: '' }),
        ),
      ]),
    );

    expect(container.querySelector('select')).toHaveValue('uk');
  });

  it('should honour multiple coming from the component config', () => {
    const MultiSelect = createSelectComponent({ attributes: { multiple: true } });
    const { container } = render(
      React.createElement(MultiSelect, { element: {} as never, attributes: {} }, [
        option('us', { selected: '' }),
        option('uk', { selected: '' }),
      ]),
    );

    expect(container.querySelector('select')).toHaveValue(['us', 'uk']);
  });

  it('should leave a select with no selected option alone', () => {
    const { container } = render(
      React.createElement(Select, { element: {} as never, attributes: {} }, [option('us'), option('uk')]),
    );

    expect(container.querySelector('select')).toHaveValue('us');
  });
});
