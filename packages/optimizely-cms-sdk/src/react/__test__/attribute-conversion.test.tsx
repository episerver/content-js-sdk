import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { createHtmlComponent } from '../richText/lib.js';

describe('Attribute Conversion to React Props', () => {
  it('should convert class to className', () => {
    const TestComponent = createHtmlComponent('div');
    const { container } = render(
      <TestComponent
        attributes={{ class: 'test-class' }}
        element={{ type: 'div', children: [] }}
      >
        Test
      </TestComponent>
    );

    const divElement = container.querySelector('div');
    expect(divElement).toHaveClass('test-class');
  });

  it('should convert table attributes', () => {
    const TestComponent = createHtmlComponent('table');
    const { container } = render(
      <TestComponent
        attributes={{
          cellpadding: '5',
          cellspacing: '10',
          border: '1',
        }}
        element={{ type: 'table', children: [] }}
      />
    );

    const tableElement = container.querySelector('table');
    expect(tableElement).toHaveAttribute('cellPadding', '5');
    expect(tableElement).toHaveAttribute('cellSpacing', '10');
    expect(tableElement).toHaveAttribute('border', '1');
  });

  it('should convert valid HTML kebab-case attributes but preserve CSS properties and data-*/aria-*', () => {
    const TestComponent = createHtmlComponent('div');
    const { container } = render(
      <TestComponent
        attributes={{
          'data-test-id': 'test123', // Should stay as-is (data attribute)
          'aria-expanded': 'true', // Should stay as-is (aria attribute)
          'tab-index': '0', // Should become tabIndex (valid HTML attribute)
          'content-editable': 'true', // Should become contentEditable (valid HTML attribute)
          'custom-attr': 'value', // Should stay as-is (not a known HTML attribute)
        }}
        element={{ type: 'div', children: [] }}
      />
    );

    const divElement = container.querySelector('div');
    // data-* and aria-* should be preserved
    expect(divElement).toHaveAttribute('data-test-id', 'test123');
    expect(divElement).toHaveAttribute('aria-expanded', 'true');

    // Valid HTML attributes should be converted to camelCase
    expect(divElement).toHaveAttribute('tabIndex', '0');
    expect(divElement).toHaveAttribute('contentEditable', 'true');

    // Unknown kebab-case attributes should remain as-is
    expect(divElement).toHaveAttribute('custom-attr', 'value');

    expect(divElement).toBeInTheDocument();
  });

  it('should convert common HTML attributes', () => {
    const TestComponent = createHtmlComponent('div');
    const { container } = render(
      <TestComponent
        attributes={{
          contenteditable: 'true',
          tabindex: '0',
          spellcheck: 'false',
        }}
        element={{ type: 'div', children: [] }}
      />
    );

    const divElement = container.querySelector('div');
    expect(divElement).toHaveAttribute('contentEditable', 'true');
    expect(divElement).toHaveAttribute('tabIndex', '0');
    expect(divElement).toHaveAttribute('spellCheck', 'false');
  });

  it('should preserve data and aria attributes as-is', () => {
    const TestComponent = createHtmlComponent('div');
    const { container } = render(
      <TestComponent
        attributes={{
          'data-custom': 'value',
          'aria-label': 'Test Label',
          'data-multi-word': 'test',
        }}
        element={{ type: 'div', children: [] }}
      />
    );

    const divElement = container.querySelector('div');
    expect(divElement).toHaveAttribute('data-custom', 'value');
    expect(divElement).toHaveAttribute('aria-label', 'Test Label');
    expect(divElement).toHaveAttribute('data-multi-word', 'test');
  });
});
