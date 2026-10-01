import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

import { initReactComponentRegistry, OptimizelyComposition } from '../server.js';
import { ExperienceNode, ExperienceStructureNode } from '../../infer.js';

/**
 * A custom composition property holds the same node tree the built-in
 * `composition` does, so it renders through the same pipeline: hand
 * `OptimizelyComposition` the property's `nodes`.
 */

const componentNode = (key: string, typename: string): ExperienceNode => ({
  __typename: 'CompositionComponentNode',
  key,
  type: typename,
  nodeType: 'component',
  layoutType: null,
  displayName: key,
  displayTemplateKey: null,
  displaySettings: null,
  component: { __typename: typename, heading: `heading-${key}` },
});

/** The shape a `type: 'composition'` property infers to. */
const structureNode = (
  key: string,
  nodes: ExperienceNode[],
  nodeType = 'grid',
): ExperienceStructureNode => ({
  __typename: 'CompositionStructureNode',
  key,
  type: null,
  nodeType,
  layoutType: null,
  displayName: key,
  displayTemplateKey: null,
  displaySettings: null,
  nodes,
});

function Card({ content }: { content: { heading: string } }) {
  return <div data-testid='card'>{content.heading}</div>;
}

beforeEach(() => {
  initReactComponentRegistry({ resolver: { CardElement: Card } });
});

describe('rendering a composition property', () => {
  const sidebar = structureNode('sidebar-root', [
    componentNode('a', 'CardElement'),
    componentNode('b', 'CardElement'),
  ]);

  it('renders its nodes through the built-in pipeline', async () => {
    const wrappers = OptimizelyComposition({ nodes: sidebar.nodes ?? [] }) as any[];

    expect(wrappers).toHaveLength(2);

    // `OptimizelyComponent` is an async server component, so resolve it before rendering
    const headings: (string | null)[] = [];
    for (const wrapper of wrappers) {
      const inner = wrapper.props.children;
      const { container } = render(await inner.type(inner.props));

      headings.push(container.querySelector('[data-testid="card"]')?.textContent ?? null);
    }

    expect(headings).toEqual(['heading-a', 'heading-b']);
  });

  it('renders nothing when the property is empty', () => {
    const { container } = render(<>{OptimizelyComposition({ nodes: [] })}</>);

    expect(container.textContent).toBe('');
  });
});

/**
 * A `format: 'grid'` composition has no section level — the CMS hands back
 * `experience → row → column → component`, where rows and columns carry no
 * content type of their own. They must render as a grid, not as unknown nodes.
 */
describe('rendering a grid composition property', () => {
  const sidebar = structureNode('sidebar-root', [
    structureNode(
      'row-1',
      [structureNode('col-1', [componentNode('a', 'CardElement')], 'column')],
      'row',
    ),
  ]);

  it('renders the components inside its rows and columns', async () => {
    const [grid] = OptimizelyComposition({ nodes: sidebar.nodes ?? [] }) as any[];

    // `OptimizelyGridSection` returns the row container; walk down to the component
    const [row] = grid.type(grid.props);
    const column = row.props.children.props.children[0];
    const inner = column.props.children.props.children[0].props.children;

    const { container } = render(await inner.type(inner.props));

    expect(container.querySelector('[data-testid="card"]')?.textContent).toBe('heading-a');
  });

  it('still reports a structure node it cannot place', () => {
    const odd = structureNode('odd', [componentNode('a', 'CardElement')], 'somethingElse');
    const { container } = render(<>{OptimizelyComposition({ nodes: [odd] })}</>);

    expect(container.textContent).toBe('???');
  });
});
