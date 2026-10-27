import React, { ReactNode } from 'react';
import { JSX } from 'react';
import { ComponentResolverOrObject } from '../render/componentRegistry.js';
import {
  hasComponentRegistry,
  initComponentRegistry,
  initForms as initFormsCore,
} from '../core/render/registry.js';
import {
  resolveContentComponent,
  type OptimizelyContent,
} from '../core/render/resolve.js';
import {
  planComposition,
  planGridSection,
  isWrappedComponent,
  getStructureContainer,
  type GridRenderItem,
} from '../core/render/plan.js';
import type { FormHandlers, ComponentType } from './forms/setup.js';
import {
  ExperienceStructureNode,
  ExperienceNode,
  ExperienceComponentNode,
  DisplaySettingsType,
} from '../infer.js';
import { isDev } from '../util/environment.js';
import { OptimizelyReactError } from './error.js';
import { withComponentRenderSpan } from '../telemetry/spans.js';
import { SemanticAttributes } from '../telemetry/index.js';
import { getContentType } from '../model/contentTypeRegistry.js';
import {
  getDisplayTemplate,
  getDisplayTemplateTag,
} from '../model/displayTemplateRegistry.js';
import { isContentType } from '../model/index.js';
import { parseDisplaySettings } from '../model/displayTemplates.js';
import { generateMockContent, type MockData } from '../render/mockContent.js';
import { PREVIEW_ELEMENT_ID } from '../core/preview/protocol.js';
import { PreviewReporter } from './client.js';
import { FormRulesProvider } from './forms/FormRulesContext.js';
import { FormSubmissionProvider } from './forms/FormSubmissionProvider.js';
import { FormValidationProvider } from './forms/FormValidationContext.js';
import { setContext } from '../context/config.js';
import { withAppContext } from './context/contextWrapper.js';
export { withAppContext } from './context/contextWrapper.js';
export {
  getContext,
  setContext,
  getContextData,
  setContextData,
  configureAdapter,
  getAdapter,
} from '../context/config.js';
export { ReactContextAdapter } from './context/reactContextAdapter.js';
import { getPreviewUtils } from '../core/preview/attributes.js';
export { getPreviewUtils };
export type { ContextAdapter, ContextData } from '../context/baseContext.js';

/**
 * Initializes form content types and components in one call.
 * Automatically registers all Optimizely Forms content types and their React components.
 *
 * @param handlers Form component handlers mapped by display name
 *
 * @example
 * ```ts
 * initForms({
 *   container: FormContainerComponent,
 *   textbox: TextboxComponent,
 *   textarea: TextareaComponent,
 *   // ... other form element components
 * });
 * ```
 */
export const initForms: (handlers: FormHandlers) => void = initFormsCore;

type InitOptions = {
  resolver: ComponentResolverOrObject<ComponentType>;
};

/**
 * Initializes the React component registry
 *
 * @param options Initialization options.
 * @param options.resolver Either a ComponentResolver function for dynamic resolution,
 * or a ComponentMap object for static mappings between content types and components
 *
 *
 * @example
 * Using a static component map:
 *
 * ```ts
 * initReactComponentRegistry({
 *   resolver: {
 *     'ButtonContentType': ButtonComponent,
 *     // You can define tags using the `ContentType:Tag` syntax:
 *     'ButtonContentType:ChristmasTag': ChristmasButtonComponent,
 *     'CardContentType': {
 *       default: DefaultCardComponent,
 *       tags: { ChristmasTag: ChristmasCardComponent }
 *     }
 *   }
 * });
 * ```
 *
 * @example
 * Using a dynamic resolver function:
 *
 * ```ts
 * initReactComponentRegistry({
 *   resolver: (contentType, options) => {
 *     if (contentType === 'Button') {
 *       return options?.tag === 'primary' ? PrimaryButton : DefaultButton;
 *     }
 *     return undefined;
 *   }
 * });
 * ```
 */
export function initReactComponentRegistry(options: InitOptions) {
  initComponentRegistry(options);
}

/** Props for the {@linkcode OptimizelyComponent} component */
type OptimizelyComponentProps = {
  /** Data read from the CMS */
  content: OptimizelyContent;

  displaySettings?: Record<string, string | boolean>;

  /** Manual tag override for component lookup */
  tag?: string;
};

export async function OptimizelyComponent({
  content,
  displaySettings,
  tag,
  ...props
}: OptimizelyComponentProps) {
  if (!content) {
    throw new OptimizelyReactError(
      'OptimizelyComponent requires a valid content prop. Received null or undefined.',
    );
  }

  // A forms-only application is legitimate, so either registry will do.
  if (!hasComponentRegistry()) {
    throw new OptimizelyReactError(
      'The component registry is not initialized. Call `initReactComponentRegistry` in the application entry point.',
    );
  }

  const resolved = resolveContentComponent<ComponentType>(content, { tag, props });

  return withComponentRenderSpan(
    'react',
    content.__typename,
    !!resolved.tag,
    !!displaySettings,
    async span => {
      const { component: Component, typename, contentProps, componentProps } = resolved;

      if (!Component) {
        span.setAttribute(SemanticAttributes.OPTI_COMPONENT_FOUND, false);
        return (
          <FallbackComponent>
            No component found for content type <b>{typename}</b>
          </FallbackComponent>
        );
      }

      span.setAttribute(SemanticAttributes.OPTI_COMPONENT_FOUND, true);

      const element = (
        <Component
          content={contentProps}
          displaySettings={displaySettings}
          {...componentProps}
        />
      );

      return resolved.previewAttrs ?
          <div {...resolved.previewAttrs}>{element}</div>
        : element;
    },
  );
}

export type StructureContainerProps = {
  node: ExperienceStructureNode;
  children: React.ReactNode;
  index?: number;
  displaySettings?: Record<string, string | boolean>;
};
export type ComponentContainerProps = {
  node: ExperienceComponentNode;
  children: React.ReactNode;
  displaySettings?: Record<string, string | boolean>;
};
export type StructureContainer = (props: StructureContainerProps) => JSX.Element;
export type ComponentContainer = (props: ComponentContainerProps) => JSX.Element;

/**
 * Default wrapper for components when in preview mode.
 * Adds necessary preview attributes to the wrapper div.
 * */
function DefaultComponentWrapper({
  children,
  node,
  displaySettings,
}: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);

  // Clone children and inject displaySettings if it's a valid React element
  const childrenWithProps =
    React.isValidElement(children) && displaySettings ?
      React.cloneElement(children, { displaySettings } as any)
    : children;

  return (
    <div {...pa(node)} style={{ width: '100%', display: 'block' }}>
      {childrenWithProps}
    </div>
  );
}

export function OptimizelyComposition({
  nodes,
  ComponentWrapper,
}: {
  nodes: ExperienceNode[];
  ComponentWrapper?: ComponentContainer;
}) {
  return planComposition(nodes).map(item => {
    if (item.kind === 'unknown') {
      // TODO: Error handling
      return <div>???</div>;
    }

    if (isWrappedComponent(item)) {
      const Wrapper = ComponentWrapper ?? DefaultComponentWrapper;

      return (
        <Wrapper
          node={item.node as ExperienceComponentNode}
          key={item.key}
          displaySettings={item.displaySettings}
        >
          <OptimizelyComponent content={item.content} displaySettings={item.displaySettings} />
        </Wrapper>
      );
    }

    return (
      <OptimizelyComponent
        key={item.key}
        content={item.content}
        displaySettings={item.displaySettings}
        {...item.previewAttrs}
      />
    );
  });
}

function FallbackRow({ node, children }: StructureContainerProps) {
  const { pa } = getPreviewUtils(node);
  return (
    <div style={{ display: 'flex', gap: '1rem' }} {...pa(node)}>
      {children}
    </div>
  );
}

function FallbackColumn({ node, children }: StructureContainerProps) {
  const { pa } = getPreviewUtils(node);
  return (
    <div style={{ flex: '1' }} {...pa(node)}>
      {children}
    </div>
  );
}

function FallbackComponent({ children }: { children: ReactNode }) {
  return isDev() ?
      <div
        style={{
          color: 'black',
          margin: '1rem',
          padding: '1rem',
          border: '1px solid',
          borderRadius: '8px',
          backgroundColor: 'white',
        }}
      >
        {children}
      </div>
    : null;
}

type OptimizelyGridSectionProps = {
  nodes: ExperienceNode[];
  row?: StructureContainer;
  column?: StructureContainer;
  ComponentWrapper?: ComponentContainer;
  displaySettings?: DisplaySettingsType[];
};

const fallbacks: Record<string, StructureContainer> = {
  row: FallbackRow,
  column: FallbackColumn,
};

export function OptimizelyGridSection({
  nodes,
  row,
  column,
  ComponentWrapper,
}: OptimizelyGridSectionProps) {
  const locallyDefined: Record<string, StructureContainer | undefined> = {
    row,
    column,
  };

  const renderItems = (items: GridRenderItem<StructureContainer>[]): React.ReactNode[] =>
    items.map(item => {
      if (item.kind === 'component') {
        const component = (
          <OptimizelyComponent
            content={item.content}
            displaySettings={item.displaySettings}
            {...(ComponentWrapper ? {} : item.previewAttrs)}
          />
        );

        // we can only pass key, ref to fragments to avoid React warnings, so if there's a wrapper component, use that, otherwise render the component directly without a wrapper
        if (ComponentWrapper) {
          return (
            <ComponentWrapper
              key={item.key}
              node={item.node as ExperienceComponentNode}
              displaySettings={item.displaySettings}
            >
              {component}
            </ComponentWrapper>
          );
        }

        return <React.Fragment key={item.key}>{component}</React.Fragment>;
      }

      const Component = getStructureContainer(item, { overrides: locallyDefined, fallbacks });

      const childNodes = renderItems(item.children);

      // Structure nodes other than rows and columns (form steps, for example) have no
      // container to render into. A fragment accepts only `key`, `ref` and `children`,
      // so the node props have to be dropped rather than spread onto it.
      if (!Component) {
        return <React.Fragment key={item.key}>{childNodes}</React.Fragment>;
      }

      return (
        <Component
          node={item.node as ExperienceStructureNode}
          index={item.index}
          key={item.key}
          displaySettings={item.displaySettings}
        >
          {/* A single child, so containers using `Children.only`/`cloneElement` keep working */}
          <>{childNodes}</>
        </Component>
      );
    });

  return renderItems(planGridSection<StructureContainer>(nodes));
}

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
   * The origin this preview reports to. Without it, it stays silent.
   *
   * Usually the CMS. Passed in rather than read from the environment, so the
   * site decides where its configuration comes from and this works wherever
   * there is no environment to read.
   *
   * Configured by the site, never taken from the request, so an embedder
   * cannot name itself into the conversation. Decides who may *hear* the
   * preview — a `frame-ancestors` CSP is what stops it being framed at all.
   * A full URL is fine; only its origin is kept.
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

    const parentOrigins = [parentOrigin]
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
      return generateMockContent(definition, { mockData }) as OptimizelyContent;
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
