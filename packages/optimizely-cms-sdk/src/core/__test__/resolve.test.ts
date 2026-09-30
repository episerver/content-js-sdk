import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { init as initDisplayTemplates } from '../../model/displayTemplateRegistry.js';
import { ComponentRegistry } from '../../render/componentRegistry.js';
import { initComponentRegistry, resetComponentRegistry } from '../render/registry.js';
import {
  resolveContentComponent,
  resolveTag,
  splitPreviewAttrs,
  type OptimizelyContent,
} from '../render/resolve.js';

const template = (key: string, tag: string) =>
  ({
    __type: 'displayTemplate',
    key,
    displayName: key,
    isDefault: false,
    tag,
    baseType: '_component',
  }) as const;

beforeEach(() => {
  initDisplayTemplates([
    template('fromKey', 'keyTag'),
    template('fromComposition', 'compositionTag'),
    template('fromDisplayOption', 'optionTag'),
  ]);
});

afterEach(() => {
  initDisplayTemplates([]);
  resetComponentRegistry();
});

describe('resolveTag', () => {
  test('an explicit tag wins over everything the content carries', () => {
    const content: OptimizelyContent = {
      __typename: 'Hero',
      __tag: 'contentTag',
      displayTemplateKey: 'fromKey',
    };

    expect(resolveTag(content, 'explicit')).toBe('explicit');
  });

  test("the content's own tag wins over any display template", () => {
    const content: OptimizelyContent = {
      __typename: 'Hero',
      __tag: 'contentTag',
      displayTemplateKey: 'fromKey',
    };

    expect(resolveTag(content)).toBe('contentTag');
  });

  test('displayOption is consulted before either composition key', () => {
    const content: OptimizelyContent = {
      __typename: 'Hero',
      _metadata: { displayOption: 'fromDisplayOption' },
      composition: { displayTemplateKey: 'fromComposition' } as never,
      displayTemplateKey: 'fromKey',
    };

    expect(resolveTag(content)).toBe('optionTag');
  });

  test('composition is consulted before the content\'s own key', () => {
    const content: OptimizelyContent = {
      __typename: 'Hero',
      composition: { displayTemplateKey: 'fromComposition' } as never,
      displayTemplateKey: 'fromKey',
    };

    expect(resolveTag(content)).toBe('compositionTag');
  });

  test('__composition stands in for composition', () => {
    const content: OptimizelyContent = {
      __typename: 'Hero',
      __composition: { displayTemplateKey: 'fromComposition' } as never,
      displayTemplateKey: 'fromKey',
    };

    expect(resolveTag(content)).toBe('compositionTag');
  });

  test('a key with no template registered resolves to no tag', () => {
    expect(resolveTag({ __typename: 'Hero', displayTemplateKey: 'nothing' })).toBeUndefined();
  });
});

describe('splitPreviewAttrs', () => {
  const props = { className: 'card', 'data-epi-edit': 'heading', onClick: 'noop' };

  test('data-epi-* props are separated out in edit mode', () => {
    expect(splitPreviewAttrs(props, true)).toEqual({
      previewAttrs: { 'data-epi-edit': 'heading' },
      componentProps: { className: 'card', onClick: 'noop' },
    });
  });

  test('outside edit mode the preview attributes are dropped entirely', () => {
    const { previewAttrs, componentProps } = splitPreviewAttrs(props, false);

    expect(previewAttrs).toBeUndefined();
    expect(componentProps).toEqual({ className: 'card', onClick: 'noop' });
  });

  test('in edit mode with no data-epi-* props there are no preview attributes', () => {
    expect(splitPreviewAttrs({ className: 'card' }, true).previewAttrs).toBeUndefined();
  });
});

describe('resolveContentComponent', () => {
  test('_metadata.types is tried first, most specific type winning', () => {
    initComponentRegistry({ resolver: { Page: 'PageComponent' } });

    const resolved = resolveContentComponent<string>({
      __typename: 'ArticlePage',
      _metadata: { types: ['ArticlePage', 'Page', '_Content'] },
    });

    expect(resolved.component).toBe('PageComponent');
    expect(resolved.typename).toBe('Page');
  });

  test('__typename is the fallback when no registered type is in the chain', () => {
    initComponentRegistry({ resolver: { ArticlePage: 'ArticleComponent' } });

    const resolved = resolveContentComponent<string>({
      __typename: 'ArticlePage',
      _metadata: { types: ['Unregistered'] },
    });

    expect(resolved.component).toBe('ArticleComponent');
    expect(resolved.typename).toBe('ArticlePage');
  });

  test('nothing registered leaves the component undefined but keeps the typename', () => {
    initComponentRegistry({ resolver: {} });

    const resolved = resolveContentComponent<string>({ __typename: 'Hero' });

    expect(resolved.component).toBeUndefined();
    expect(resolved.typename).toBe('Hero');
  });

  test('the tag reaches the resolver, so a tagged variant can be returned', () => {
    initComponentRegistry({
      resolver: (contentType, options) =>
        contentType === 'Hero' && options?.tag === 'featured' ? 'FeaturedHero' : 'PlainHero',
    });

    const resolved = resolveContentComponent<string>(
      { __typename: 'Hero' },
      { tag: 'featured' },
    );

    expect(resolved).toMatchObject({ component: 'FeaturedHero', tag: 'featured' });
  });

  test('a registry passed in is used instead of the global one, with no fallback', () => {
    initComponentRegistry({ resolver: { Hero: 'GlobalHero', Banner: 'GlobalBanner' } });

    const registry = new ComponentRegistry<string>({ Hero: 'LocalHero' });
    const resolve = (__typename: string) =>
      resolveContentComponent<string>({ __typename }, { registry }).component;

    expect(resolve('Hero')).toBe('LocalHero');
    expect(resolve('Banner')).toBeUndefined();
  });

  test('the content is copied, and caller props are split around edit mode', () => {
    initComponentRegistry({ resolver: { Hero: 'HeroComponent' } });

    const content: OptimizelyContent = {
      __typename: 'Hero',
      __context: { edit: true, preview_token: 'token' },
    };
    const resolved = resolveContentComponent<string>(content, {
      props: { 'data-epi-block-id': 'abc', title: 'Hi' },
    });

    expect(resolved.contentProps).toEqual(content);
    expect(resolved.contentProps).not.toBe(content);
    expect(resolved.previewAttrs).toEqual({ 'data-epi-block-id': 'abc' });
    expect(resolved.componentProps).toEqual({ title: 'Hi' });
  });
});
