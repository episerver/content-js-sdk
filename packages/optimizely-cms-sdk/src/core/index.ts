/**
 * The framework-agnostic core of the SDK.
 *
 * Everything the React components do is available here as plain functions and
 * stores, with no framework and no DOM beyond what a browser always provides.
 * A framework binding is expected to be a thin layer over this module: see
 * `docs/16-framework-agnostic-core.md`.
 *
 * @module
 */

// Observable store primitive
export type { ReadableStore } from './store.js';

// Component registry
export { ComponentRegistry } from '../render/componentRegistry.js';
export type { ComponentResolverOrObject } from '../render/componentRegistry.js';
export {
  initComponentRegistry,
  initForms,
  hasComponentRegistry,
  resolveComponent,
} from './render/registry.js';

// Content resolution
export { resolveContentComponent } from './render/resolve.js';
export type { OptimizelyContent, ResolvedContentComponent } from './render/resolve.js';

// Composition planning
export { planComposition, planGridSection } from './render/plan.js';
export type {
  RenderItem,
  ComponentRenderItem,
  StructureRenderItem,
  UnknownRenderItem,
  ParsedDisplaySettings,
} from './render/plan.js';

// Preview
export { getPreviewUtils } from './preview/attributes.js';
export { createContentSavedListener } from './preview/contentSaved.js';
export type {
  ContentSavedEvent,
  ContentSavedListener,
  ContentSavedListenerOptions,
  NavigateCallback,
} from './preview/contentSaved.js';

// Context
export {
  configureAdapter,
  getAdapter,
  hasAdapter,
  getContext,
  setContext,
  getContextData,
  setContextData,
  initializeRequestContext,
} from '../context/config.js';
export { MemoryAdapter } from './context/memoryAdapter.js';
export type { AsyncContextStorage } from './context/memoryAdapter.js';
export type { ContextAdapter, ContextData } from '../context/baseContext.js';

// Forms
export { createFormController, createSubmissionStore } from './forms/controller.js';
export type {
  FormController,
  FormControllerOptions,
  FormControllerSettings,
  FormState,
  FormEffects,
  FormStatus,
  FormSubmitHandler,
  StepRules,
  SubmissionState,
  SubmissionStore,
} from './forms/controller.js';
export {
  defineFormField,
  computeFieldState,
  buildFieldProps,
  buildErrorProps,
} from './forms/field.js';
export type {
  FormFieldContent,
  FormFieldDefinition,
  FormFieldState,
  DefineFormFieldOptions,
} from './forms/field.js';
export { buildButtonProps } from './forms/button.js';
export { getJumpTarget, isElementVisible, isStepVisible } from './forms/rules.js';
export type { DependencyRule, DependencyCondition, ElementId } from './forms/rules.js';
export { dropShadowedBlanks } from './forms/formData.js';
export { createJsonSubmitHandler } from './forms/jsonSubmitHandler.js';
export { getElementIds } from './forms/elementId.js';
export { mapFormHandlersToContentTypes } from './forms/setup.js';
export type { FormHandlers, FormComponentEntry } from './forms/setup.js';
export { getFormButtonRole, DEFAULT_STEP_BUTTON_LABELS } from '../forms/buttonRole.js';
export type {
  FormButtonRole,
  FormButtonContent,
  FormButtonLabelOptions,
} from '../forms/buttonRole.js';
export { isFormButtonNode, partitionFormNodes } from '../forms/nodes.js';
export * from '../forms/validation.js';

// Rich text
export { BaseRichTextRenderer } from '../components/richText/base.js';
export type { BaseRendererConfig } from '../components/richText/base.js';
export {
  buildRenderTree,
  resolveRichTextNodes,
  createElementData,
  defaultElementTypeMap,
  defaultMarkTypeMap,
} from '../components/richText/renderer.js';
export type {
  Node,
  Element,
  Text,
  RenderNode,
  RendererConfig,
  ElementType,
  MarkType,
  HtmlComponentConfig,
  BaseElementRendererProps,
  BaseLeafRendererProps,
  BaseElementMap,
  BaseLeafMap,
  RichTextPropsBase,
  LinkElement,
  ImageElement,
  TableElement,
  TableCellElement,
  GenericElement,
  GenericElementType,
  BaseElement,
} from '../components/richText/renderer.js';
export {
  DUAL_PURPOSE_PROPERTIES,
  isHtmlAttributeContext,
  resolveCssProperty,
  parseStyleString,
  kebabToCamelCase,
  getLinkAttributes,
  getImageAttributes,
} from './richText/attributes.js';

// Experience node types
export type {
  ExperienceNode,
  ExperienceComponentNode,
  ExperienceStructureNode,
  ExperienceCompositionNode,
  DisplaySettingsType,
} from '../infer.js';
