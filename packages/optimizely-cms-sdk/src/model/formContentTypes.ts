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

// TODO: this should be a section not a component, but currently section-related issue prevent this
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

// TODO: remove this when above is resolved
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
