import { test, expect } from '@playwright/test';
import { installModelContext, ALL_TOOLS, READ_ONLY_TOOLS } from './helpers';

/**
 * ADR/issue obligation (g) — issue 0002 acceptance criterion 2:
 * all six tools enumerate via getTools() on marketing AND store pages in a
 * WebMCP-capable context; and with modelContext ABSENT the page is fully
 * functional with zero console errors (the shipped tools.js is a graceful
 * no-op with no polyfill).
 */

const PAGES = ['/', '/store'];

for (const path of PAGES) {
  test(`all six tools enumerate on ${path === '/' ? 'marketing' : 'store'} page (${path})`, async ({ page }) => {
    await installModelContext(page);
    await page.goto(path);
    // registration is awaited sequentially after script load
    await expect
      .poll(async () =>
        page.evaluate(() => (document as any).modelContext.getTools().map((t: any) => t.name)),
      )
      .toEqual([...ALL_TOOLS]);

    const tools = await page.evaluate(() => (document as any).modelContext.getTools());
    for (const t of tools) {
      expect(t.description.length).toBeGreaterThan(80);
      expect(t.inputSchema.type).toBe('object');
      expect(t.inputSchema.additionalProperties).toBe(false);
      const shouldBeReadOnly = (READ_ONLY_TOOLS as readonly string[]).includes(t.name);
      expect(t.annotations?.readOnlyHint === true).toBe(shouldBeReadOnly);
    }
    // mutations require the caller-supplied idempotencyKey
    for (const name of ['add_to_cart', 'update_cart_item', 'remove_from_cart']) {
      const def = tools.find((t: any) => t.name === name);
      expect(def.inputSchema.required).toContain('idempotencyKey');
    }
  });

  test(`page fully functional with modelContext absent, zero console errors (${path})`, async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => pageErrors.push(String(err)));

    // NO shim installed: stock Chromium has no modelContext → tools.js no-ops
    await page.goto(path);
    await page.waitForLoadState('networkidle');

    const state = await page.evaluate(() => ({
      hasModelContext: !!(document as any).modelContext || !!(navigator as any).modelContext,
      bodyHasContent: (document.body?.textContent ?? '').trim().length > 0,
      scriptLoaded: Array.from(document.querySelectorAll('script')).some((s) =>
        (s.getAttribute('src') ?? '').includes('webmcp-tools.js'),
      ),
    }));
    expect(state.hasModelContext).toBe(false); // no polyfill/shim was installed
    expect(state.scriptLoaded).toBe(true); // the script IS loaded site-wide
    expect(state.bodyHasContent).toBe(true); // page renders normally
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}
