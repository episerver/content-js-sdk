import { DisplayTemplateConfig, StylesInput } from './displayTemplates.js';

let _registry: { name: string; template: StylesInput }[] = [];

/** Initializes the displayTemplate registry */
export function init(registry: DisplayTemplateConfig[]) {
  _registry = registry.map(({ displayName, template }) => ({
    name: displayName,
    template: template,
  }));
}

/** Get the displayTemplate by displayTemplate name */
export function getDisplayTemplate(name: string) {
  const result = _registry.find((c) => c.name === name);
  return result?.template;
}
/** Get all the display displayTemplates */
export function getAllDisplayTemplate(): {
  name: string;
  template: StylesInput;
}[] {
  return _registry;
}
