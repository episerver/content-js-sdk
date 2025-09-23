import React, { type ReactElement } from 'react';
import {
  BaseFrameworkAdapter,
  type AdapterConfig,
} from '../../components/richText/adapter.js';
import {
  defaultElementTypeMap,
  defaultMarkTypeMap,
} from '../../components/richText/renderer.js';

/**
 * React implementation of the framework adapter
 */
export class ReactAdapter extends BaseFrameworkAdapter<ReactElement> {
  readonly name = 'react';

  createTextElement(
    content: string,
    marks: string[],
    config: AdapterConfig
  ): ReactElement {
    let element: ReactElement = React.createElement('span', {}, content);

    // Apply marks by wrapping with appropriate elements
    for (const mark of marks) {
      const tag = this.getMarkTag(mark, config);
      element = React.createElement(tag, {}, element);
    }

    return element;
  }

  createElement(
    type: string,
    attributes: Record<string, unknown>,
    children: ReactElement[],
    config: AdapterConfig
  ): ReactElement {
    const tag = this.getElementTag(type, config);
    return React.createElement(tag, attributes, ...children);
  }

  wrapWithMark(
    element: ReactElement,
    mark: string,
    config: AdapterConfig
  ): ReactElement {
    const tag = this.getMarkTag(mark, config);
    return React.createElement(tag, {}, element);
  }

  private getElementTag(type: string, config: AdapterConfig): string {
    // Check user overrides first
    const userMapping = config.elementMap?.[type] as string | undefined;
    if (userMapping) return userMapping;

    // Check defaults
    const defaultMapping = defaultElementTypeMap[type];
    if (defaultMapping) return defaultMapping.tag;

    // Use fallback
    return config.elementFallback || 'div';
  }

  private getMarkTag(mark: string, config: AdapterConfig): string {
    // Check user overrides first
    const userMapping = config.markMap?.[mark] as string | undefined;
    if (userMapping) return userMapping;

    // Check defaults
    const defaultMapping = defaultMarkTypeMap[mark];
    if (defaultMapping) return defaultMapping;

    // Use fallback
    return config.markFallback || 'span';
  }
}

/**
 * Create a pre-configured React adapter instance
 */
export function createReactAdapter(): ReactAdapter {
  return new ReactAdapter();
}
