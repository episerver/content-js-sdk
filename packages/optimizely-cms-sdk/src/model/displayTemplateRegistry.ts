import {
  DisplaySettingsInput,
  DisplayTemplateConfig,
} from './displayTemplates.js';

type DisplayTemplateRegistry = {
  name: string;
  template: DisplaySettingsInput;
  tag?: string; // Optional tag property to store the name of the React component
};

let _registry: DisplayTemplateRegistry[] = [];

/** Initializes the displayTemplate registry */
export function init(registry: DisplayTemplateConfig[]) {
  _registry = registry.map(({ displayName, template, tag }) => ({
    name: displayName,
    template: template,
    tag,
  }));
}

/** Get the displayTemplate by displayTemplate name */
export function getDisplayTemplate(
  name: string
): DisplayTemplateRegistry | undefined {
  const result = _registry.find((c) => c.name === name);
  return result;
}
/** Get all the display displayTemplates */
export function getAllDisplayTemplate(): {
  name: string;
  template: DisplaySettingsInput;
}[] {
  return _registry;
}
