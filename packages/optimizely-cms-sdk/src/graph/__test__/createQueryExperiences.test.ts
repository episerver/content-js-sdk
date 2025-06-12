import { beforeAll, describe, expect, test } from 'vitest';
import {
  allContentTypes,
  MyExperience,
} from './createQueryExperiences.fixtures';
import { initContentTypeRegistry } from '../../model';
import { createFragment } from '../createQuery';

beforeAll(() => {
  initContentTypeRegistry(allContentTypes);
});

describe('createFragment()', () => {
  test('for experience types', async () => {
    const result = await createFragment(MyExperience.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment _IExperience on _IExperience { composition {...ICompositionNode }}",
        "fragment ICompositionNode on ICompositionNode { __typename key type nodeType displayName displayTemplateKey displaySettings {key value} ...on CompositionStructureNode { nodes @recursive } ...on CompositionComponentNode { nodeType component { ..._IComponent } } }",
        "fragment CallToAction on CallToAction { label link }",
        "fragment ExpSection on ExpSection { heading }",
        "fragment _IComponent on _IComponent { __typename ...CallToAction ...ExpSection }",
        "fragment MyExperience on MyExperience { ..._IExperience }",
      ]
    `);
  });
});
