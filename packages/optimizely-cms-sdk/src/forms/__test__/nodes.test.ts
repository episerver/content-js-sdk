import { describe, expect, test } from 'vitest';
import { isFormButtonNode, partitionFormNodes } from '../nodes.js';
import type { ExperienceNode } from '../../infer.js';

const base = {
  __typename: 'CompositionStructureNode',
  type: null,
  layoutType: null,
  displayName: '',
  displayTemplateKey: null,
  displaySettings: null,
};

const row = (key: string, nodes: ExperienceNode[]): ExperienceNode =>
  ({ ...base, key, nodeType: 'row', nodes }) as ExperienceNode;

const component = (key: string, typename: string): ExperienceNode =>
  ({
    ...base,
    __typename: 'CompositionComponentNode',
    key,
    nodeType: 'component',
    component: { __typename: typename },
  }) as ExperienceNode;

const keysOf = (nodes: ExperienceNode[]) => nodes.map(n => n.key);

describe('isFormButtonNode', () => {
  test('matches a submit element wrapped in a component node', () => {
    expect(isFormButtonNode(component('b', 'OptiFormsSubmitElement'))).toBe(true);
  });

  test('ignores other elements and structure nodes', () => {
    expect(isFormButtonNode(component('t', 'OptiFormsTextboxElement'))).toBe(false);
    expect(isFormButtonNode(row('r', []))).toBe(false);
  });

  // The node's own __typename is CompositionComponentNode, never the content type,
  // so reading it off the node instead of its component matches nothing at all.
  test('does not look at the node typename', () => {
    const node = {
      ...base,
      key: 'x',
      nodeType: 'component',
      __typename: 'OptiFormsSubmitElement',
      component: { __typename: 'OptiFormsTextboxElement' },
    } as ExperienceNode;

    expect(isFormButtonNode(node)).toBe(false);
  });
});

describe('partitionFormNodes', () => {
  test('lifts buttons out of nested rows, keeping author order', () => {
    const tree = [
      row('r1', [component('name', 'OptiFormsTextboxElement')]),
      row('r2', [component('prev', 'OptiFormsSubmitElement')]),
      row('r3', [component('submit', 'OptiFormsSubmitElement')]),
    ];

    const { content, buttons } = partitionFormNodes(tree);

    expect(keysOf(buttons)).toEqual(['prev', 'submit']);
    expect(keysOf(content)).toEqual(['r1']);
  });

  test('keeps fields that share a row with a button', () => {
    const tree = [
      row('r1', [
        component('email', 'OptiFormsTextboxElement'),
        component('submit', 'OptiFormsSubmitElement'),
      ]),
    ];

    const { content, buttons } = partitionFormNodes(tree);

    expect(keysOf(buttons)).toEqual(['submit']);
    expect(keysOf(content)).toEqual(['r1']);
    expect(keysOf((content[0] as { nodes: ExperienceNode[] }).nodes)).toEqual(['email']);
  });

  test('does not mutate the nodes it is given', () => {
    const tree = [
      row('r1', [
        component('email', 'OptiFormsTextboxElement'),
        component('submit', 'OptiFormsSubmitElement'),
      ]),
    ];

    partitionFormNodes(tree);

    expect(keysOf((tree[0] as { nodes: ExperienceNode[] }).nodes)).toEqual([
      'email',
      'submit',
    ]);
  });

  test('finds buttons nested several levels down', () => {
    const tree = [row('r1', [row('c1', [component('submit', 'OptiFormsSubmitElement')])])];

    const { content, buttons } = partitionFormNodes(tree);

    expect(keysOf(buttons)).toEqual(['submit']);
    // The row and column held nothing else, so they would render as empty gaps.
    expect(content).toEqual([]);
  });

  test('leaves a form with no buttons untouched', () => {
    const tree = [row('r1', [component('name', 'OptiFormsTextboxElement')])];

    const { content, buttons } = partitionFormNodes(tree);

    expect(buttons).toEqual([]);
    expect(content).toEqual(tree);
  });
});

describe('getFormButtonRole', () => {
  // A server component needs this to align a button footer, so it must work
  // without React. `useFormButton` is a client hook and cannot be called there.
  test('reads the role from a label without any React involvement', async () => {
    const { getFormButtonRole } = await import('../buttonRole.js');

    expect(getFormButtonRole({ Label: 'Next' })).toBe('next');
    expect(getFormButtonRole({ Label: '  PREVIOUS ' })).toBe('previous');
    expect(getFormButtonRole({ Label: 'Send' })).toBe('submit');
    expect(getFormButtonRole({ Label: 'Tillbaka' }, { labels: { previous: ['tillbaka'] } })).toBe(
      'previous',
    );
  });
});
