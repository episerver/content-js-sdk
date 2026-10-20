/**
 * The React view of {@link ../../core/forms/setup.js}: the same mapping, with the
 * component type pinned to a React component.
 *
 * @module
 */

import type { ComponentType as ReactComponentType } from 'react';
import type {
  FormComponentEntry as CoreFormComponentEntry,
  FormHandlers as CoreFormHandlers,
} from '../../core/forms/setup.js';

export {
  FORM_HANDLER_TO_CONTENT_TYPE,
  mapFormHandlersToContentTypes,
} from '../../core/forms/setup.js';

export type ComponentType = ReactComponentType<any>;
export type FormComponentEntry = CoreFormComponentEntry<ComponentType>;
export type FormHandlers = CoreFormHandlers<ComponentType>;
