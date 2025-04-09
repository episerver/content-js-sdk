import { describe, expect, test } from 'vitest';
import { createFragment } from '../createFragment';
import { callToAction, heroBlock, landingPage } from './fixtures';

describe('createFragment()', () => {
  test('works for simple properties', () => {
    const result = createFragment(callToAction);
    expect(result).toMatchInlineSnapshot(`
      "
      fragment CallToAction on CallToAction { label link }"
    `);
  });

  test('works for components inside components', () => {
    const result = createFragment(heroBlock);
    expect(result).toMatchInlineSnapshot(`
      "
      fragment CallToAction on CallToAction { label link }
      fragment Hero on Hero { heading callToAction { __typename ...CallToAction } }"
    `);
  });

  test('works for components inside components (several levels)', () => {
    const result = createFragment(landingPage);
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
