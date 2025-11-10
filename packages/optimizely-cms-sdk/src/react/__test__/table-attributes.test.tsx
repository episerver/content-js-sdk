import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { RichText } from '../richText/component.js';
import type { Node } from '../../components/richText/renderer.js';

// Mock RichText content with table and cellpadding/cellspacing attributes
const tableContent = {
  type: 'richText' as const,
  children: [
    {
      type: 'table',
      border: '1',
      cellpadding: '5',
      cellspacing: '10',
      width: '100%',
      children: [
        {
          type: 'tbody',
          children: [
            {
              type: 'tr',
              children: [
                {
                  type: 'th',
                  children: [
                    {
                      text: 'Header 1',
                    },
                  ],
                },
                {
                  type: 'th',
                  children: [
                    {
                      text: 'Header 2',
                    },
                  ],
                },
              ],
            },
            {
              type: 'tr',
              children: [
                {
                  type: 'td',
                  children: [
                    {
                      text: 'Cell 1',
                    },
                  ],
                },
                {
                  type: 'td',
                  children: [
                    {
                      text: 'Cell 2',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ] as Node[],
};

describe('Table Attributes', () => {
  it('should render table with cellpadding and cellspacing attributes correctly', () => {
    const { container } = render(<RichText content={tableContent} />);

    // Find the table element
    const tableElement = container.querySelector('table');
    expect(tableElement).toBeInTheDocument();

    // Check that the table has the correct attributes
    expect(tableElement).toHaveAttribute('border', '1');
    expect(tableElement).toHaveAttribute('cellPadding', '5');
    expect(tableElement).toHaveAttribute('cellSpacing', '10');
    expect(tableElement).toHaveAttribute('width', '100%');
  });

  it('should render table headers and cells correctly', () => {
    const { container } = render(<RichText content={tableContent} />);

    // Check for headers
    const headers = container.querySelectorAll('th');
    expect(headers).toHaveLength(2);
    expect(headers[0]).toHaveTextContent('Header 1');
    expect(headers[1]).toHaveTextContent('Header 2');

    // Check for cells
    const cells = container.querySelectorAll('td');
    expect(cells).toHaveLength(2);
    expect(cells[0]).toHaveTextContent('Cell 1');
    expect(cells[1]).toHaveTextContent('Cell 2');
  });
});
