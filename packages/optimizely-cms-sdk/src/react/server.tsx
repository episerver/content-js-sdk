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
import { getClient } from '../graph/index.js';
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

/** Props the router hands to a page built by {@linkcode createComponentPreviewPage} */
type PreviewQuery = Record<string, string | string[] | undefined>;

type ComponentPreviewPageProps = {
  /**
   * The request's query. Next's App Router hands this over as a promise;
   * other routers pass a plain object, and `URL.searchParams` is a
   * `URLSearchParams`. All three are accepted so the page is not tied to one
   * framework's calling convention.
   */
  searchParams?:
    | PreviewQuery
    | URLSearchParams
    | Promise<PreviewQuery | URLSearchParams>;
};

/** Query parameters the page reads itself. Everything else is a display setting. */
const PREVIEW_PARAMS = new Set([
  'contentType',
  'key',
  'displayTemplate',
  'locale',
  // Ignored, but reserved: the parent origin is configured on the page, not
  // requested, and a stray value must not become a display setting.
  'parentOrigin',
]);

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
 * Builds a page that renders one component on its own, without the page it
 * normally lives in. Meant as the `src` of an iframe in a component catalog.
 *
 * It renders either a real content item (`?key=`) or, for a component no
 * editor has created content for yet, stand-in content generated from the
 * content type definition (`?contentType=`).
 *
 * The page is an async component, so it needs a framework that can render
 * one on the server. Mount it wherever that framework puts routes — in Next's
 * App Router, `app/preview/component/page.tsx`:
 *
 * @example
 * ```tsx
 * import { createComponentPreviewPage } from '@optimizely/cms-sdk/react/server';
 *
 * export default createComponentPreviewPage({ defaultLocale: 'en' });
 * ```
 *
 * A router that passes the query as an object or `URLSearchParams` rather
 * than a promise works the same way:
 *
 * @example
 * ```tsx
 * const Preview = createComponentPreviewPage({ defaultLocale: 'en' });
 *
 * export const Route = () => <Preview searchParams={new URL(request.url).searchParams} />;
 * ```
 *
 * The iframe then loads one of:
 *
 * - `/preview/component?contentType=HeroSection&displayTemplate=HeroStyles&width=full`
 * - `/preview/component?key=<content key>&locale=en`
 *
 * Any query parameter the page does not read itself is passed to the component
 * as a display setting, so a catalog can flip one variant at a time.
 *
 * Only published content is reachable through `?key=`: this takes no preview
 * token, so it exposes nothing the public site does not already serve.
 */
export function createComponentPreviewPage({
  defaultLocale,
  mockData,
  parentOrigin,
}: {
  defaultLocale?: string;
  /**
   * The origin, or origins, this preview reports its size to. Without one it
   * stays silent.
   *
   * Configured by the site rather than read from the request, so the page
   * being framed decides who hears from it. An embedder cannot name itself
   * into the conversation. Pass several when more than one environment embeds
   * the same site — each message is posted per origin and the browser
   * delivers only to the one actually framing the page.
   *
   * This is not a substitute for a `frame-ancestors` CSP, which is what stops
   * another page framing the preview at all. It decides who may *hear* it.
   */
  parentOrigin?: string | string[];
  /**
   * Where stand-in content comes from: a faker-style text source, a factory,
   * or predefined content per content type. Passed in rather than imported, so
   * whatever it needs is only loaded by the module serving this page, and
   * never by the application's own pages.
   */
  mockData?: MockData;
} = {}) {
  async function ComponentPreviewPage({ searchParams }: ComponentPreviewPageProps) {
    const resolved = await searchParams;
    const query: PreviewQuery =
      resolved instanceof URLSearchParams ?
        Object.fromEntries(resolved)
      : (resolved ?? {});
    const locale = queryValue(query.locale) ?? defaultLocale;
    const contentTypeKey = queryValue(query.contentType);
    const contentKey = queryValue(query.key);
    const displayTemplateKey = queryValue(query.displayTemplate);
    const parentOrigins = parentOrigin ? [parentOrigin].flat() : [];

    const content =
      contentKey ?
        await getClient().getContent(
          { key: contentKey, locale },
          // Stated rather than inherited: this route takes no preview token and
          // performs no authorization, so it must not serve drafts even where
          // the application has configured `publishedOnly: false` globally.
          { publishedOnly: true },
        )
      : contentTypeKey ?
        (() => {
          const definition = getContentType(contentTypeKey);
          return definition && isContentType(definition) ?
              generateMockContent(definition, { mockData })
            : null;
        })()
      : null;

    const rawSettings: Record<string, string> = {
      ...defaultDisplaySettings(displayTemplateKey),
    };

    for (const [key, value] of Object.entries(query)) {
      if (!PREVIEW_PARAMS.has(key) && typeof value === 'string') {
        rawSettings[key] = value;
      }
    }

    // Through the same parser a composition goes through, so `fadeOut=false`
    // arrives as `false` and not as the truthy string `'false'`. Without it a
    // boolean setting behaves the opposite way here to the real page.
    const displaySettings = parseDisplaySettings(
      Object.entries(rawSettings).map(([key, value]) => ({ key, value })),
    );

    if (!content) {
      const requested = contentKey ?? contentTypeKey;

      return (
        <>
          {/* Told rather than left to time out, so a tile can fail fast. */}
          <PreviewReporter
            contentType={contentTypeKey}
            parentOrigins={parentOrigins}
            error={{
              code:
                contentKey ? 'content-not-found'
                : contentTypeKey ? 'unknown-content-type'
                : 'render-failed',
              message: `Nothing to preview for ${requested ?? '(no content)'}`,
            }}
          />
          <FallbackComponent>
            Nothing to preview for <b>{requested ?? '(no content)'}</b>
          </FallbackComponent>
        </>
      );
    }

    // Components reading `getContext()` (preview attributes, links) expect the
    // same context a full page render sets up.
    setContext({
      currentContent: content,
      key: content._metadata.key,
      type: content._metadata.types[0],
      locale: content._metadata.fallbackForLocale ?? content._metadata.locale,
    });

    return (
      <>
        {/* The frame paints no backdrop of its own, so the page embedding it
            decides what the component sits on. One component on a page of its
            own sits in the middle of it, rather than against the top edge of
            whatever box the frame has been given. No padding: the component is
            measured and framed by the embedder, and space the component did
            not ask for would be reported as part of it. A dev server's error
            overlay is hidden in this frame only, so it still works on the
            application's own pages. Unlayered and rendered after the
            stylesheet, so these win without `!important`. */}
        <style>
          {'html,body{background:transparent}' +
            'body{margin:0;min-height:100svh;display:flex;' +
            'flex-direction:column;justify-content:center}' +
            // Inert on frameworks that have no such overlay; listed by
            // element name rather than imported, so nothing here depends on
            // the dev server that happens to be serving the page.
            'nextjs-portal,vite-error-overlay{display:none}' +
            // The component sits inside this, not directly in the flex body: a
            // flex item is stretched to full width, which silently widens
            // anything sized by its content, such as an `inline-flex` button.
            //
            // `text-align` centres content-sized children horizontally without
            // shrinking anything: `align-items:center` would centre a section
            // by collapsing it to its content width. Block children reset it,
            // so a component's own copy reads as it does on a real page.
            `#${PREVIEW_ELEMENT_ID}{width:100%;text-align:center}` +
            `#${PREVIEW_ELEMENT_ID}>*{text-align:initial}` +
            ''}
        </style>
        <PreviewReporter
          contentType={contentTypeKey ?? content._metadata.types[0]}
          parentOrigins={parentOrigins}
        />
        {/* A form element reads these from the container it sits in. Previewed
            on its own it has no container, so the preview stands in as one. A
            container previewed this way brings its own, which take over. */}
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

  return withAppContext(ComponentPreviewPage);
}
