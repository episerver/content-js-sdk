import React from 'react';

type ComponentType = React.ComponentType<any>;

type FormComponentEntry =
  | ComponentType
  | {
      default?: ComponentType;
      tags: Record<string, ComponentType>;
    };

type FormHandlerKey =
  | 'container'
  | 'textbox'
  | 'textarea'
  | 'number'
  | 'range'
  | 'url'
  | 'choice'
  | 'selection'
  | 'submit'
  | 'reset'
  | 'rule';

export type FormHandlers = Partial<Record<FormHandlerKey, FormComponentEntry>>;

export const FORM_HANDLER_TO_CONTENT_TYPE: Record<FormHandlerKey, string> = {
  container: 'OptiFormsContainerData',
  textbox: 'OptiFormsTextboxElement',
  textarea: 'OptiFormsTextareaElement',
  number: 'OptiFormsNumberElement',
  range: 'OptiFormsRangeElement',
  url: 'OptiFormsUrlElement',
  choice: 'OptiFormsChoiceElement',
  selection: 'OptiFormsSelectionElement',
  submit: 'OptiFormsSubmitElement',
  reset: 'OptiFormsResetElement',
  rule: 'OptiFormsDependencyRuleProperty',
};

export const mapFormHandlersToContentTypes = (
  handlers: FormHandlers,
): Record<string, FormComponentEntry> =>
  Object.entries(handlers).reduce(
    (acc, [handlerKey, component]) => {
      const contentTypeKey = FORM_HANDLER_TO_CONTENT_TYPE[handlerKey as FormHandlerKey];
      return contentTypeKey && component ? { ...acc, [contentTypeKey]: component } : acc;
    },
    {} as Record<string, FormComponentEntry>,
  );
