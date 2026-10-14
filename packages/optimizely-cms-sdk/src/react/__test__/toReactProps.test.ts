import { describe, expect, test } from 'vitest';
import { toReactProps } from '../richText/lib.js';

type Case = {
  name: string;
  attributes: Record<string, unknown>;
  elementType?: string;
  expected: Record<string, unknown>;
};

describe('toReactProps', () => {
  test.each<Case>([
    { name: 'class becomes className', attributes: { class: 'lead' }, expected: { className: 'lead' } },
    { name: 'for becomes htmlFor', attributes: { for: 'email' }, expected: { htmlFor: 'email' } },
    {
      name: 'class and className are concatenated',
      attributes: { class: 'lead', className: 'wide' },
      expected: { className: 'lead wide' },
    },
    {
      name: 'lowercase HTML attributes are camelCased',
      attributes: { contenteditable: 'true', tabindex: '0', spellcheck: 'false' },
      expected: { contentEditable: 'true', tabIndex: '0', spellCheck: 'false' },
    },
    {
      name: 'kebab-case HTML attributes are camelCased',
      attributes: { 'tab-index': '0', 'content-editable': 'true' },
      expected: { tabIndex: '0', contentEditable: 'true' },
    },
    {
      name: 'data-*, aria-* and unknown attributes are kept as-is',
      attributes: { 'data-multi-word': 'test', 'aria-label': 'Label', 'custom-attr': 'value' },
      expected: { 'data-multi-word': 'test', 'aria-label': 'Label', 'custom-attr': 'value' },
    },
    {
      name: 'non-boolean attributes stay strings',
      attributes: { maxlength: '5', placeholder: '' },
      elementType: 'input',
      expected: { maxLength: '5', placeholder: '' },
    },
    {
      name: 'boolean attributes become booleans under their React names',
      attributes: { disabled: 'disabled', readonly: 'true', ismap: '', itemscope: '' },
      expected: { disabled: true, readOnly: true, isMap: true, itemScope: true },
    },
    { name: 'real booleans pass through', attributes: { multiple: false }, expected: { multiple: false } },
    { name: 'checked becomes defaultChecked', attributes: { checked: '' }, expected: { defaultChecked: true } },
    {
      name: 'selected is dropped, as React rejects it on an option',
      attributes: { selected: '', value: 'uk' },
      elementType: 'option',
      expected: { value: 'uk' },
    },
    {
      name: 'hidden="until-found" is kept as a value',
      attributes: { hidden: 'until-found' },
      expected: { hidden: 'until-found' },
    },
    { name: 'a bare hidden is a flag', attributes: { hidden: '' }, expected: { hidden: true } },
    { name: 'border is an attribute on a table', attributes: { border: '1' }, elementType: 'table', expected: { border: '1' } },
    {
      name: 'border is a style elsewhere',
      attributes: { border: '1px solid black' },
      elementType: 'div',
      expected: { style: { border: '1px solid black' } },
    },
    { name: 'height is an attribute on a canvas', attributes: { height: '200' }, elementType: 'canvas', expected: { height: '200' } },
    {
      name: 'height is a style elsewhere',
      attributes: { height: '50px' },
      elementType: 'p',
      expected: { style: { height: '50px' } },
    },
    {
      name: 'a style object is merged with CSS-derived styles, which win',
      attributes: { style: { color: 'red', margin: '0' }, color: 'blue', 'font-size': '14px' },
      expected: { style: { color: 'blue', margin: '0', fontSize: '14px' } },
    },
  ])('$name', ({ attributes, elementType, expected }) => {
    expect(toReactProps(attributes, elementType)).toEqual(expected);
  });
});
