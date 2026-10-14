import { describe, expect, test, beforeEach } from 'vitest';
import { renderServer } from './renderServer.js';
import {
  initReactComponentRegistry,
  OptimizelyGridSection,
  getPreviewUtils,
} from '../server.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';
import type { ExperienceNode } from '../../infer.js';

/**
 * The CMS editor needs two kinds of marker: `data-epi-block-id` to select a
 * block, and `data-epi-edit` to open a property. The first is added by
 * `OptimizelyComponent`; the second has to come from the component itself, which
 * for a form field means a client component reading `__context`.
 */

const editContext = { edit: true, preview_token: 'token' };

const FieldType = contentType({
  key: 'Field',
  displayName: 'Field',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: { Label: { type: 'string' } },
});

/** Stands in for a form field: marks its label editable, as the real ones do. */
function Field({ content }: { content: any }) {
  const { pa } = getPreviewUtils(content);
  return (
    <label data-testid='label' {...pa('Label')}>
      {content.Label}
    </label>
  );
}

const componentNode = (key: string): ExperienceNode =>
  ({
    __typename: 'CompositionComponentNode',
    key,
    type: 'Field',
    nodeType: 'component',
    layoutType: null,
    displayName: 'Field',
    displayTemplateKey: null,
    displaySettings: null,
    __context: editContext,
    component: { __typename: 'Field', Label: 'Your name', __context: editContext },
  }) as never;

beforeEach(() => {
  initContentTypeRegistry([FieldType]);
  initReactComponentRegistry({ resolver: { Field } });
});

/** Renders one composition node the way a form step does. */
const renderNode = (node: ExperienceNode) => renderServer(<OptimizelyGridSection nodes={[node]} />);

describe('preview attributes on a form field', () => {
  test('marks the block so the editor can select it', async () => {
    const { container } = await renderNode(componentNode('block-1'));

    expect(container.querySelector('[data-epi-block-id="block-1"]')).not.toBeNull();
  });

  test('marks the property so the editor can open it', async () => {
    const { getByTestId } = await renderNode(componentNode('block-1'));

    expect(getByTestId('label').getAttribute('data-epi-edit')).toBe('Label');
  });

  test('adds nothing outside edit mode', async () => {
    const node = componentNode('block-1') as any;
    node.__context = { edit: false, preview_token: '' };
    node.component.__context = { edit: false, preview_token: '' };

    const { container, getByTestId } = await renderNode(node);

    expect(container.querySelector('[data-epi-block-id]')).toBeNull();
    expect(getByTestId('label').hasAttribute('data-epi-edit')).toBe(false);
  });
});
