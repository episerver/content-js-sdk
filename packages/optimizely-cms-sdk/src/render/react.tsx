'use server';
import type React from 'react';
import { ComponentRegistry, ComponentResolver } from './componentRegistry';
import { JSX } from 'react';
import { ExperienceStructureNode, ExperienceNode } from '../infer';
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

export type ExperienceWrapperProps = {
  node: ExperienceStructureNode;
  children: React.ReactNode;
};
export type ExperienceWrapper = (props: ExperienceWrapperProps) => JSX.Element;

function FallbackComponent({ node }: ExperienceWrapperProps) {
  return <div>Node type {node.nodeType} not supported</div>;
}

export function OptimizelyExperience({
  composition: node,
  Section,
  Row,
  Column,
}: {
  composition: ExperienceNode;
  Row: ExperienceWrapper;
  Column: ExperienceWrapper;
  Section: ExperienceWrapper;
}) {
  if (isComponentNode(node)) {
    return <OptimizelyComponent opti={node.component} />;
  }

  const { nodes, nodeType } = node;
  const components = { Section, Row, Column };

  const mapper: Record<string, ExperienceWrapper> = {
    section: Section,
    row: Row,
    column: Column,
  };

  const Component = mapper[nodeType] ?? FallbackComponent;

  return (
    <Component node={node}>
      {nodes.map((n, i) => (
        <OptimizelyExperience {...components} composition={n} key={i} />
      ))}
    </Component>
  );
}
