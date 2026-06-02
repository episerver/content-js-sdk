import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { initReactComponentRegistry, OptimizelyComponent } from '../server.js';
import { init as initDisplayTemplateRegistry } from '../../model/displayTemplateRegistry.js';
import { DisplayTemplate } from '../../model/displayTemplates.js';

function DefaultExperience() {
  return <div data-testid="component">default</div>;
}

function VariantExperience() {
  return <div data-testid="component">variant</div>;
}

const heroDisplayTemplate: DisplayTemplate = {
  __type: 'displayTemplate',
  key: 'HeroLayout',
  displayName: 'Hero Layout',
  isDefault: false,
  settings: {},
  tag: 'hero',
};

beforeEach(() => {
  initDisplayTemplateRegistry([heroDisplayTemplate]);

  initReactComponentRegistry({
    resolver: {
      TestingExperience: {
        default: DefaultExperience,
        tags: {
          hero: VariantExperience,
        },
      },
    },
  });
});

describe('Experience display template tag resolution', () => {
  it('renders default component when no display template is set', async () => {
    const content = {
      __typename: 'TestingExperience',
      _metadata: { types: ['TestingExperience'], displayOption: null },
      composition: {
        __typename: 'CompositionStructureNode',
        key: 'root',
        type: null,
        layoutType: null,
        displayName: 'Root',
        displayTemplateKey: null,
        displaySettings: null,
      },
    };

    const { getByTestId } = render(await OptimizelyComponent({ content }));
    expect(getByTestId('component')).toHaveTextContent('default');
  });

  it('renders tagged variant when composition root has displayTemplateKey', async () => {
    const content = {
      __typename: 'TestingExperience',
      _metadata: { types: ['TestingExperience'], displayOption: null },
      composition: {
        __typename: 'CompositionStructureNode',
        key: 'root',
        type: null,
        layoutType: null,
        displayName: 'Root',
        displayTemplateKey: 'HeroLayout',
        displaySettings: null,
      },
    };

    const { getByTestId } = render(await OptimizelyComponent({ content }));
    expect(getByTestId('component')).toHaveTextContent('variant');
  });

  it('renders tagged variant via _metadata.displayOption', async () => {
    const content = {
      __typename: 'TestingExperience',
      _metadata: { types: ['TestingExperience'], displayOption: 'HeroLayout' },
    };

    const { getByTestId } = render(await OptimizelyComponent({ content }));
    expect(getByTestId('component')).toHaveTextContent('variant');
  });

  it('_metadata.displayOption takes priority over composition.displayTemplateKey', async () => {
    initDisplayTemplateRegistry([
      heroDisplayTemplate,
      {
        __type: 'displayTemplate',
        key: 'OtherLayout',
        displayName: 'Other',
        isDefault: false,
        settings: {},
        tag: 'other',
      },
    ]);

    initReactComponentRegistry({
      resolver: {
        TestingExperience: {
          default: DefaultExperience,
          tags: {
            hero: VariantExperience,
            other: () => <div data-testid="component">other</div>,
          },
        },
      },
    });

    const content = {
      __typename: 'TestingExperience',
      _metadata: { types: ['TestingExperience'], displayOption: 'OtherLayout' },
      composition: {
        __typename: 'CompositionStructureNode',
        key: 'root',
        type: null,
        layoutType: null,
        displayName: 'Root',
        displayTemplateKey: 'HeroLayout',
        displaySettings: null,
      },
    };

    const { getByTestId } = render(await OptimizelyComponent({ content }));
    expect(getByTestId('component')).toHaveTextContent('other');
  });

  it('__tag takes priority over composition.displayTemplateKey', async () => {
    const content = {
      __typename: 'TestingExperience',
      __tag: 'hero',
      _metadata: { types: ['TestingExperience'], displayOption: null },
      composition: {
        __typename: 'CompositionStructureNode',
        key: 'root',
        type: null,
        layoutType: null,
        displayName: 'Root',
        displayTemplateKey: null,
        displaySettings: null,
      },
    };

    const { getByTestId } = render(await OptimizelyComponent({ content }));
    expect(getByTestId('component')).toHaveTextContent('variant');
  });

  it('tag prop takes priority over all other sources', async () => {
    const content = {
      __typename: 'TestingExperience',
      _metadata: { types: ['TestingExperience'], displayOption: null },
      composition: {
        __typename: 'CompositionStructureNode',
        key: 'root',
        type: null,
        layoutType: null,
        displayName: 'Root',
        displayTemplateKey: null,
        displaySettings: null,
      },
    };

    const { getByTestId } = render(
      await OptimizelyComponent({ content, tag: 'hero' }),
    );
    expect(getByTestId('component')).toHaveTextContent('variant');
  });
});
