/**
 * The component preview page: one component rendered on its own, for an
 * iframe or a screenshot runner to consume.
 *
 * A separate entry point from `react/server` on purpose. This is a narrow
 * feature — a catalogue, an inspector, a thumbnail service — and importing
 * it pulls in stand-in content generation that an application rendering real
 * pages has no use for.
 *
 * Its two neighbours split by who reads them: `@optimizely/cms-sdk/mock` is
 * for the application declaring what its components look like here, and
 * `@optimizely/cms-sdk/protocol` is for whoever embeds the result.
 *
 * @module
 */

import { FallbackComponent, OptimizelyComponent } from './server.js';
import { PreviewReporter } from './client.js';
import { withAppContext } from './context/contextWrapper.js';
import { FormRulesProvider } from './forms/FormRulesContext.js';
import { FormSubmissionProvider } from './forms/FormSubmissionProvider.js';
import { FormValidationProvider } from './forms/FormValidationContext.js';
import { setContext } from '../context/config.js';
import { getContentType, isContentType } from '../model/index.js';
import {
  getDisplayTemplate,
  getDisplayTemplateTag,
} from '../model/displayTemplateRegistry.js';
import { parseDisplaySettings } from '../model/displayTemplates.js';
import { generateMockContent, type MockData } from '../render/mockContent.js';
import { env } from '../util/environment.js';
import { PREVIEW_ELEMENT_ID } from '../core/preview/protocol.js';
import type { OptimizelyContent } from '../core/render/resolve.js';

/**
 * The preview page's styling. One string, so the page needs no stylesheet;
 * unlayered and rendered after the app's CSS, so it wins without `!important`.
 */
function previewStyles(fit: PreviewFit | undefined) {
  return [
    // The embedder decides what the component sits on.
    'html,body{background:transparent}',

    // A scrollbar would narrow the measurement and show up in the thumbnail.
    'html{scrollbar-width:none}',
    'html::-webkit-scrollbar{display:none}',

    // Fitted content belongs inside the viewport; clip anything still over.
    fit === 'none' ? '' : 'html,body{overflow:hidden}',

    // One component on a page of its own sits in the middle of it.
    'body{margin:0;min-height:100svh;display:flex;flex-direction:column;justify-content:center}',

    // Inert where there is no such overlay, and depends on no dev server.
    'nextjs-portal,vite-error-overlay{display:none}',

    // Inside this, not the flex body directly, which would stretch it.
    `#${PREVIEW_ELEMENT_ID}{width:100%;text-align:center}`,

    // `text-align` centres an inline child, `margin-inline` a block one.
    // Children reset it so their copy reads as on a real page.
    `#${PREVIEW_ELEMENT_ID}>*{text-align:initial;margin-inline:auto}`,
  ].join('');
}

/** How a component is sized inside the preview's viewport. */
export type PreviewFit = 'contain' | 'none';

/** Props the router hands to a page built by {@linkcode createStandalonePreview} */
type PreviewQuery = Record<string, string | string[] | undefined>;

type StandalonePreviewProps = {
  /** A promise (Next's App Router), a plain object, or `URLSearchParams`. */
  searchParams?:
    | PreviewQuery
    | URLSearchParams
    | Promise<PreviewQuery | URLSearchParams>;
};

/** Query parameters the page reads itself. Everything else is a display setting. */
const PREVIEW_PARAMS = new Set([
  'type',
  'template',
  'loc',
  // Ignored, but reserved, so a stray value cannot quietly become a display
  // setting. `parentOrigin` is configured on the page and never requested.
  // The rest are names this route used to read: an old URL should render
  // nothing rather than render a component with a setting called `key`.
  'parentOrigin',
  'contentType',
  'displayTemplate',
  'locale',
  'key',
]);

/**
 * The origin of a URL, or nothing if it is unset or unparseable. Origins are
 * what `event.origin` is compared against, so a configured URL carrying a
 * path would never match.
 */
function originOf(url: string | undefined) {
  try {
    return url ? new URL(url).origin : undefined;
  } catch {
    return undefined;
  }
}

/** The first value of a query parameter, ignoring repeats. */
function queryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** The settings a display template starts with: the first choice of each. */
function defaultDisplaySettings(templateKey: string | undefined) {
  const settings = templateKey ? getDisplayTemplate(templateKey)?.settings : undefined;
  if (!settings) return {};

  return Object.fromEntries(
    Object.entries(settings).map(([key, setting]) => [
      key,
      Object.entries(setting.choices).sort(
        ([, a], [, b]) => a.sortOrder - b.sortOrder,
      )[0]?.[0],
    ]),
  );
}

/**
 * Builds a page that renders one component on its own, for an iframe to embed.
 *
 * Renders stand-in content generated from the content type (`?type=`),
 * so a component works here before any editor has authored one. Any query
 * parameter the page does not read itself becomes a display setting, so a
 * catalogue can show one variant per tile.
 *
 * Needs React Server Components. The page it returns is an async server
 * component, and the part that measures and reports is a client component, so
 * the framework has to render async components on the server and understand
 * `'use client'`. Next's App Router does; its Pages Router and plain
 * client-side React do not. Nothing here imports Next itself.
 *
 * Mount it wherever your framework puts routes:
 *
 * @example `app/preview/component/page.tsx` in Next's App Router
 * ```tsx
 * export default createStandalonePreview({ defaultLocale: 'en' });
 * ```
 *
 * It never fetches real content. The route takes no preview token and does no
 * authorization, so there is nothing on it to protect.
 */
export function createStandalonePreview({
  defaultLocale,
  mockData,
  parentOrigin,
  fit,
}: {
  defaultLocale?: string;
  /**
   * How the component sits in the preview's viewport. Defaults to
   * `'contain'`: scaled down if it is larger, centred, never enlarged — so a
   * fixed-size frame shows the whole component rather than cropping it.
   *
   * `'none'` renders at natural size and lets the page scroll, for an
   * embedder that wants a scrollable frame rather than a thumbnail.
   */
  fit?: PreviewFit;
  /**
   * The origin this preview reports to.
   *
   * Defaults to `OPTIMIZELY_CMS_URL`, since the CMS is what embeds these
   * previews and that variable is already set. Pass one to report somewhere
   * else instead — a local preview tool, or a second environment.
   *
   * Configured by the site, never taken from the request, so an embedder
   * cannot name itself into the conversation. Decides who may *hear* the
   * preview — a `frame-ancestors` CSP is what stops it being framed at all.
   * A full URL is fine; only its origin is kept.
   *
   * With neither, the preview renders but reports nothing.
   */
  parentOrigin?: string;
  /**
   * Where stand-in content comes from: a faker-style text source, a factory,
   * or predefined content per content type. Passed in rather than imported, so
   * whatever it needs is only loaded by the module serving this page, and
   * never by the application's own pages.
   */
  mockData?: MockData;
} = {}) {
  async function StandalonePreview({ searchParams }: StandalonePreviewProps) {
    const resolved = await searchParams;
    const query: PreviewQuery =
      resolved instanceof URLSearchParams ?
        Object.fromEntries(resolved)
      : (resolved ?? {});
    const locale = queryValue(query.loc) ?? defaultLocale;
    const contentTypeKey = queryValue(query.type);
    const displayTemplateKey = queryValue(query.template);

    // The CMS is the embedder this exists for, and its URL is already
    // configured, so a site has nothing to set up for the usual case.
    const parentOrigins = [parentOrigin ?? env('OPTIMIZELY_CMS_URL')]
      .map(originOf)
      .filter((origin): origin is string => Boolean(origin));

    // Stand-in content only. This route has no token and no authorization, so
    // it never reaches for real content — there is nothing here to protect.
    const content = ((): OptimizelyContent | null => {
      if (!contentTypeKey) return null;

      const definition = getContentType(contentTypeKey);
      if (!definition || !isContentType(definition)) return null;

      // Built from the content type's own schema, so it is the shape a
      // component expects even though no editor has authored it.
      return generateMockContent(definition, {
        mockData,
        // What `?loc=` asked for, or the page's default. Generated content
        // that claimed a different locale would format dates and numbers
        // the wrong way.
        locale,
      }) as OptimizelyContent;
    })();

    const rawSettings: Record<string, string> = {
      ...defaultDisplaySettings(displayTemplateKey),
    };

    for (const [key, value] of Object.entries(query)) {
      if (!PREVIEW_PARAMS.has(key) && typeof value === 'string') {
        rawSettings[key] = value;
      }
    }

    // The same parser a composition uses, so `fadeOut=false` arrives as a
    // boolean and not as the truthy string `'false'`.
    const displaySettings = parseDisplaySettings(
      Object.entries(rawSettings).map(([key, value]) => ({ key, value })),
    );

    if (!content) {
      return (
        <>
          {/* Told, rather than left to time out. */}
          <PreviewReporter
            contentType={contentTypeKey}
            parentOrigins={parentOrigins}
            error={{
              code: contentTypeKey ? 'unknown-content-type' : 'render-failed',
              message: `Nothing to preview for ${contentTypeKey ?? '(no content type)'}`,
            }}
          />
          {/* The same wrapper a rendered component gets, so a tool looking
              for the preview element finds one either way — and finds the
              error attribute on it. */}
          <div id={PREVIEW_ELEMENT_ID}>
            <FallbackComponent>
              Nothing to preview for <b>{contentTypeKey ?? '(no content type)'}</b>
            </FallbackComponent>
          </div>
        </>
      );
    }

    // `OptimizelyContent` types `_metadata` loosely, because what a real
    // fetch returns varies. Generated content always carries these.
    const metadata = content._metadata as { key: string; types: string[] };

    // Components reading `getContext()` (preview attributes, links) expect the
    // same context a full page render sets up.
    setContext({
      currentContent: content,
      key: metadata.key,
      type: metadata.types[0],
      locale,
    });

    return (
      <>
        <style>{previewStyles(fit)}</style>
        <PreviewReporter
          contentType={contentTypeKey}
          parentOrigins={parentOrigins}
          fit={fit !== 'none'}
        />
        {/* A form element reads these from its container. Previewed alone it
            has none, so the preview stands in; a container brings its own. */}
        <FormSubmissionProvider>
          <FormValidationProvider>
            <FormRulesProvider>
              <div id={PREVIEW_ELEMENT_ID}>
                <OptimizelyComponent
                  content={content}
                  tag={getDisplayTemplateTag(displayTemplateKey)}
                  displaySettings={
                    displaySettings && Object.keys(displaySettings).length > 0 ?
                      displaySettings
                    : undefined
                  }
                />
              </div>
            </FormRulesProvider>
          </FormValidationProvider>
        </FormSubmissionProvider>
      </>
    );
  }

  return withAppContext(StandalonePreview);
}
