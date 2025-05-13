'use server';
import type React from 'react';
import { ComponentRegistry, ComponentResolver } from './componentRegistry';

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
