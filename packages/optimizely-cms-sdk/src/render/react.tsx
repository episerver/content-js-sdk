'use server';
import type React from 'react';
import { ComponentRegistry, ComponentResolver } from './componentRegistry';

type ComponentType = React.ComponentType<any>;

let componentRegistry: ComponentRegistry<ComponentType>;
let isEdit = false;

type InitOptions = {
  resolver: ComponentResolver<ComponentType>;
};

type Props = {
  opti: {
    __typename: string;
  };
  [key: string]: any;
};

export function initReactComponentRegistry(options: InitOptions) {
  componentRegistry = new ComponentRegistry(options.resolver);
}

export function setPreviewMode(params: Record<string, any>) {
  isEdit = params && params.ctx === 'edit';
}

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

export function getOptiProps(prop: any) {
  if (!isEdit) {
    return {};
  }

  if (typeof prop === 'string') {
    return {
      'data-epi-edit': prop,
    };
  }

  return {};
}
