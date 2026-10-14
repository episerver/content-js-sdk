import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import React from 'react';
import '@testing-library/jest-dom/vitest';

import {
  initReactComponentRegistry,
  OptimizelyGridSection,
  type ComponentContainerProps,
  type StructureContainerProps,
} from '../server.js';
import type { DisplaySettingsType, ExperienceNode } from '../../infer.js';
import { renderServer } from './renderServer.js';

const editContext = { edit: true, preview_token: 'token' };

const structureNode = (
  nodeType: string,
  key: string,
  nodes: ExperienceNode[] = [],
  extra: Partial<ExperienceNode> = {},
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
  ...extra,
});

const componentNode = (key: string, extra: Record<string, unknown> = {}): ExperienceNode =>
  ({
    __typename: 'CompositionComponentNode',
    key,
    type: 'Card',
    nodeType: 'component',
    layoutType: null,
    displayName: 'Card',
    displayTemplateKey: null,
    displaySettings: null,
    component: { __typename: 'Card', title: key },
    ...extra,
  }) as ExperienceNode;

const editableComponentNode = (key: string) =>
  componentNode(key, {
    __context: editContext,
    component: { __typename: 'Card', title: key, __context: editContext },
  });

function Card({ content, displaySettings }: { content: { title: string }; displaySettings?: object }) {
  return (
    <p data-testid='card' data-settings={JSON.stringify(displaySettings ?? null)}>
      {content.title}
    </p>
  );
}

function Row({ children }: { children?: React.ReactNode }) {
  return <div data-testid='row'>{children}</div>;
}

beforeEach(() => initReactComponentRegistry({ resolver: { Card } }));

describe('OptimizelyGridSection with an unrecognised structure node', () => {
  // Form containers nest their steps in structure nodes that are neither rows nor columns.
  const nodes = [structureNode('section', 'step-1', [structureNode('row', 'row-1')])];

  afterEach(() => vi.restoreAllMocks());

  test('renders its nested nodes without handing React.Fragment invalid props', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { getByTestId } = await renderServer(<OptimizelyGridSection nodes={nodes} row={Row} />);

    expect(getByTestId('row')).toBeInTheDocument();
    expect(consoleError.mock.calls.flat().join(' ')).not.toContain('React.Fragment');
  });
});

describe('OptimizelyGridSection containers', () => {
  function SingleChildRow({ children }: { children?: React.ReactNode }) {
    return <div data-testid='row'>{React.Children.only(children)}</div>;
  }

  function Column() {
    return <div data-testid='column' />;
  }

  test('pass a single child element to row and column containers', async () => {
    const nodes = [structureNode('row', 'row-1', [structureNode('column', 'col-1'), structureNode('column', 'col-2')])];

    const { getByTestId } = await renderServer(
      <OptimizelyGridSection nodes={nodes} row={SingleChildRow} column={Column} />,
    );

    expect(getByTestId('row').querySelectorAll('[data-testid="column"]')).toHaveLength(2);
  });

  test('forward index and parsed display settings to structure containers', async () => {
    const received: Pick<StructureContainerProps, 'index' | 'displaySettings'>[] = [];
    const RecordingRow = ({ index, displaySettings, children }: StructureContainerProps) => {
      received.push({ index, displaySettings });
      return <div>{children}</div>;
    };
    const settings: DisplaySettingsType[] = [
      { key: 'theme', value: 'dark' },
      { key: 'wide', value: 'true' },
    ];

    await renderServer(
      <OptimizelyGridSection
        nodes={[structureNode('row', 'row-1'), structureNode('row', 'row-2', [], { displaySettings: settings })]}
        row={RecordingRow}
      />,
    );

    expect(received).toEqual([
      { index: 0, displaySettings: undefined },
      { index: 1, displaySettings: { theme: 'dark', wide: true } },
    ]);
  });

  test('fall back to a flex row and column holding the components', async () => {
    const nodes = [structureNode('row', 'row-1', [structureNode('column', 'col-1', [componentNode('card-1')])])];

    const { getByTestId } = await renderServer(<OptimizelyGridSection nodes={nodes} />);
    const column = getByTestId('card').parentElement!;

    expect(getByTestId('card')).toHaveTextContent('card-1');
    expect(column).toHaveStyle({ flex: '1' });
    expect(column.parentElement).toHaveStyle({ display: 'flex' });
    expect(column).not.toHaveAttribute('data-epi-block-id');
  });

  test('mark the fallback row and column for the editor in edit mode', async () => {
    const nodes = [
      structureNode('row', 'row-1', [structureNode('column', 'col-1', [], { __context: editContext })], {
        __context: editContext,
      }),
    ];

    const { container } = await renderServer(<OptimizelyGridSection nodes={nodes} />);

    expect(container.querySelector('[data-epi-block-id="row-1"]')).toHaveStyle({ display: 'flex' });
    expect(container.querySelector('[data-epi-block-id="col-1"]')).toHaveStyle({ flex: '1' });
  });

  test('render nothing for no nodes', async () => {
    const { container } = await renderServer(<OptimizelyGridSection nodes={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe('OptimizelyGridSection components', () => {
  test('wrap the component itself in its preview attributes in edit mode', async () => {
    const { getByTestId } = await renderServer(<OptimizelyGridSection nodes={[editableComponentNode('card-1')]} />);

    expect(getByTestId('card').parentElement).toHaveAttribute('data-epi-block-id', 'card-1');
  });

  test('leave preview attributes to a ComponentWrapper when one is given', async () => {
    const Wrapper = ({ node, displaySettings, children }: ComponentContainerProps) => (
      <section data-testid='wrapper' data-node={node.key} data-settings={JSON.stringify(displaySettings)}>
        {children}
      </section>
    );
    const node = componentNode('card-1', {
      __context: editContext,
      displaySettings: [{ key: 'size', value: 'large' }],
      component: { __typename: 'Card', title: 'card-1', __context: editContext },
    });

    const { container, getByTestId } = await renderServer(
      <OptimizelyGridSection nodes={[node]} ComponentWrapper={Wrapper} />,
    );

    expect(getByTestId('wrapper')).toHaveAttribute('data-node', 'card-1');
    expect(getByTestId('wrapper')).toHaveAttribute('data-settings', '{"size":"large"}');
    expect(getByTestId('card')).toHaveAttribute('data-settings', '{"size":"large"}');
    expect(container.querySelector('[data-epi-block-id]')).toBeNull();
  });
});
