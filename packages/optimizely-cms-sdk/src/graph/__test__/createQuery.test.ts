import { beforeAll, describe, expect, test } from 'vitest';
import { createFragment, createQuery } from '../createQuery';
import { initContentTypeRegistry } from '../../model';
import {
  callToAction,
  heroBlock,
  landingPage,
  aboutPage,
  articlePage,
  allContentTypes,
  superHeroBlock,
  fAQPage,
  contactUsPage,
} from './fixtures';

beforeAll(() => {
  initContentTypeRegistry(allContentTypes);
});

describe('createFragment()', () => {
  test('works for simple properties', async () => {
    const result = await createFragment(callToAction.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment CallToAction on CallToAction { label link }",
      ]
    `);
  });

  test('works for components inside components', async () => {
    const result = await createFragment(heroBlock.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment CallToAction on CallToAction { label link }",
        "fragment myButton on myButton { label link }",
        "fragment Hero on Hero { heading callToAction { __typename ...CallToAction ...myButton } }",
      ]
    `);
  });

  test('works for components inside components (several levels) : landingPage', async () => {
    const result = await createFragment(landingPage.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment CallToAction on CallToAction { label link }",
        "fragment myButton on myButton { label link }",
        "fragment Hero on Hero { heading callToAction { __typename ...CallToAction ...myButton } }",
        "fragment SuperHero on SuperHero { heading embed_video callToAction { __typename ...CallToAction } }",
        "fragment SpecialHero on SpecialHero { heading primaryCallToAction { __typename ...CallToAction } callToAction { __typename ...CallToAction } }",
        "fragment LandingPage on LandingPage { hero { __typename ...Hero ...SuperHero ...SpecialHero } body { html, json } }",
      ]
    `);
  });

  test('works when the same reference is repeated', async () => {
    const result = await createFragment(superHeroBlock.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment CallToAction on CallToAction { label link }",
        "fragment SuperHero on SuperHero { heading embed_video callToAction { __typename ...CallToAction } }",
      ]
    `);
  });

  test('When contentType only has both allowedTypes and restrictedTypes', async () => {
    const result = await createFragment(aboutPage.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment CallToAction on CallToAction { label link }",
        "fragment myButton on myButton { label link }",
        "fragment Hero on Hero { heading callToAction { __typename ...CallToAction ...myButton } }",
        "fragment AboutPage on AboutPage { hero { __typename ...Hero } body { html, json } }",
      ]
    `);
  });

  test('When contentType only has only allowedTypes defined', async () => {
    const result = await createFragment(fAQPage.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment myButton on myButton { label link }",
        "fragment CallToAction on CallToAction { label link }",
        "fragment Hero on Hero { heading callToAction { __typename ...CallToAction ...myButton } }",
        "fragment SuperHero on SuperHero { heading embed_video callToAction { __typename ...CallToAction } }",
        "fragment fAQPage on fAQPage { hero { __typename ...myButton ...Hero ...SuperHero } body { html, json } }",
      ]
    `);
  });

  test('When contentType only has restrictedTypes (no allowedTypes) defined', async () => {
    const result = await createFragment(contactUsPage.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment CallToAction on CallToAction { label link }",
        "fragment SpecialHero on SpecialHero { heading primaryCallToAction { __typename ...CallToAction } callToAction { __typename ...CallToAction } }",
        "fragment myButton on myButton { label link }",
        "fragment Hero on Hero { heading callToAction { __typename ...CallToAction ...myButton } }",
        "fragment SuperHero on SuperHero { heading embed_video callToAction { __typename ...CallToAction } }",
        "fragment LandingPage on LandingPage { hero { __typename ...Hero ...SuperHero ...SpecialHero } body { html, json } }",
        "fragment ArticlePage on ArticlePage { body { html, json } relatedArticle { url { type, default }} source { type, default } tags }",
        "fragment AboutPage on AboutPage { hero { __typename ...Hero } body { html, json } }",
        "fragment AboutContent on AboutContent { heading embed_video callToAction { __typename ...CallToAction ...myButton } }",
        "fragment fAQPage on fAQPage { hero { __typename ...myButton ...Hero ...SuperHero } body { html, json } }",
        "fragment contactUsPage on contactUsPage { others { __typename ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...AboutPage ...AboutContent ...fAQPage } body { html, json } }",
      ]
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
      fragment myButton on myButton { label link }
      fragment Hero on Hero { heading callToAction { __typename ...CallToAction ...myButton } }
      query FetchContent($filter: _ContentWhereInput) {
        _Content(where: $filter) {
          item {
            __typename
            ...Hero
          }
        }
      }
        "
    `);
  });

  test('nested content types (several levels)', async () => {
    const result = await createQuery(landingPage.key);
    expect(result).toMatchInlineSnapshot(`
      "
      fragment CallToAction on CallToAction { label link }
      fragment myButton on myButton { label link }
      fragment Hero on Hero { heading callToAction { __typename ...CallToAction ...myButton } }
      fragment SuperHero on SuperHero { heading embed_video callToAction { __typename ...CallToAction } }
      fragment SpecialHero on SpecialHero { heading primaryCallToAction { __typename ...CallToAction } callToAction { __typename ...CallToAction } }
      fragment LandingPage on LandingPage { hero { __typename ...Hero ...SuperHero ...SpecialHero } body { html, json } }
      query FetchContent($filter: _ContentWhereInput) {
        _Content(where: $filter) {
          item {
            __typename
            ...LandingPage
          }
        }
      }
        "
    `);
  });
});
