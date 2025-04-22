import { beforeAll, describe, expect, test } from 'vitest';
import { createFragment, createQuery } from '../createQuery';
import { initContentTypeRegistry } from '../../model';
import {
  callToAction,
  heroBlock,
  landingPage,
  articlePage,
  allContentTypes,
} from './fixtures';

beforeAll(() => {
  initContentTypeRegistry(allContentTypes);
});

describe('createFragment()', () => {
  test('works for simple properties', async () => {
    const result = await createFragment(callToAction.key);
    expect(result).toMatchInlineSnapshot(`
      "
      fragment CallToAction on CallToAction { label link }"
    `);
  });

  test('works for components inside components', async () => {
    const result = await createFragment(heroBlock.key);
    expect(result).toMatchInlineSnapshot(`
      "
      fragment CallToAction on CallToAction { label link }
      fragment Hero on Hero { heading callToAction { __typename ...CallToAction } }"
    `);
  });

  test('works for components inside components (several levels)', async () => {
    const result = await createFragment(landingPage.key);
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

describe('createQuery', () => {
  test('simple content types', async () => {
    const result = await createQuery(callToAction.key);
    expect(result).toMatchInlineSnapshot(`
        "
        fragment CallToAction on CallToAction { label link }
        query FetchContent($filter: _ContentWhereInput) {
          _Content(where: $filter) {
            item {
              __typename
              ...CallToAction
            }
          }
        }
      }
        "
    `);
  });

  test('complex content types', async () => {
    const result = await createQuery(articlePage.key);
    expect(result).toMatchInlineSnapshot(`
      "
      fragment ArticlePage on ArticlePage { body { html, json } relatedArticle { url { type, default }} source { type, default } tags }
      query FetchContent($filter: _ContentWhereInput) {
        _Content(where: $filter) {
          item {
            __typename
            ...ArticlePage
          }
        }
      }
        "
    `);
  });

  test('nested content types (one level)', async () => {
    const result = await createQuery(heroBlock.key);
    expect(result).toMatchInlineSnapshot(`
        "
        fragment CallToAction on CallToAction { label link }
        fragment Hero on Hero { heading callToAction { __typename ...CallToAction } }
        query FetchContent($filter: _ContentWhereInput) {
          _Content(where: $filter) {
            item {
              __typename
              ...Hero
            }
          }
        }
      }
        "
    `);
  });
});
