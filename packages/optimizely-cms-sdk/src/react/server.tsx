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
} from '../infer.js';
import { isComponentNode } from '../util/baseTypeUtil.js';
import { parseDisplaySettings } from '../model/displayTemplates.js';
import { getDisplayTemplateTag } from '../model/displayTemplateRegistry.js';
import { isDev } from '../util/environment.js';

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

/** Props for the {@linkcode OptimizelyComponent} component */
type OptimizelyComponentProps = {
  /** Data read from the CMS */
  opti: {
    /** Content type name */
    __typename: string;

    /** Display template tag (if any) */
    __tag?: string;

    displayTemplateKey?: string | null;

    /** Preview context */
    __context?: { edit: boolean; preview_token: string };

    __composition?: ExperienceCompositionNode;
  };

  displaySettings?: Record<string, string>;
};

export async function OptimizelyComponent({
  opti,
  displaySettings,
  ...props
}: OptimizelyComponentProps) {
  if (!componentRegistry) {
    throw new Error('You should call `initReactComponentRegistry` first');
  }
  const dtKey =
    opti.__composition?.displayTemplateKey ?? opti.displayTemplateKey;
  const Component = await componentRegistry.getComponent(opti.__typename, {
    tag: opti.__tag ?? getDisplayTemplateTag(dtKey),
  });

  if (!Component) {
    return (
      <FallbackComponent>
        No component found for content type <b>{opti.__typename}</b>
      </FallbackComponent>
    );
  }

  const optiProps = {
    ...opti,
  };

  return (
    <Component opti={optiProps} {...props} displaySettings={displaySettings} />
  );
}

export type StructureContainerProps = {
  node: ExperienceStructureNode;
  children: React.ReactNode;
  index?: number;
  displaySettings?: Record<string, string>;
};
export type ComponentContainerProps = {
  node: ExperienceComponentNode;
  children: React.ReactNode;
  displaySettings?: Record<string, string>;
};
export type StructureContainer = (
  props: StructureContainerProps
) => JSX.Element;
export type ComponentContainer = (
  props: ComponentContainerProps
) => JSX.Element;

export function OptimizelyExperience({
  nodes,
  ComponentWrapper,
}: {
  nodes: ExperienceNode[];
  ComponentWrapper?: ComponentContainer;
}) {
  return nodes.map((node) => {
    const tag = getDisplayTemplateTag(node.displayTemplateKey);
    const parsedDisplaySettings = parseDisplaySettings(node.displaySettings);

    if (isComponentNode(node)) {
      const Wrapper = ComponentWrapper ?? React.Fragment;

      return (
        <Wrapper
          node={node}
          key={node.key}
          displaySettings={parsedDisplaySettings}
        >
          <OptimizelyComponent
            opti={{
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
        opti={{
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
  return isDev() ? (
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
  ) : null;
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
          opti={{
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
        <OptimizelyGridSection
          row={row}
          column={column}
          nodes={node.nodes ?? []}
        />
      </Component>
    );
  });
}

/** Get context-aware functions for preview */
export function getPreviewUtils(opti: OptimizelyComponentProps['opti']) {
  return {
    /** Get the HTML data attributes required for a property */
    pa(property?: string | { key: string }) {
      if (opti.__context?.edit) {
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

    /** Appends the preview token to the provided image URL */
    src(url: string) {
      if (opti.__context?.preview_token) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}preview_token=${opti.__context.preview_token}`;
      }
      return url;
    },
  };
}
