import { describe, expect, test } from 'vitest';
import { createQuery, parseResponse } from '..';
import { articlePage, callToAction, heroBlock, landingPage } from './fixtures';

describe('createQuery', () => {
  test('simple content types', () => {
    expect(createQuery(callToAction)).toMatchInlineSnapshot(`
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

  test('complex content types', () => {
    expect(createQuery(articlePage)).toMatchInlineSnapshot(`
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

  test('nested content types (one level)', () => {
    expect(createQuery(heroBlock)).toMatchInlineSnapshot(`
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

describe('parseResponse', () => {
  test('parses simple properties correctly', () => {
    const response = { label: 'click here', link: 'https://example.com' };
    expect(parseResponse(callToAction, response)).toEqual(response);
  });

  test('returns excess properties', () => {
    const response = {
      label: 'click here',
      link: 'https://example.com',
      metadata: 12345,
    };
    expect(parseResponse(callToAction, response)).toEqual(response);
  });

  test('handle missing fields', () => {
    const response = {
      label: 'click here',
      linka: 'https://nothing.com',
    };

    expect(parseResponse(callToAction, response)).toEqual({
      label: 'click here',
      link: undefined,
      linka: 'https://nothing.com',
    });
  });

  test('handles nested fragments', () => {
    const response = {
      heading: 'Example',
      callToAction: [
        {
          __typename: 'CallToAction',
          label: 'Click here',
          link: 'https://example.com',
        },
      ],
    };

    expect(parseResponse(heroBlock, response)).toEqual({
      callToAction: [
        {
          __typename: 'CallToAction',
          __viewname: 'CallToAction',
          label: 'Click here',
          link: 'https://example.com',
        },
      ],
      heading: 'Example',
    });
  });

  test('resolves to null if fragment is not found', () => {
    const response = {
      heading: 'Example',
      callToAction: [
        {
          __typename: 'NON-EXISTENT-COMPONENT',
          label: 'Click here',
          link: 'https://example.com',
        },
      ],
    };

    expect(parseResponse(heroBlock, response)).toEqual({
      callToAction: [null],
      heading: 'Example',
    });
  });

  test('handles several levels', () => {
    const response = {
      hero: {
        __typename: 'SuperHero',
        heading: 'Welcome',
        embed_video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        callToAction: [
          {
            __typename: 'CallToAction',
            label: 'Click here',
            link: 'https://example.com',
          },
          {
            __typename: 'CallToAction',
            label: 'Dont click here',
            link: 'https://example.com',
          },
        ],
      },
    };

    expect(parseResponse(landingPage, response)).toEqual({
      body: undefined,
      hero: {
        __typename: 'SuperHero',
        __viewname: 'SuperHero',
        callToAction: [
          {
            __typename: 'CallToAction',
            __viewname: 'CallToAction',
            label: 'Click here',
            link: 'https://example.com',
          },
          {
            __typename: 'CallToAction',
            __viewname: 'CallToAction',
            label: 'Dont click here',
            link: 'https://example.com',
          },
        ],
        embed_video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        heading: 'Welcome',
      },
    });
  });
});
