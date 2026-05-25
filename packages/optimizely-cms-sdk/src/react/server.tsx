import React, { ReactNode } from 'react';
import {
  ComponentRegistry,
  ComponentResolverOrObject,
} from '../render/componentRegistry.js';
import { JSX } from 'react';
import {
  ExperienceStructureNode,
  ExperienceNode,
  ExperienceComponentNode,
  DisplaySettingsType,
  ExperienceCompositionNode,
  InferredContentReference,
} from '../infer.js';
import { isComponentNode } from '../util/baseTypeUtil.js';
import { parseDisplaySettings } from '../model/displayTemplates.js';
import { getDisplayTemplateTag } from '../model/displayTemplateRegistry.js';
import { isDev } from '../util/environment.js';
import { appendToken } from '../util/preview.js';
import { OptimizelyReactError } from './error.js';
import { withReactComponentSpan } from '../telemetry/spans.js';
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
export { ReactContextAdapter } from '../context/reactContextAdapter.js';
export type { ContextAdapter, ContextData } from '../context/baseContext.js';

type ComponentType = React.ComponentType<any>;

// Mapping content type names with Components.
// This is a single global object used across the entire request
let componentRegistry: ComponentRegistry<ComponentType>;

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
  componentRegistry = new ComponentRegistry(options.resolver);
}

/** Content data from CMS */
type OptimizelyContent = {
  /** Content type name */
  __typename: string;

  /** Display template tag (if any) */
  __tag?: string;

  displayTemplateKey?: string | null;

  /** Preview context */
  __context?: { edit: boolean; preview_token: string };

  __composition?: ExperienceCompositionNode;

  /** metadata */
  _metadata?: {
    types?: string[];
    displayOption?: string | null;
  };
};

/** Props for the {@linkcode OptimizelyComponent} component */
type OptimizelyComponentProps = {
  /** Data read from the CMS */
  content: OptimizelyContent;

  displaySettings?: Record<string, string | boolean>;

  /** Manual tag override for component lookup */
  tag?: string;
};

/**
 * Gets display template key from content, checking multiple sources.
 */
function getDisplayTemplateKey(content: OptimizelyContent): string | null | undefined {
  return (
    content._metadata?.displayOption ??
    content.__composition?.displayTemplateKey ??
    content.displayTemplateKey
  );
}

/**
 * Resolves the tag to use for component lookup.
 * Checks tag override first, then falls back to content.__tag or display template tag.
 */
function resolveTag(
  content: OptimizelyContent,
  componentTag: string | undefined,
): string | undefined {
  //  tag override priority for tag provided by caller (e.g. OptimizelyComponent's `tag` prop)
  if (componentTag) {
    return componentTag;
  }

  // Fall back to content tag or display template tag or displayOption
  const dtKey = getDisplayTemplateKey(content);
  return content.__tag ?? getDisplayTemplateTag(dtKey);
}

/**
 * Finds component by trying each type in _metadata.types array, falling back to __typename.
 * Returns both the matched component and the typename that resolved.
 */
function findComponent(
  content: OptimizelyContent,
  options: { tag?: string },
): { component: React.ComponentType<any> | undefined; typename: string | undefined } {
  // Try _metadata.types array first
  const types = content._metadata?.types;
  if (Array.isArray(types)) {
    for (const typename of types) {
      const component = componentRegistry.getComponent(typename, options);
      if (component) return { component, typename };
    }
  }

  // Fallback to __typename
  const typename = content.__typename;
  const component =
    typename ? componentRegistry.getComponent(typename, options) : undefined;
  return { component, typename };
}

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

  if (!componentRegistry) {
    throw new OptimizelyReactError('You should call `initReactComponentRegistry` first');
  }

  const resolvedTag = resolveTag(content, tag);

  return withReactComponentSpan(
    content.__typename,
    !!resolvedTag,
    !!displaySettings,
    async span => {
      const { component: Component, typename } = findComponent(content, {
        tag: resolvedTag,
      });

      if (!Component) {
        span.setAttribute(SemanticAttributes.OPTI_COMPONENT_FOUND, false);
        return (
          <FallbackComponent>
            No component found for content type <b>{typename}</b>
          </FallbackComponent>
        );
      }

      span.setAttribute(SemanticAttributes.OPTI_COMPONENT_FOUND, true);

      const optiProps = {
        ...content,
      };

      return (
        <Component content={optiProps} {...props} displaySettings={displaySettings} />
      );
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

export function OptimizelyComposition({
  nodes,
  ComponentWrapper,
}: {
  nodes: ExperienceNode[];
  ComponentWrapper?: ComponentContainer;
}) {
  return nodes.map(node => {
    const tag = getDisplayTemplateTag(node.displayTemplateKey);
    const parsedDisplaySettings = parseDisplaySettings(node.displaySettings);

    if (isComponentNode(node)) {
      const Wrapper = ComponentWrapper ?? React.Fragment;

      return (
        <Wrapper node={node} key={node.key} displaySettings={parsedDisplaySettings}>
          <OptimizelyComponent
            content={{
              ...node.component,
              __tag: tag,
            }}
          />
        </Wrapper>
      );
    }

    const { type, nodes } = node;

    if (type === null) {
      // TODO: Error handling
      return <div>???</div>;
    }

    return (
      <OptimizelyComponent
        key={node.key}
        content={{
          ...node,
          __typename: type,
          __tag: tag,
        }}
        displaySettings={parsedDisplaySettings}
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
}: OptimizelyGridSectionProps) {
  const locallyDefined: Record<string, StructureContainer | undefined> = {
    row,
    column,
  };

  return nodes.map((node, i) => {
    const tag = getDisplayTemplateTag(node.displayTemplateKey);
    const parsedDisplaySettings = parseDisplaySettings(node.displaySettings);

    if (isComponentNode(node)) {
      return (
        <OptimizelyComponent
          content={{
            // `node.component` contains user-defined properties
            ...node.component,
            __composition: node,
            __tag: tag,
          }}
          key={node.key}
          displaySettings={parsedDisplaySettings}
        />
      );
    }

    const { nodeType } = node;
    const globalNames: Record<string, string> = {
      row: '_Row',
      column: '_Column',
    };

    // Pick the component in the following order:
    // 1. Explicitly defined in this component
    // 2. Globally defined (in the registry)
    // 3. Fallback
    // 4. React.Fragment
    const Component =
      locallyDefined[nodeType] ??
      componentRegistry.getComponent(globalNames[nodeType], { tag }) ??
      fallbacks[nodeType] ??
      React.Fragment;

    return (
      <Component
        node={node}
        index={i}
        key={node.key}
        displaySettings={parsedDisplaySettings}
      >
        <OptimizelyGridSection row={row} column={column} nodes={node.nodes ?? []} />
      </Component>
    );
  });
}

/** Get context-aware functions for preview */
export function getPreviewUtils(content: OptimizelyComponentProps['content']) {
  return {
    /** Get the HTML data attributes required for a property */
    pa(property?: string | { key: string }) {
      if (content.__context?.edit) {
        if (typeof property === 'string') {
          return {
            'data-epi-property-name': property,
          };
        } else if (property) {
          return {
            'data-epi-block-id': property.key,
          };
        }

        return {};
      } else {
        return {};
      }
    },

    /**
     * Appends preview token to a ContentReference's Image assets.
     * Adds the preview token to the main URL and all rendition URLs when in preview mode.
     *
     * @param input - ContentReference from a DAM asset
     * @returns ContentReference with preview tokens appended to all URLs, or the original if not in preview mode
     *
     * @example
     * ```tsx
     * const { src } = getPreviewUtils(content);
     *
     * <img
     *   src={src(content.image)}
     * />
     * ```
     */
    src(input: InferredContentReference | string | null | undefined): string | undefined {
      const previewToken = content.__context?.preview_token;

      // if input is an object with a URL
      if (typeof input === 'object' && input) {
        // if dam asset is selected the default URL is in input.url.default will be null
        const url = input.url?.default ?? input.item?.Url;
        if (url) {
          return appendToken(url, previewToken);
        }
      }

      // if input is a string URL
      if (typeof input === 'string') {
        return appendToken(input, previewToken);
      }

      return undefined;
    },
  };
}
