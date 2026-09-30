import { test, expectTypeOf } from 'vitest';
import type { components } from '../service/apiSchema/openapi-schema-types.js';
import type { ContentTypeProperties } from '../utils/manifest.js';

/**
 * The generated OpenAPI types type `ContentTypeProperty.type` as an open
 * `string`, so a composition property needs no schema regeneration to be
 * pushed. This fails if a future `pnpm update:schema` narrows `type` to an
 * enumeration, or drops a field a composition property relies on.
 */
test('a composition property fits the CMS content type schema', () => {
  expectTypeOf<{
    type: 'composition';
    format: string;
    displayName: string;
    allowedTypes: string[];
    restrictedTypes: string[];
    minItems: number;
    maxItems: number;
  }>().toExtend<components['schemas']['ContentTypeProperty']>();
});

test('the manifest composition property fits it too', () => {
  expectTypeOf<ContentTypeProperties.Composition>().toExtend<
    components['schemas']['ContentTypeProperty']
  >();
});
