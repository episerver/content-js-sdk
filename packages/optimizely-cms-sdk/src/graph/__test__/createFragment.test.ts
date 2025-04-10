import { describe, expect, test } from 'vitest';
import { createFragment } from '../createFragment';
import { callToAction, heroBlock, landingPage, customImport } from './fixtures';

describe('createFragment()', () => {
  test('works for simple properties', async () => {
    const result = await createFragment(callToAction.key, customImport);
    expect(result).toMatchInlineSnapshot(`
      "
      fragment CallToAction on CallToAction { label link }"
    `);
  });

  test('works for components inside components', async () => {
    const result = await createFragment(heroBlock.key, customImport);
    expect(result).toMatchInlineSnapshot(`
      "
      fragment CallToAction on CallToAction { label link }
      fragment Hero on Hero { heading callToAction { __typename ...CallToAction } }"
    `);
  });

  test('works for components inside components (several levels)', async () => {
    const result = await createFragment(landingPage.key, customImport);
    expect(result).toMatchInlineSnapshot(`
      "
      fragment CallToAction on CallToAction { label link }
      fragment Hero on Hero { heading callToAction { __typename ...CallToAction } },
      fragment CallToAction on CallToAction { label link }
      fragment SuperHero on SuperHero { heading embed_video callToAction { __typename ...CallToAction } }
      fragment LandingPage on LandingPage { hero { __typename ...Hero ...SuperHero } body { html, json } }"
    `);
  });
});
