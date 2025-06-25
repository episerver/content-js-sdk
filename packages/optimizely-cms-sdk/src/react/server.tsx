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
} from '../infer.js';
import { isComponentNode } from '../util/baseTypeUtil.js';

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
};

export async function OptimizelyComponent({ opti, ...props }: Props) {
  if (!componentRegistry) {
    throw new Error('You should call `initReactComponentRegistry` first');
  }

  const contentType = opti.__typename;
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
};
export type ComponentContainerProps = {
  node: ExperienceComponentNode;
  children: React.ReactNode;
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
    if (isComponentNode(node)) {
      const Wrapper = ComponentWrapper ?? React.Fragment;
      return (
        <Wrapper node={node} key={node.key}>
          <OptimizelyComponent opti={node.component} />
        </Wrapper>
      );
    }

    const { type, nodes } = node;

    if (type === null) {
      // TODO: Error handling
      return <div>???</div>;
    }

    const Component = componentRegistry.getComponent(type);

    if (!Component) {
      throw new Error(`No component defined for content type ${type}`);
    }

    return <Component key={node.key} opti={node} />;
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
}) {
  if (!nodes) {
    // TODO: Handle beter
    throw new Error('Nodes must be an array');
  }
  return nodes.map((node, i) => {
    if (isComponentNode(node)) {
      return <OptimizelyComponent key={node.key} opti={node.component} />;
    }

    const { nodes, nodeType } = node;

    const mapper: Record<string, StructureContainer> = { row, column };

    // TODO: default component
    const Component = mapper[nodeType] ?? React.Fragment;

    return (
      <Component node={node} index={i} key={node.key}>
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
