import React from 'react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';

import { toReactProps } from '../richText/lib.js';

describe('Dual-purpose attribute handling', () => {
  it('should handle border as HTML attribute for table elements', () => {
    const tableProps = toReactProps({ border: '1' }, 'table');
    expect(tableProps.border).toBe('1');
    expect(tableProps.style).toBeUndefined();
  });

  it('should handle border as CSS property for non-table elements', () => {
    const divProps = toReactProps({ border: '1px solid black' }, 'div');
    expect(divProps.border).toBeUndefined();
    expect((divProps.style as any)?.border).toBe('1px solid black');
  });

  it('should handle width as HTML attribute for img elements', () => {
    const imgProps = toReactProps({ width: '100' }, 'img');
    expect(imgProps.width).toBe('100');
    expect(imgProps.style).toBeUndefined();
  });

  it('should handle width as CSS property for div elements', () => {
    const divProps = toReactProps({ width: '100px' }, 'div');
    expect(divProps.width).toBeUndefined();
    expect((divProps.style as any)?.width).toBe('100px');
  });

  it('should handle height as HTML attribute for canvas elements', () => {
    const canvasProps = toReactProps({ height: '200' }, 'canvas');
    expect(canvasProps.height).toBe('200');
    expect(canvasProps.style).toBeUndefined();
  });

  it('should handle height as CSS property for paragraph elements', () => {
    const pProps = toReactProps({ height: '50px' }, 'p');
    expect(pProps.height).toBeUndefined();
    expect((pProps.style as any)?.height).toBe('50px');
  });
});
