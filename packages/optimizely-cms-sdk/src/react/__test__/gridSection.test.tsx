import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';

import { initReactComponentRegistry, OptimizelyGridSection } from '../server.js';
import { ExperienceNode } from '../../infer.js';

const structureNode = (
  nodeType: string,
  key: string,
  nodes: ExperienceNode[] = [],
): ExperienceNode => ({
  __typename: 'CompositionStructureNode',
  key,
  type: null,
  nodeType,
  layoutType: null,
  displayName: nodeType,
  displayTemplateKey: null,
  displaySettings: null,
  nodes,
});

function Row({ children }: { children?: React.ReactNode }) {
  return <div data-testid='row'>{children}</div>;
}

beforeEach(() => {
  initReactComponentRegistry({ resolver: {} });
});

describe('OptimizelyGridSection with an unrecognised structure node', () => {
  // Form containers nest their steps in structure nodes that are neither rows nor
  // columns. These fell through to `React.Fragment`, which was then handed `node`,
  // `index` and `displaySettings`, producing "Invalid prop `node` supplied to
  // `React.Fragment`" on every render.
  //
  // The assertion inspects the element rather than watching for the warning itself:
  // React only validates fragment props in its development JSX runtime, and vitest
  // compiles the SDK with the production one.
  const nodes = [structureNode('section', 'step-1', [structureNode('row', 'row-1')])];

  it('gives React.Fragment nothing but children', () => {
    const [element] = OptimizelyGridSection({ nodes, row: Row }) as React.ReactElement[];

    expect(element.type).toBe(React.Fragment);
    expect(Object.keys(element.props as object)).toEqual(['children']);
  });

  it('still renders the nodes nested inside it', () => {
    const { getByTestId } = render(<>{OptimizelyGridSection({ nodes, row: Row })}</>);

    expect(getByTestId('row')).toBeTruthy();
  });
});
