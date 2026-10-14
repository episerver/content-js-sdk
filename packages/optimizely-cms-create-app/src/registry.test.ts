import { describe, expect, it } from 'vitest';
import { FRAMEWORKS, TEMPLATES, TEMPLATE_NAMES, getFrameworkLabel } from './registry.js';

const frameworkKeys = FRAMEWORKS.map(it => it.key);

describe('getFrameworkLabel', () => {
  it.each([
    ['nextjs', 'Next.js'],
    ['tanstack', 'TanStack Start'],
  ])('%s → %s', (key, label) => expect(getFrameworkLabel(key)).toBe(label));

  it('falls back to the key for an unknown framework', () => expect(getFrameworkLabel('remix')).toBe('remix'));
});

describe('registry', () => {
  it('has unique framework keys and template names', () => {
    expect(new Set(frameworkKeys).size).toBe(FRAMEWORKS.length);
    expect(new Set(TEMPLATE_NAMES).size).toBe(TEMPLATES.length);
  });

  it('references only registered frameworks from templates', () =>
    TEMPLATES.forEach(it => expect(frameworkKeys).toContain(it.framework)));

  it('offers at least one template per framework', () =>
    frameworkKeys.forEach(key => expect(TEMPLATES.some(it => it.framework === key)).toBe(true)));

  it('lists TEMPLATE_NAMES in TEMPLATES order', () => expect(TEMPLATE_NAMES).toEqual(TEMPLATES.map(it => it.name)));

  // createFreshProject names the missing tool via createCommand.split(' ')[1]
  it('runs every create command through npx', () =>
    FRAMEWORKS.forEach(it => expect(it.createCommand).toMatch(/^npx \S+/)));
});
