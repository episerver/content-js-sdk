import React from 'react';
import {
  ComponentRegistry,
  ComponentResolver,
} from '../render/componentRegistry.js';
import { JSX } from 'react';
import {
  ExperienceStructureNode,
  ExperienceNode,
  ExperienceComponentNode,
  DisplaySettingsType,
} from '../infer.js';
import { isComponentNode } from '../util/baseTypeUtil.js';
import { parseDisplaySettings } from '../model/displayTemplates.js';
import { getDisplayTemplateTag } from '../model/displayTemplateRegistry.js';

type ComponentType = React.ComponentType<any>;

// Mapping content type names with Components.
// This is a single global object used across the entire request
let componentRegistry: ComponentRegistry<ComponentType>;

type InitOptions = {
  resolver: ComponentResolver<ComponentType>;
};

export function initReactComponentRegistry(options: InitOptions) {
  componentRegistry = new ComponentRegistry(options.resolver);
}

type Props = {
  opti: {
    __typename: string;
    __context?: { edit: boolean; preview_token: string };
  };
  componentKey?: string;
};

export async function OptimizelyComponent({
  opti,
  componentKey,
  ...props
}: Props) {
  if (!componentRegistry) {
    throw new Error('You should call `initReactComponentRegistry` first');
  }

  const contentType = componentKey ?? opti.__typename;
  const Component = await componentRegistry.getComponent(contentType);

  if (!Component) {
    return <div>No component found for content type {contentType}</div>;
  }

  const optiProps = {
    ...opti,
  };

  return <Component opti={optiProps} {...props} />;
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
    // get component key(tag) from the display template
    const key = getDisplayTemplateTag(node.displayTemplateKey);
    // get the parsed display settings (stlyes, classes etc.)
    const parsedDisplaySettings = parseDisplaySettings(node.displaySettings);

    if (isComponentNode(node)) {
      const Wrapper = ComponentWrapper ?? React.Fragment;
      return (
        <Wrapper
          node={node}
          key={node.key}
          displaySettings={parsedDisplaySettings}
        >
          <OptimizelyComponent opti={node.component} componentKey={key} />
        </Wrapper>
      );
    }

    const { type, nodes } = node;

    if (type === null) {
      // TODO: Error handling
      return <div>???</div>;
    }

    // If a display template key is provided, use it to retrieve the corresponding component.
    // Otherwise, fall back to using the node type as the key to identify the component.
    const Component = componentRegistry.getComponent(key ?? type);

    if (!Component) {
      throw new Error(`No component defined for content type ${type}`);
    }

    return (
      <Component
        key={node.key}
        opti={node}
        displaySettings={parsedDisplaySettings}
      />
    );
  });
}

export function OptimizelyGridSection({
  nodes,
  row,
  column,
}: {
  nodes?: ExperienceNode[];
  row: StructureContainer;
  column: StructureContainer;
  displaySettings?: DisplaySettingsType[];
}) {
  if (!nodes) {
    // TODO: Handle beter
    throw new Error('Nodes must be an array');
  }
  return nodes.map((node, i) => {
    // get component key(tag) from the display template
    const key = getDisplayTemplateTag(node.displayTemplateKey);

    if (isComponentNode(node)) {
      return (
        <OptimizelyComponent
          key={node.key}
          opti={node.component}
          componentKey={key}
        />
      );
    }

    const { nodes, nodeType } = node;

    const mapper: Record<string, StructureContainer> = { row, column };

    // TODO: default component
    const Component = mapper[nodeType] ?? React.Fragment;
    // get the parsed display settings (stlyes, classes etc.)
    const parsedDisplaySettings = parseDisplaySettings(node.displaySettings);

    return (
      <Component
        node={node}
        index={i}
        key={node.key}
        displaySettings={parsedDisplaySettings}
      >
        <OptimizelyGridSection row={row} column={column} nodes={nodes} />
      </Component>
    );
  });
}

/** Get context-aware functions for preview */
export function getPreviewUtils(opti: Props['opti']) {
  return {
    /** Get the HTML data attributes required for a property */
    pa(property: string | { key: string }) {
      if (opti.__context?.edit) {
        if (typeof property === 'string') {
          return {
            'data-epi-property-name': property,
          };
        } else {
          return {
            'data-epi-block-id': property.key,
          };
        }
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
