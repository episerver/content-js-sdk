import type { FormSubmitHandler } from './controller.js';

type JsonPayload = Record<string, string | string[]>;

const appendValue = (payload: JsonPayload, key: string, value: string): JsonPayload => {
  const existing = payload[key];
  if (existing === undefined) return { ...payload, [key]: value };
  return { ...payload, [key]: [...(Array.isArray(existing) ? existing : [existing]), value] };
};

// File entries are dropped: they cannot be represented in JSON.
const toJsonPayload = (formData: FormData): JsonPayload =>
  Array.from(formData.entries()).reduce<JsonPayload>(
    (acc, [key, value]) => (typeof value === 'string' ? appendValue(acc, key, value) : acc),
    {},
  );

/**
 * Creates a {@linkcode FormSubmitHandler} that converts `FormData` into a JSON
 * object and POSTs it to `url`.
 *
 * The JSON body is `{ targetUrl, payload, formKey }` where `targetUrl` is the
 * form container's Submit URL (the `action`), `payload` holds the field values,
 * and `formKey` identifies the form.
 *
 * Typical use: point `url` at a same-origin route handler that forwards the
 * payload server-side, avoiding CORS issues with external webhooks.
 *
 * @param url - The endpoint to POST JSON to (e.g. `'/api/forms/submit'`).
 * @param formKey - Optional identifier for the form (e.g. the content key).
 */
export function createJsonSubmitHandler(url: string, formKey?: string): FormSubmitHandler {
  return async (formData, { action }) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetUrl: action,
        payload: toJsonPayload(formData),
        formKey: formKey ?? '',
      }),
    });

    if (!response.ok) throw new Error(`Submission failed with status ${response.status}`);
  };
}
