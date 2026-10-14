import { describe, expect, test } from 'vitest';
import { FORM_HANDLER_TO_CONTENT_TYPE, mapFormHandlersToContentTypes } from '../forms/setup.js';
import { FormContentTypes } from '../../model/formContentTypes.js';

describe('mapFormHandlersToContentTypes', () => {
  test('maps every handler key to its Optimizely Forms content type', () => {
    const handlers = Object.fromEntries(
      Object.keys(FORM_HANDLER_TO_CONTENT_TYPE).map(handlerKey => [handlerKey, `${handlerKey}-component`]),
    );

    expect(mapFormHandlersToContentTypes(handlers)).toEqual({
      OptiFormsContainerData: 'container-component',
      OptiFormsTextboxElement: 'textbox-component',
      OptiFormsTextareaElement: 'textarea-component',
      OptiFormsNumberElement: 'number-component',
      OptiFormsRangeElement: 'range-component',
      OptiFormsUrlElement: 'url-component',
      OptiFormsChoiceElement: 'choice-component',
      OptiFormsSelectionElement: 'selection-component',
      OptiFormsSubmitElement: 'submit-component',
      OptiFormsResetElement: 'reset-component',
    });
  });

  test('every target is a registered Forms content type', () => {
    const formKeys = FormContentTypes.map(it => it.key);

    Object.values(FORM_HANDLER_TO_CONTENT_TYPE).forEach(key => expect(formKeys).toContain(key));
  });

  test('passes an entry with tagged variants through as is', () => {
    const submit = { default: 'Submit', tags: { primary: 'PrimarySubmit' } };

    expect(mapFormHandlersToContentTypes({ submit })).toEqual({ OptiFormsSubmitElement: submit });
  });

  test('drops handlers that are not set', () => {
    expect(
      mapFormHandlersToContentTypes({ textbox: 'Textbox', submit: undefined, reset: null as never }),
    ).toEqual({ OptiFormsTextboxElement: 'Textbox' });
  });
});
