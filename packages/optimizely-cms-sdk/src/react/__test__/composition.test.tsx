import { beforeEach, describe, expect, test } from 'vitest';
import '@testing-library/jest-dom/vitest';

import { initReactComponentRegistry, OptimizelyComposition, type ComponentContainerProps } from '../server.js';
import type { ExperienceNode } from '../../infer.js';
import { renderServer } from './renderServer.js';

const editContext = { edit: true, preview_token: 'token' };

const componentNode = (key: string, extra: Record<string, unknown> = {}): ExperienceNode =>
  ({
    __typename: 'CompositionComponentNode',
    key,
    type: 'Card',
    nodeType: 'component',
    layoutType: null,
    displayName: 'Card',
    displayTemplateKey: null,
    displaySettings: [{ key: 'size', value: 'large' }],
    component: { __typename: 'Card', title: key },
    ...extra,
  }) as ExperienceNode;

function Card({ content, displaySettings }: { content: { title: string }; displaySettings?: object }) {
  return (
    <p data-testid='card' data-settings={JSON.stringify(displaySettings ?? null)}>
      {content.title}
    </p>
  );
}

beforeEach(() => initReactComponentRegistry({ resolver: { Card } }));

describe('OptimizelyComposition', () => {
  test('renders a placeholder for a node with no content type', async () => {
    const unknownNode: ExperienceNode = {
      __typename: 'CompositionStructureNode',
      key: 'unknown-1',
      type: null,
      nodeType: 'section',
      layoutType: null,
      displayName: 'Unknown',
      displayTemplateKey: null,
      displaySettings: null,
    };

    const { container } = await renderServer(<OptimizelyComposition nodes={[unknownNode]} />);

    expect(container).toHaveTextContent('???');
  });

  test('wraps a component node in a full-width block with its display settings', async () => {
    const { getByTestId } = await renderServer(<OptimizelyComposition nodes={[componentNode('card-1')]} />);
    const card = getByTestId('card');

    expect(card).toHaveTextContent('card-1');
    expect(card).toHaveAttribute('data-settings', '{"size":"large"}');
    expect(card.parentElement).toHaveStyle({ width: '100%', display: 'block' });
    expect(card.parentElement).not.toHaveAttribute('data-epi-block-id');
  });

  test('marks the default wrapper for the editor in edit mode', async () => {
    const node = componentNode('card-1', { __context: editContext });

    const { getByTestId } = await renderServer(<OptimizelyComposition nodes={[node]} />);

    expect(getByTestId('card').parentElement).toHaveAttribute('data-epi-block-id', 'card-1');
  });

  test('uses a custom ComponentWrapper with the node and display settings', async () => {
    const Wrapper = ({ node, displaySettings, children }: ComponentContainerProps) => (
      <article data-testid='wrapper' data-node={node.key} data-settings={JSON.stringify(displaySettings)}>
        {children}
      </article>
    );

    const { getByTestId } = await renderServer(
      <OptimizelyComposition nodes={[componentNode('card-1')]} ComponentWrapper={Wrapper} />,
    );

    expect(getByTestId('wrapper')).toHaveAttribute('data-node', 'card-1');
    expect(getByTestId('wrapper')).toHaveAttribute('data-settings', '{"size":"large"}');
    expect(getByTestId('wrapper')).toContainElement(getByTestId('card'));
  });

  test('renders every node in order', async () => {
    const { getAllByTestId } = await renderServer(
      <OptimizelyComposition nodes={[componentNode('first'), componentNode('second')]} />,
    );

    expect(getAllByTestId('card').map(it => it.textContent)).toEqual(['first', 'second']);
  });

  test('renders nothing for no nodes', async () => {
    const { container } = await renderServer(<OptimizelyComposition nodes={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
