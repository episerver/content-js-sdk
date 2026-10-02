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
  return planComposition<StructureContainer>(nodes).map(item => {
    if (item.kind === 'unknown') {
      // TODO: Error handling
      return <div>???</div>;
    }

    // A `format: 'grid'` composition property has no section level, so its
    // top-level nodes are the rows an experience section would otherwise own.
    if (item.kind === 'structure') {
      return (
        <React.Fragment key={item.key}>
          {renderGridItems([item], { ComponentWrapper })}
        </React.Fragment>
      );
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

/**
 * Renders planned grid items. Shared by {@linkcode OptimizelyGridSection} and by
 * {@linkcode OptimizelyComposition}, which meets rows directly when a
 * `type: 'composition'` property has no section above them.
 */
function renderGridItems(
  items: GridRenderItem<StructureContainer>[],
  {
    overrides = {},
    ComponentWrapper,
  }: {
    overrides?: Record<string, StructureContainer | undefined>;
    ComponentWrapper?: ComponentContainer;
  },
): React.ReactNode[] {
  return items.map(item => {
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

    const Component = getStructureContainer(item, { overrides, fallbacks });
    const childNodes = renderGridItems(item.children, { overrides, ComponentWrapper });

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
}

export function OptimizelyGridSection({
  nodes,
  row,
  column,
  ComponentWrapper,
}: OptimizelyGridSectionProps) {
  return renderGridItems(planGridSection<StructureContainer>(nodes), {
    overrides: { row, column },
    ComponentWrapper,
  });
}
