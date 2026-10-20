import { describe, it, expect } from 'vitest';
import { contract, contentType, initContentTypeRegistry } from '../../model/index.js';
import { createFragment } from '../createQuery.js';

const TeaserContract = contract({
  key: 'TeaserContract',
  displayName: 'Teaser Contract',
  properties: { heading: { type: 'string' } },
});

const TeaserCT = contentType({
  baseType: '_component',
  key: 'Teaser',
  displayName: 'Teaser',
  extends: [TeaserContract],
  properties: { body: { type: 'string' } },
});

const TeaserPage = contentType({
  baseType: '_page',
  key: 'TeaserPage',
  displayName: 'Teaser Page',
  properties: { main: { type: 'content', allowedTypes: [TeaserCT] } },
});

describe('contracts an app did not register itself', () => {
  it('resolves the contract fragment of an extended, unregistered contract', () => {
    initContentTypeRegistry([TeaserCT, TeaserPage]);

    const fragments = createFragment('TeaserPage').fragments;

    expect(fragments).toContain(
      'fragment TeaserContract on ITeaserContract { __typename TeaserContract__heading:heading ..._IContent }',
    );
  });

  it('keeps the registered contract when the app lists it explicitly', () => {
    initContentTypeRegistry([TeaserContract, TeaserCT, TeaserPage]);

    const fragments = createFragment('TeaserPage').fragments;

    expect(
      fragments.filter(it => it.startsWith('fragment TeaserContract ')),
    ).toHaveLength(1);
  });
});
