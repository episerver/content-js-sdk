/**
 * Maps the friendly handler names an application passes to `initForms` onto the
 * Optimizely Forms content type keys the registry is keyed by.
 *
 * @module
 */

/** A component, or a default plus tagged variants, as the registry accepts them. */
export type FormComponentEntry<C> =
  | C
  | {
      default?: C;
      tags: Record<string, C>;
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

export type FormHandlers<C> = Partial<Record<FormHandlerKey, FormComponentEntry<C>>>;

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

export const mapFormHandlersToContentTypes = <C>(
  handlers: FormHandlers<C>,
): Record<string, FormComponentEntry<C>> =>
  Object.entries(handlers)
    .filter(([, component]) => component)
    .reduce(
      (acc, [handlerKey, component]) => ({
        ...acc,
        [FORM_HANDLER_TO_CONTENT_TYPE[handlerKey as FormHandlerKey]]: component,
      }),
      {} as Record<string, FormComponentEntry<C>>,
    );
