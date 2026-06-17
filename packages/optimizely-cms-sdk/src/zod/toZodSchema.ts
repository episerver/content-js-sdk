import { z } from 'zod';
import type { AnyContentType, ContentType } from '../model/contentTypes.js';
import type {
  AnyProperty,
  ArrayProperty,
  ArrayItems,
  FloatProperty,
  IntegerProperty,
  StringProperty,
} from '../model/properties.js';
import { getContentType } from '../model/contentTypeRegistry.js';

export type ZodSchemaOptions = {
  strict?: boolean;
};

const urlSchema = z.object({
  type: z.string().nullable(),
  default: z.string().nullable(),
  hierarchical: z.string().nullable(),
  internal: z.string().nullable(),
  graph: z.string().nullable(),
  base: z.string().nullable(),
}).passthrough();

const richTextSchema = z.object({
  html: z.string(),
  json: z.object({
    type: z.literal('richText'),
    children: z.array(z.any()),
  }),
});

const contentReferenceSchema = z.object({
  url: urlSchema,
  item: z.any().nullable(),
  key: z.string(),
}).passthrough();

const linkSchema = z.object({
  text: z.string().nullable(),
  title: z.string().nullable(),
  target: z.string().nullable(),
  url: urlSchema,
}).passthrough();

const contentMetadataSchema = z.object({
  key: z.string(),
  locale: z.string(),
  fallbackForLocale: z.string(),
  version: z.string(),
  displayName: z.string(),
  url: urlSchema,
  types: z.array(z.string()),
  published: z.string(),
  status: z.string(),
  created: z.string(),
  lastModified: z.string(),
  sortOrder: z.number(),
  variation: z.string(),
  // InferredInstanceMetadata (partial)
  changeset: z.string().nullable().optional(),
  locales: z.array(z.string()).optional(),
  expired: z.string().nullable().optional(),
  container: z.string().nullable().optional(),
  owner: z.string().nullable().optional(),
  routeSegment: z.string().nullable().optional(),
  lastModifiedBy: z.string().nullable().optional(),
  path: z.array(z.string()).optional(),
  createdBy: z.string().nullable().optional(),
  // InferredItemMetadata (partial)
  displayOption: z.string().nullable().optional(),
}).passthrough();

type DisplaySetting = {
  key: string;
  value: string;
};

type ExperienceCompositionNode = {
  __typename: string;
  __context?: { edit: boolean; preview_token: string };
  type: string | null;
  key: string;
  layoutType: string | null;
  displayName: string;
  displayTemplateKey: string | null;
  displaySettings: DisplaySetting[] | null;
};

type ExperienceNode = ExperienceCompositionNode & {
  nodeType: string;
  nodes?: ExperienceNode[];
  component?: { __typename: string };
};

type ExperienceStructureNode = ExperienceCompositionNode & {
  nodeType: string;
  nodes?: ExperienceNode[];
};

const displaySettingsSchema = z.object({
  key: z.string(),
  value: z.string(),
});

const experienceCompositionNodeSchema = z.object({
  __typename: z.string(),
  __context: z.object({ edit: z.boolean(), preview_token: z.string() }).optional(),
  type: z.string().nullable(),
  key: z.string(),
  layoutType: z.string().nullable(),
  displayName: z.string(),
  displayTemplateKey: z.string().nullable(),
  displaySettings: z.array(displaySettingsSchema).nullable(),
}).passthrough();

const experienceNodeSchema: z.ZodSchema<ExperienceNode> = z.lazy(() =>
  experienceCompositionNodeSchema.and(z.object({
    nodeType: z.string(),
    nodes: z.array(experienceNodeSchema).optional(),
    component: z.object({ __typename: z.string() }).optional(),
  }).passthrough()),
);

const experienceStructureNodeSchema: z.ZodSchema<ExperienceStructureNode> = z.lazy(() =>
  experienceCompositionNodeSchema.and(z.object({
    nodeType: z.string(),
    nodes: z.array(experienceNodeSchema).optional(),
  }).passthrough()),
);

const baseSchema = z.object({
  _id: z.string(),
  _metadata: contentMetadataSchema,
  __typename: z.string(),
  __context: z.object({ edit: z.boolean(), preview_token: z.string() }).optional(),
  __composition: experienceNodeSchema.optional(),
}).passthrough();

function buildStringSchema(property: StringProperty) {
  let schema: z.ZodString = z.string();
  if (property.pattern) schema = schema.regex(new RegExp(property.pattern));
  if (property.minLength !== undefined) schema = schema.min(property.minLength);
  if (property.maxLength !== undefined) schema = schema.max(property.maxLength);

  if (property.enum && property.enum.length > 0) {
    const values = property.enum.map(e => e.value);
    return z.enum(values as [string, ...string[]]);
  }

  return schema;
}

function buildIntegerSchema(property: IntegerProperty) {
  let schema = z.number().int();
  if (property.minimum !== undefined) schema = schema.min(property.minimum);
  if (property.maximum !== undefined) schema = schema.max(property.maximum);

  if (property.enum && property.enum.length > 0) {
    const values = property.enum.map(e => e.value);
    return z.number().int().refine(v => values.includes(v));
  }

  return schema;
}

function buildFloatSchema(property: FloatProperty) {
  let schema = z.number();
  if (property.minimum !== undefined) schema = schema.min(property.minimum);
  if (property.maximum !== undefined) schema = schema.max(property.maximum);

  if (property.enum && property.enum.length > 0) {
    const values = property.enum.map(e => e.value);
    return z.number().refine(v => values.includes(v));
  }

  return schema;
}

function buildComponentSchema(contentType: AnyContentType, visited: Set<string>) {
  if (visited.has(contentType.key)) {
    return z.lazy(() => buildComponentSchema(contentType, new Set()));
  }

  visited.add(contentType.key);
  const shape: Record<string, z.ZodTypeAny> = {};

  if (contentType.properties) {
    for (const [key, prop] of Object.entries(contentType.properties)) {
      if (prop.indexingType === 'disabled') continue;
      shape[key] = propertyToZodSchema(prop, visited).nullable();
    }
  }

  return z.object(shape).passthrough();
}

function buildArraySchema(property: ArrayProperty<ArrayItems>, visited: Set<string>) {
  const innerSchema = propertyToZodSchema(property.items, visited);
  let schema = z.array(innerSchema);
  if (property.minItems !== undefined) schema = schema.min(property.minItems);
  if (property.maxItems !== undefined) schema = schema.max(property.maxItems);
  return schema;
}

function propertyToZodSchema(property: AnyProperty, visited: Set<string>) {
  switch (property.type) {
    case 'string':
      return buildStringSchema(property);
    case 'boolean':
      return z.boolean();
    case 'integer':
      return buildIntegerSchema(property);
    case 'float':
      return buildFloatSchema(property);
    case 'dateTime':
      return z.string();
    case 'binary':
      return z.unknown();
    case 'json':
      return z.any();
    case 'richText':
      return richTextSchema;
    case 'url':
      return urlSchema;
    case 'link':
      return linkSchema;
    case 'contentReference':
      return contentReferenceSchema;
    case 'content':
      return z.object({ __typename: z.string(), __viewname: z.string() }).passthrough();
    case 'component': {
      const ct = typeof property.contentType === 'string'
        ? getContentType(property.contentType)
        : property.contentType;
      if (ct) {
        return buildComponentSchema(ct, visited);
      }
      return z.object({}).passthrough();
    }
    case 'array':
      return buildArraySchema(property, visited);
    default:
      return z.unknown();
  }
}

/**
 * Generates a Zod schema from a content type definition.
 * The schema validates objects matching the shape returned by Graph for this content type.
 *
 * Requires `zod` to be installed as a peer dependency.
 *
 * @example
 * ```typescript
 * import { contentType } from '@optimizely/cms-sdk';
 * import { toZodSchema } from '@optimizely/cms-sdk/zod';
 *
 * const Article = contentType({
 *   key: 'Article', baseType: '_page', displayName: 'Article',
 *   properties: { title: { type: 'string' }, body: { type: 'richText' } }
 * });
 *
 * const schema = toZodSchema(Article);
 * const result = schema.safeParse(data);
 * if (result.success) {
 *   console.log(result.data.title);
 * }
 * ```
 */
export function toZodSchema<T extends AnyContentType>(
  ct: T | ContentType<T>,
  options?: ZodSchemaOptions,
) {
  const visited = new Set<string>();
  visited.add(ct.key);

  const propertyShape: Record<string, z.ZodTypeAny> = {};

  if (ct.properties) {
    for (const [key, prop] of Object.entries(ct.properties)) {
      if (prop.indexingType === 'disabled') continue;
      propertyShape[key] = propertyToZodSchema(prop, visited).nullable();
    }
  }

  let schema = baseSchema.extend(propertyShape);

  if (ct.baseType === '_experience') {
    schema = schema.extend({
      composition: experienceStructureNodeSchema,
    });
  }

  if (ct.baseType === '_section') {
    schema = schema.extend({
      key: z.string(),
      nodes: z.array(experienceNodeSchema),
    });
  }

  if (options?.strict) {
    return schema.strict();
  }

  return schema;
}
