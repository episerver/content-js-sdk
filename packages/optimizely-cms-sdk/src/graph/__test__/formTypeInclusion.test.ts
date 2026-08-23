import { describe, expect, test } from 'vitest';
import { createFragment } from '../createQuery.js';
import { contentType, initContentTypeRegistry } from '../../model/index.js';
import { createQueryContext, refreshCache } from '../../util/queryUtils.js';
import {
  FormContentTypes,
  OptiFormsContainerDataContentType,
} from '../../model/formContentTypes.js';

/**
 * `initForms` registers the form types globally, so anything that expands over
 * the whole registry will pull them into every query unless it is told not to.
 * There are two such expansions — the `_IComponent` interface built for an
 * experience, and a content property whose `allowedTypes` is a wildcard or a
 * base type. Both have to respect the page-level flag, or a page with no form
 * still pays for the fragments.
 */

const Element = contentType({
  key: 'PlainElement',
  displayName: 'Plain Element',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: { heading: { type: 'string' } },
});

const buildFor = (
  properties: Record<string, unknown>,
  formsEnabled: boolean,
): string => {
  const Page = contentType({
    key: 'HostPage',
    displayName: 'Host Page',
    baseType: '_experience',
    properties: properties as never,
  });

  initContentTypeRegistry([Page, Element, ...FormContentTypes]);
  refreshCache();

  return createFragment(
    'HostPage',
    new Set(),
    '',
    createQueryContext({ formsEnabled, maxFragmentThreshold: 500 }),
  ).fragments.join('\n');
};

describe('form fragments in an experience', () => {
  test('are spread into _IComponent only when the page needs them', () => {
    expect(buildFor({}, true)).toContain('fragment OptiFormsContainerData');
    expect(buildFor({}, false)).not.toContain('OptiForms');
  });
});

describe('form fragments in a content property', () => {
  // A wildcard content area is the common shape — Alloy's Product page uses one —
  // and it resolves against the whole registry, forms included.
  const wildcardArea = {
    content_area: { type: 'array', items: { type: 'content', allowedTypes: ['*'] } },
  };

  test('a wildcard content area drops them when the page has no form', () => {
    expect(buildFor(wildcardArea, true)).toContain('OptiFormsTextboxElement');
    expect(buildFor(wildcardArea, false)).not.toContain('OptiForms');
  });

  test('a base-type content area drops them too', () => {
    const area = {
      area: { type: 'content', allowedTypes: ['_component'] },
    };

    expect(buildFor(area, true)).toContain('OptiFormsTextboxElement');
    expect(buildFor(area, false)).not.toContain('OptiForms');
  });

  // Naming a form type outright is a deliberate content-model decision, and has
  // nothing to do with whether a form was dropped into the composition.
  test('a form type named outright is always included', () => {
    const named = {
      enquiry: {
        type: 'content',
        allowedTypes: [OptiFormsContainerDataContentType],
      },
    };

    expect(buildFor(named, false)).toContain('fragment OptiFormsContainerData');
  });
});
