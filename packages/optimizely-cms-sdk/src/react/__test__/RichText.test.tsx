import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { RichText } from '../richText/component.js';
import {
  simpleTextContent,
  mockRichTextContent,
  htmlEntitiesContent,
  unknownElementContent,
  markedTextContent,
} from './mockData.js';

describe('RichText Component', () => {
  it('should render simple text content', () => {
    render(<RichText content={simpleTextContent} />);
    expect(screen.getByText('Hello, World!')).toBeInTheDocument();
  });

  it('should render different elements correctly', () => {
    render(<RichText content={mockRichTextContent} />);

    // Check for different elements
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Main Heading'
    );
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveTextContent('This is a link');
    expect(screen.getByText('bold text').tagName.toLowerCase()).toBe('strong');
  });

  it('should handle empty/null content gracefully', () => {
    render(<RichText content={null as any} />);
    // Should not throw errors
    expect(document.body.firstChild?.firstChild).toBe(null);
  });

  it('should decode HTML entities by default', () => {
    render(<RichText content={htmlEntitiesContent} />);
    // Should decode HTML entities
    expect(
      screen.getByText('Text with <HTML> entities & symbols')
    ).toBeInTheDocument();
  });

  it('should handle unknown elements with fallback', () => {
    render(<RichText content={unknownElementContent} />);
    // Should fallback to div and render content
    expect(screen.getByText('Content in unknown element')).toBeInTheDocument();
  });

  it('should render text with various formatting marks', () => {
    render(<RichText content={markedTextContent} />);

    // Check for different text formatting
    expect(screen.getByText('bold text').tagName.toLowerCase()).toBe('strong');
    expect(screen.getByText('italic text').tagName.toLowerCase()).toBe('em');
    expect(screen.getByText('underlined text').tagName.toLowerCase()).toBe('u');
    expect(screen.getByText('code text').tagName.toLowerCase()).toBe('code'); // Fixed: now correctly renders as <code>
    expect(screen.getByText('strikethrough text').tagName.toLowerCase()).toBe(
      's'
    );
  });
});
