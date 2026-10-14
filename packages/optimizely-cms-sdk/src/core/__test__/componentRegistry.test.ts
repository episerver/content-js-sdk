import { afterEach, describe, expect, test, vi } from 'vitest';
import { ComponentRegistry } from '../../render/componentRegistry.js';
import {
  hasComponentRegistry,
  initComponentRegistry,
  initForms,
  resetComponentRegistry,
  resolveComponent,
} from '../render/registry.js';

afterEach(() => resetComponentRegistry());

describe('ComponentRegistry with a component map', () => {
  const registry = new ComponentRegistry<string>({
    Hero: 'Hero',
    'Hero:wide': 'WideHero',
    Card: { default: 'Card', tags: { compact: 'CompactCard' } },
    'Card:featured': { default: 'FeaturedCard', tags: { ignored: 'Ignored' } },
    Teaser: { tags: { slim: 'SlimTeaser' } },
    Link: 'Link',
  });

  test('looks a component up by content type', () => {
    expect(registry.getComponent('Hero')).toBe('Hero');
    expect(registry.getComponent('Missing')).toBeUndefined();
  });

  test('a `type:tag` key answers a tagged lookup', () => {
    expect(registry.getComponent('Hero', { tag: 'wide' })).toBe('WideHero');
  });

  test('a `type:tag` entry with variants contributes its default', () => {
    expect(registry.getComponent('Card', { tag: 'featured' })).toBe('FeaturedCard');
  });

  test('a tag listed in the entry variants is used when there is no `type:tag` key', () => {
    expect(registry.getComponent('Card', { tag: 'compact' })).toBe('CompactCard');
  });

  test('an unknown tag falls back to the default component', () => {
    expect(registry.getComponent('Card', { tag: 'unknown' })).toBe('Card');
    expect(registry.getComponent('Hero', { tag: 'unknown' })).toBe('Hero');
  });

  test('an entry with variants but no default resolves to nothing without a matching tag', () => {
    expect(registry.getComponent('Teaser')).toBeUndefined();
    expect(registry.getComponent('Teaser', { tag: 'slim' })).toBe('SlimTeaser');
  });

  test('a tagged lookup for an unregistered type resolves to nothing', () => {
    expect(registry.getComponent('Missing', { tag: 'wide' })).toBeUndefined();
  });

  test('a "Property" suffix falls back to the base type', () => {
    expect(registry.getComponent('LinkProperty')).toBe('Link');
    expect(registry.getComponent('CardProperty', { tag: 'compact' })).toBe('CompactCard');
    expect(registry.getComponent('MissingProperty')).toBeUndefined();
  });
});

describe('ComponentRegistry with a resolver function', () => {
  test('passes the content type and options through untouched', () => {
    const resolver = vi.fn((contentType: string) => (contentType === 'Hero' ? 'Hero' : undefined));
    const registry = new ComponentRegistry<string>(resolver);

    expect(registry.getComponent('Hero', { tag: 'wide' })).toBe('Hero');
    expect(registry.getComponent('LinkProperty')).toBeUndefined();
    expect(resolver).toHaveBeenNthCalledWith(1, 'Hero', { tag: 'wide' });
    expect(resolver).toHaveBeenNthCalledWith(2, 'LinkProperty', {});
  });
});

describe('global registries', () => {
  test('hasComponentRegistry is false until either registry is filled', () => {
    expect(hasComponentRegistry()).toBe(false);

    initForms({ textbox: 'Textbox' });
    expect(hasComponentRegistry()).toBe(true);

    resetComponentRegistry();
    initComponentRegistry({ resolver: {} });
    expect(hasComponentRegistry()).toBe(true);
  });

  test('resolveComponent tries the application registry before the forms one', () => {
    initComponentRegistry({ resolver: { Hero: 'Hero', OptiFormsSubmitElement: 'CustomSubmit' } });
    initForms({ submit: 'Submit', textbox: 'Textbox' });

    expect(resolveComponent('Hero')).toBe('Hero');
    expect(resolveComponent('OptiFormsSubmitElement')).toBe('CustomSubmit');
    expect(resolveComponent('OptiFormsTextboxElement')).toBe('Textbox');
    expect(resolveComponent('Missing')).toBeUndefined();
  });

  test('repeated initForms calls add to the forms registry', () => {
    initForms({ textbox: 'Textbox' });
    initForms({ submit: 'Submit' });

    expect(resolveComponent('OptiFormsTextboxElement')).toBe('Textbox');
    expect(resolveComponent('OptiFormsSubmitElement')).toBe('Submit');
  });

  test('resolveComponent resolves nothing before any registry is filled', () => {
    expect(resolveComponent('Hero')).toBeUndefined();
  });
});
