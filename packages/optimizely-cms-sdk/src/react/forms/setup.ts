import React from 'react';

export type ComponentType = React.ComponentType<any>;

export type FormComponentEntry =
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
  | 'reset';

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
};

export const mapFormHandlersToContentTypes = (
  handlers: FormHandlers,
): Record<string, FormComponentEntry> =>
  Object.entries(handlers)
    .filter(([, component]) => component)
    .reduce(
      (acc, [handlerKey, component]) => ({
        ...acc,
        [FORM_HANDLER_TO_CONTENT_TYPE[handlerKey as FormHandlerKey]]: component,
      }),
      {} as Record<string, FormComponentEntry>,
    );
