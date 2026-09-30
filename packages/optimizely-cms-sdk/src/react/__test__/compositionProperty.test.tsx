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
): ExperienceStructureNode => ({
  __typename: 'CompositionStructureNode',
  key,
  type: null,
  nodeType: 'grid',
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
