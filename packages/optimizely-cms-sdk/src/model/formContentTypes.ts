/**
 * Optimizely Forms content type definitions.
 *
 * Field names and types are derived from the Content Graph introspection
 * schema (the authoritative source), not the CMS REST API.
 */
import { contentType } from './index.js';

// Form Container
export const OptiFormsContainerDataContentType = contentType({
  key: 'OptiFormsContainerData',
  displayName: 'Form Container',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: {
    Title: { type: 'string' },
    Description: { type: 'string' },
    ShowSummaryMessageAfterSubmission: { type: 'boolean' },
    SubmitConfirmationMessage: { type: 'string' },
    ResetConfirmationMessage: { type: 'string' },
    SubmitUrl: { type: 'url' },
  },
});

// Form Elements
export const OptiFormsTextboxElementContentType = contentType({
  key: 'OptiFormsTextboxElement',
  displayName: 'Textbox Element',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: {
    Label: { type: 'string' },
    Placeholder: { type: 'string' },
    Tooltip: { type: 'string' },
    PredefinedValue: { type: 'string' },
    Validators: { type: 'json' },
    AutoComplete: { type: 'string' },
  },
});

export const OptiFormsTextareaElementContentType = contentType({
  key: 'OptiFormsTextareaElement',
  displayName: 'Textarea Element',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: {
    Label: { type: 'string' },
    Placeholder: { type: 'string' },
    Tooltip: { type: 'string' },
    PredefinedValue: { type: 'string' },
    Validators: { type: 'json' },
    AutoComplete: { type: 'string' },
  },
});

export const OptiFormsNumberElementContentType = contentType({
  key: 'OptiFormsNumberElement',
  displayName: 'Number Element',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: {
    Label: { type: 'string' },
    Placeholder: { type: 'string' },
    Tooltip: { type: 'string' },
    PredefinedValue: { type: 'string' },
    Validators: { type: 'json' },
    AutoComplete: { type: 'string' },
  },
});

export const OptiFormsRangeElementContentType = contentType({
  key: 'OptiFormsRangeElement',
  displayName: 'Range Element',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: {
    Label: { type: 'string' },
    Tooltip: { type: 'string' },
    PredefinedValue: { type: 'string' },
    Min: { type: 'integer' },
    Max: { type: 'integer' },
    Increment: { type: 'integer' },
  },
});

export const OptiFormsUrlElementContentType = contentType({
  key: 'OptiFormsUrlElement',
  displayName: 'URL Element',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: {
    Label: { type: 'string' },
    Placeholder: { type: 'string' },
    Tooltip: { type: 'string' },
    PredefinedValue: { type: 'string' },
    Validators: { type: 'json' },
  },
});

export const OptiFormsChoiceElementContentType = contentType({
  key: 'OptiFormsChoiceElement',
  displayName: 'Choice Element',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: {
    Label: { type: 'string' },
    Tooltip: { type: 'string' },
    Options: { type: 'json' },
    AllowMultiSelect: { type: 'boolean' },
    Validators: { type: 'json' },
  },
});

export const OptiFormsSelectionElementContentType = contentType({
  key: 'OptiFormsSelectionElement',
  displayName: 'Selection Element',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: {
    Label: { type: 'string' },
    Placeholder: { type: 'string' },
    Tooltip: { type: 'string' },
    Options: { type: 'json' },
    AllowMultiSelect: { type: 'boolean' },
    Validators: { type: 'json' },
    AutoComplete: { type: 'string' },
  },
});

export const OptiFormsSubmitElementContentType = contentType({
  key: 'OptiFormsSubmitElement',
  displayName: 'Submit Button Element',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: {
    Label: { type: 'string' },
    Tooltip: { type: 'string' },
  },
});

export const OptiFormsResetElementContentType = contentType({
  key: 'OptiFormsResetElement',
  displayName: 'Reset Button Element',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: {
    Label: { type: 'string' },
    Tooltip: { type: 'string' },
  },
});

/** All Optimizely Forms content types */
export const FormContentTypes = [
  OptiFormsContainerDataContentType,
  OptiFormsTextboxElementContentType,
  OptiFormsTextareaElementContentType,
  OptiFormsNumberElementContentType,
  OptiFormsRangeElementContentType,
  OptiFormsUrlElementContentType,
  OptiFormsChoiceElementContentType,
  OptiFormsSelectionElementContentType,
  OptiFormsSubmitElementContentType,
  OptiFormsResetElementContentType,
];
