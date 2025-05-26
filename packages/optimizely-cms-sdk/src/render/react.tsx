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
};

let context: Context = {
  edit: false,
  preview: false,
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
}

export function getPreviewAttrs<T extends string>(property: T): any {
  if (context.edit) {
    return {
      'data-epi-property-name': property,
    };
  }
}

export type StructureWrapperProps = {
  node: ExperienceStructureNode;
  children: React.ReactNode;
  index?: number;
};
export type ComponentWrapperProps = {
  node: ExperienceComponentNode;
  children: React.ReactNode;
};
export type StructureWrapper = (props: StructureWrapperProps) => JSX.Element;
export type ComponentWrapper = (props: ComponentWrapperProps) => JSX.Element;

export async function OptimizelyExperience({
  node,
  ComponentWrapper,
}: {
  node: ExperienceNode;
  ComponentWrapper?: ComponentWrapper;
}) {
  if (isComponentNode(node)) {
    const Wrapper = ComponentWrapper ?? React.Fragment;
    return (
      <Wrapper node={node}>
        <OptimizelyComponent opti={node.component} />;
      </Wrapper>
    );
  }

  const { type, nodes } = node;

  if (type === null) {
    // Not handle
    return <div>???</div>;
  }

  const Component = await componentRegistry.getComponent(type);

  // TODO: pass the correct properties
  return <Component opti={{ nodes }} />;
}

export function OptimizelySection({
  nodes,
  wrappers,
}: {
  nodes: ExperienceNode[];
  wrappers: Record<string, StructureWrapper>;
}) {
  return nodes.map((node, i) => {
    if (isComponentNode(node)) {
      return <OptimizelyComponent opti={node.component} />;
    }

    const { nodes, nodeType, type } = node;

    const Component = wrappers[nodeType];

    return (
      <Component node={node} index={i}>
        <OptimizelySection nodes={nodes} wrappers={wrappers} />
      </Component>
    );
  });
}
