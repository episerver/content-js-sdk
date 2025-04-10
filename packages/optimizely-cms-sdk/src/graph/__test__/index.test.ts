import { describe, expect, test } from 'vitest';
import { createQuery } from '..';
import { articlePage, callToAction, customImport, heroBlock } from './fixtures';

describe('createQuery', () => {
  test('simple content types', async () => {
    const result = await createQuery(callToAction.key, customImport);
    expect(result).toMatchInlineSnapshot(`
        "
        fragment CallToAction on CallToAction { label link }
        query FetchContent($filter: _ContentWhereInput) {
          _Content(where: $filter) {
            item {
              ...CallToAction
            }
          }
        }
          "
      `);
  });

  test('complex content types', async () => {
    const result = await createQuery(articlePage.key, customImport);
    expect(result).toMatchInlineSnapshot(`
      "
      fragment ArticlePage on ArticlePage { body { html, json } relatedArticle { url { type, default }} source { type, default } tags }
      query FetchContent($filter: _ContentWhereInput) {
        _Content(where: $filter) {
          item {
            ...ArticlePage
          }
        }
      }
        "
    `);
  });

  test('nested content types (one level)', async () => {
    const result = await createQuery(heroBlock.key, customImport);
    expect(result).toMatchInlineSnapshot(`
        "
        fragment CallToAction on CallToAction { label link }
        fragment Hero on Hero { heading callToAction { __typename ...CallToAction } }
        query FetchContent($filter: _ContentWhereInput) {
          _Content(where: $filter) {
            item {
              ...Hero
            }
          }
        }
          "
      `);
  });
});
