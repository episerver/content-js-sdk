'use server';
import React from 'react';
import { ComponentRegistry, ComponentResolver } from './componentRegistry';
import { JSX } from 'react';
import {
  ExperienceStructureNode,
  ExperienceNode,
  ExperienceComponentNode,
} from '../infer';
import { isComponentNode } from '../util/baseTypeUtil';

type ComponentType = React.ComponentType<any>;

// Mapping content type names with Components.
// This is a single global object used across the entire request
let componentRegistry: ComponentRegistry<ComponentType>;

type InitOptions = {
  resolver: ComponentResolver<ComponentType>;
};

// Rendering context information
type Context = {
  edit: boolean;
  preview: boolean;
  preview_token?: string;
};

let context: Context = {
  edit: false,
  preview: false,
  preview_token: undefined,
};

export function initReactComponentRegistry(options: InitOptions) {
  componentRegistry = new ComponentRegistry(options.resolver);
}

type Props = {
  opti: {
    __typename: string;
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

  return <Component opti={opti} {...props} />;
}

export function setContext(ctx: Partial<Context>) {
  if (ctx.preview !== undefined) {
    context.preview = ctx.preview;
  }

  if (ctx.edit !== undefined) {
    context.edit = ctx.edit;
  }

  if (ctx.preview_token !== undefined) {
    context.preview_token = ctx.preview_token;
  }
}

export function getPreviewAttrs<T extends string>(property: T): any {
  if (context.edit) {
    return {
      'data-epi-property-name': property,
    };
  }
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
          <OptimizelyComponent opti={node.component} />;
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

    return <Component key={node.key} opti={{ nodes }} />;
  });
}

export function OptimizelyGridSection({
  nodes,
  row,
  column,
}: {
  nodes: ExperienceNode[];
  row: StructureContainer;
  column: StructureContainer;
}) {
  return nodes.map((node, i) => {
    if (isComponentNode(node)) {
      return <OptimizelyComponent key={node.key} opti={node.component} />;
    }

    const { nodes, nodeType } = node;

    const mapper: Record<string, StructureContainer> = { row, column };

    // TODO: default component
    const Component = mapper[nodeType] ?? React.Fragment;

    return (
      <Component node={node} index={i}>
        <OptimizelyGridSection row={row} column={column} nodes={nodes} />
      </Component>
    );
  });
}

/**
 * Appends the `preview_token` from the context to the provided image URL, if available.
 * @param url The url for the image source
 * @returns The updated image URL with the `preview_token` query parameter appended, or the original URL if no token is present.
 */
export function getSecureImageSrc(url: string): string {
  const token = context.preview_token;
  if (!token) return url;

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}preview_token=${token}`;
}
