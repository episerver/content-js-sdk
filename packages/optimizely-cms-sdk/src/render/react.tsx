'use server';
import type React from 'react';
import { ComponentRegistry, ComponentResolver } from './component-registry';

type ComponentType = React.ComponentType<any>;

let componentRegistry: ComponentRegistry<ComponentType>;

type InitOptions = {
  resolver: ComponentResolver<ComponentType>;
};

type Props = {
  opti: {
    __typename: string;
  };
};

export function initReactComponentRegistry(options: InitOptions) {
  componentRegistry = new ComponentRegistry(options.resolver);
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
