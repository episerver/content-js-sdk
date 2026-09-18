import type { FormSubmitHandler } from './FormWrapper.js';

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
    const payload: Record<string, string | string[]> = {};
    for (const [key, value] of formData.entries()) {
      if (typeof value !== 'string') continue;
      const existing = payload[key];
      if (existing === undefined) {
        payload[key] = value;
      } else if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        payload[key] = [existing, value];
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetUrl: action,
        payload,
        formKey: formKey ?? '',
      }),
    });

    if (!response.ok) {
      throw new Error(`Submission failed with status ${response.status}`);
    }
  };
}
