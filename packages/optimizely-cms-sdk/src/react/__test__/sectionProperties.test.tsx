import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { initReactComponentRegistry, OptimizelyComposition } from '../server.js';
import { ExperienceNode } from '../../infer.js';

function HeroSection({ content }: { content: any }) {
  return (
    <div data-testid="section">
      {content.heading}|{content.key}|{content.nodes?.length ?? 0}
    </div>
  );
}

beforeEach(() => {
  initReactComponentRegistry({ resolver: { HeroSection } });
});

describe('Section nodes', () => {
  it('exposes the section properties directly on `content`', async () => {
    const node: ExperienceNode = {
      __typename: 'CompositionStructureNode',
      key: 'section-1',
      type: 'HeroSection',
      nodeType: 'section',
      layoutType: null,
      displayName: 'Hero',
      displayTemplateKey: null,
      displaySettings: null,
      component: { __typename: 'HeroSection', heading: 'Welcome' },
      nodes: [],
    };

    // `OptimizelyComponent` is an async server component, so resolve it before rendering
    const [element] = OptimizelyComposition({ nodes: [node] }) as any[];
    const { getByTestId } = render(await element.type(element.props));

    // properties are flat (`content.heading`), node fields are preserved
    expect(getByTestId('section')).toHaveTextContent('Welcome|section-1|0');
  });
});
