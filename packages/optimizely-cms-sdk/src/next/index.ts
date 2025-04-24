// Specific functions for Next.js
import { AnyContentType } from '../model/contentTypes';
import { ComponentResolver } from '../render/component-registry';

import { initContentTypeRegistry } from '../model';
import { initReactComponentRegistry } from '../render/react';

type ComponentType = React.ComponentType<any>;

type Options = {
  contentTypes: AnyContentType[];
  componentResolver: ComponentResolver<ComponentType>;
};

/**
 * Initializes the Optimizely CMS SDK for Next.js
 */
export function init({ contentTypes, componentResolver }: Options) {
  initContentTypeRegistry(contentTypes);
  initReactComponentRegistry({ resolver: componentResolver });
}
