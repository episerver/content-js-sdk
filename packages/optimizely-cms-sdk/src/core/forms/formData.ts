/**
 * `FormData` fix-ups applied between collecting a form and sending it.
 *
 * @module
 */

/**
 * Drops the blank entry when a field name appears on more than one step and at
 * least one of them was filled in.
 *
 * Every step stays in the DOM, so a name reused across steps reaches `FormData`
 * once per step and the blank ones would otherwise shadow the real answer.
 */
export function dropShadowedBlanks(formData: FormData): FormData {
  const answered = new Set(
    [...formData].filter(([, value]) => value !== '').map(([name]) => name),
  );

  [...formData]
    .filter(([name, value]) => value === '' && answered.has(name))
    .forEach(([name]) => {
      const kept = formData.getAll(name).filter(value => value !== '');
      formData.delete(name);
      kept.forEach(value => formData.append(name, value));
    });

  return formData;
}
