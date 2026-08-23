import { ContentProps, ExperienceNode } from '../infer.js';
import { contentType } from './index.js';

export const OptiFormsTextboxElementContentType = contentType({
  key: 'OptiFormsTextboxElement',
  displayName: 'Textbox',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: {
    Label: { type: 'string' },
    Placeholder: { type: 'string' },
    Tooltip: { type: 'string' },
    PredefinedValue: { type: 'string' },
    Validators: { type: 'json' },
    AutoComplete: { type: 'string' },
    SubmissionFieldName: { type: 'string' },
  },
});

export const OptiFormsTextareaElementContentType = contentType({
  key: 'OptiFormsTextareaElement',
  displayName: 'Textarea',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: {
    Label: { type: 'string' },
    Placeholder: { type: 'string' },
    Tooltip: { type: 'string' },
    PredefinedValue: { type: 'string' },
    Validators: { type: 'json' },
    AutoComplete: { type: 'string' },
    SubmissionFieldName: { type: 'string' },
  },
});

export const OptiFormsNumberElementContentType = contentType({
  key: 'OptiFormsNumberElement',
  displayName: 'Number',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: {
    Label: { type: 'string' },
    Placeholder: { type: 'string' },
    Tooltip: { type: 'string' },
    PredefinedValue: { type: 'string' },
    Validators: { type: 'json' },
    AutoComplete: { type: 'string' },
    SubmissionFieldName: { type: 'string' },
  },
});

export const OptiFormsRangeElementContentType = contentType({
  key: 'OptiFormsRangeElement',
  displayName: 'Range',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: {
    Label: { type: 'string' },
    Tooltip: { type: 'string' },
    PredefinedValue: { type: 'string' },
    Min: { type: 'integer' },
    Max: { type: 'integer' },
    Increment: { type: 'integer' },
    SubmissionFieldName: { type: 'string' },
  },
});

export const OptiFormsUrlElementContentType = contentType({
  key: 'OptiFormsUrlElement',
  displayName: 'URL',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: {
    Label: { type: 'string' },
    Placeholder: { type: 'string' },
    Tooltip: { type: 'string' },
    PredefinedValue: { type: 'string' },
    Validators: { type: 'json' },
    SubmissionFieldName: { type: 'string' },
  },
});

export const OptiFormsChoiceElementContentType = contentType({
  key: 'OptiFormsChoiceElement',
  displayName: 'Multiple or single choice',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: {
    Label: { type: 'string' },
    Tooltip: { type: 'string' },
    Options: { type: 'json' },
    AllowMultiSelect: { type: 'boolean' },
    Validators: { type: 'json' },
    SubmissionFieldName: { type: 'string' },
  },
});

export const OptiFormsSelectionElementContentType = contentType({
  key: 'OptiFormsSelectionElement',
  displayName: 'Selection',
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
    SubmissionFieldName: { type: 'string' },
  },
});

export const OptiFormsSubmitElementContentType = contentType({
  key: 'OptiFormsSubmitElement',
  displayName: 'Submit button',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: {
    Label: { type: 'string' },
    Tooltip: { type: 'string' },
  },
});

export const OptiFormsResetElementContentType = contentType({
  key: 'OptiFormsResetElement',
  displayName: 'Reset button',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: {
    Label: { type: 'string' },
    Tooltip: { type: 'string' },
  },
});

export const OptiFormsConditionContentType = contentType({
  key: 'OptiFormsCondition',
  displayName: 'Condition',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: {
    DependsOnField: { type: 'string' },
    ComparisonOperator: { type: 'string' },
    ComparisonValue: { type: 'string' },
  },
});

export const OptiFormsDependencyRuleContentType = contentType({
  key: 'OptiFormsDependencyRule',
  displayName: 'Rule',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  properties: {
    TargetElement: { type: 'string' },
    SatisfiedAction: { type: 'string' },
    ConditionCombination: { type: 'string' },
    Conditions: {
      type: 'array',
      items: {
        type: 'component',
        contentType: OptiFormsConditionContentType,
      },
    },
  },
});

export const OptiFormsContainerDataContentType = contentType({
  key: 'OptiFormsContainerData',
  displayName: 'Form Container',
  baseType: '_component',
  compositionBehaviors: ['sectionEnabled'],
  properties: {
    Title: { type: 'string' },
    Description: { type: 'string' },
    ShowSummaryMessageAfterSubmission: { type: 'boolean' },
    SubmitConfirmationMessage: { type: 'string' },
    ResetConfirmationMessage: { type: 'string' },
    SubmitUrl: { type: 'url' },
    DependencyRules: {
      type: 'array',
      items: {
        type: 'component',
        contentType: OptiFormsDependencyRuleContentType,
      },
    },
  },
});

export type OptiFormsContainerContentType = ContentProps<
  typeof OptiFormsContainerDataContentType
> & { nodes?: ExperienceNode[] };

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
  OptiFormsDependencyRuleContentType,
  OptiFormsConditionContentType,
];

const FORM_CONTENT_TYPE_KEYS: ReadonlySet<string> = new Set(
  FormContentTypes.map(type => type.key),
);

/**
 * True for the content types `initForms` registers.
 *
 * Used to keep the form fragments out of queries for pages that have no form on
 * them. They are registered globally, so without this every experience query
 * would carry them.
 */
export const isFormContentType = (key: string): boolean =>
  FORM_CONTENT_TYPE_KEYS.has(key);
