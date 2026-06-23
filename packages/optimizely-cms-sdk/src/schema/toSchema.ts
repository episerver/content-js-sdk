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

export type SchemaOptions = {
  strict?: boolean;
};

export type ValidationError = {
  path: string[];
  message: string;
  expected?: string;
  received?: string;
};

export type ParseSuccess<T> = { success: true; data: T };
export type ParseFailure = { success: false; errors: ValidationError[] };
export type ParseResult<T> = ParseSuccess<T> | ParseFailure;

export class SchemaValidationError extends Error {
  constructor(public readonly errors: ValidationError[]) {
    super(`Validation failed with ${errors.length} error(s):\n${errors.map(e => `  [${e.path.join('.')}] ${e.message}`).join('\n')}`);
    this.name = 'SchemaValidationError';
  }
}

export class Schema<T = unknown> {
  constructor(private readonly validate: (data: unknown) => ValidationError[]) {}

  parse(data: unknown): T {
    const errors = this.validate(data);
    if (errors.length > 0) throw new SchemaValidationError(errors);
    return data as T;
  }

  safeParse(data: unknown): ParseResult<T> {
    const errors = this.validate(data);
    if (errors.length > 0) return { success: false, errors };
    return { success: true, data: data as T };
  }
}

function addError(errors: ValidationError[], path: string[], message: string, expected?: string, received?: string) {
  errors.push({ path, message, ...(expected !== undefined && { expected }), ...(received !== undefined && { received }) });
}

function typeOf(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function validateString(value: unknown, property: StringProperty, path: string[], errors: ValidationError[]) {
  if (typeof value !== 'string') {
    addError(errors, path, `Expected string, received ${typeOf(value)}`, 'string', typeOf(value));
    return;
  }

  if (property.enum && property.enum.length > 0) {
    const allowed = property.enum.map(e => e.value);
    if (!allowed.includes(value)) {
      addError(errors, path, `Value "${value}" is not in enum [${allowed.join(', ')}]`);
    }
    return;
  }

  if (property.minLength !== undefined && value.length < property.minLength) {
    addError(errors, path, `String must be at least ${property.minLength} characters`);
  }
  if (property.maxLength !== undefined && value.length > property.maxLength) {
    addError(errors, path, `String must be at most ${property.maxLength} characters`);
  }
  if (property.pattern) {
    const regex = new RegExp(property.pattern);
    if (!regex.test(value)) {
      addError(errors, path, `String does not match pattern ${property.pattern}`);
    }
  }
}

function validateInteger(value: unknown, property: IntegerProperty, path: string[], errors: ValidationError[]) {
  if (typeof value !== 'number') {
    addError(errors, path, `Expected integer, received ${typeOf(value)}`, 'integer', typeOf(value));
    return;
  }
  if (!Number.isInteger(value)) {
    addError(errors, path, `Expected integer, received float`, 'integer', 'float');
    return;
  }

  if (property.enum && property.enum.length > 0) {
    const allowed = property.enum.map(e => e.value);
    if (!allowed.includes(value)) {
      addError(errors, path, `Value ${value} is not in enum [${allowed.join(', ')}]`);
    }
    return;
  }

  if (property.minimum !== undefined && value < property.minimum) {
    addError(errors, path, `Value must be >= ${property.minimum}`);
  }
  if (property.maximum !== undefined && value > property.maximum) {
    addError(errors, path, `Value must be <= ${property.maximum}`);
  }
}

function validateFloat(value: unknown, property: FloatProperty, path: string[], errors: ValidationError[]) {
  if (typeof value !== 'number') {
    addError(errors, path, `Expected number, received ${typeOf(value)}`, 'number', typeOf(value));
    return;
  }

  if (property.enum && property.enum.length > 0) {
    const allowed = property.enum.map(e => e.value);
    if (!allowed.includes(value)) {
      addError(errors, path, `Value ${value} is not in enum [${allowed.join(', ')}]`);
    }
    return;
  }

  if (property.minimum !== undefined && value < property.minimum) {
    addError(errors, path, `Value must be >= ${property.minimum}`);
  }
  if (property.maximum !== undefined && value > property.maximum) {
    addError(errors, path, `Value must be <= ${property.maximum}`);
  }
}

function validateUrl(value: unknown, path: string[], errors: ValidationError[]) {
  if (typeof value !== 'object' || value === null) {
    addError(errors, path, `Expected url object, received ${typeOf(value)}`, 'object', typeOf(value));
  }
}

function validateRichText(value: unknown, path: string[], errors: ValidationError[]) {
  if (typeof value !== 'object' || value === null) {
    addError(errors, path, `Expected richText object, received ${typeOf(value)}`, 'object', typeOf(value));
    return;
  }
  const obj = value as Record<string, unknown>;
  if (typeof obj.html !== 'string') {
    addError(errors, [...path, 'html'], `Expected string, received ${typeOf(obj.html)}`, 'string', typeOf(obj.html));
  }
  if (typeof obj.json !== 'object' || obj.json === null) {
    addError(errors, [...path, 'json'], `Expected object, received ${typeOf(obj.json)}`, 'object', typeOf(obj.json));
  }
}

function validateLink(value: unknown, path: string[], errors: ValidationError[]) {
  if (typeof value !== 'object' || value === null) {
    addError(errors, path, `Expected link object, received ${typeOf(value)}`, 'object', typeOf(value));
  }
}

function validateContentReference(value: unknown, path: string[], errors: ValidationError[]) {
  if (typeof value !== 'object' || value === null) {
    addError(errors, path, `Expected contentReference object, received ${typeOf(value)}`, 'object', typeOf(value));
    return;
  }
  const obj = value as Record<string, unknown>;
  if (typeof obj.key !== 'string') {
    addError(errors, [...path, 'key'], `Expected string, received ${typeOf(obj.key)}`, 'string', typeOf(obj.key));
  }
}

function validateContent(value: unknown, path: string[], errors: ValidationError[]) {
  if (typeof value !== 'object' || value === null) {
    addError(errors, path, `Expected content object, received ${typeOf(value)}`, 'object', typeOf(value));
    return;
  }
  const obj = value as Record<string, unknown>;
  if (typeof obj.__typename !== 'string') {
    addError(errors, [...path, '__typename'], `Expected string, received ${typeOf(obj.__typename)}`, 'string', typeOf(obj.__typename));
  }
  if (typeof obj.__viewname !== 'string') {
    addError(errors, [...path, '__viewname'], `Expected string, received ${typeOf(obj.__viewname)}`, 'string', typeOf(obj.__viewname));
  }
}

function validateComponent(value: unknown, ct: AnyContentType, path: string[], errors: ValidationError[], visited: Set<string>) {
  if (typeof value !== 'object' || value === null) {
    addError(errors, path, `Expected component object, received ${typeOf(value)}`, 'object', typeOf(value));
    return;
  }
  if (visited.has(ct.key)) return;
  visited.add(ct.key);

  const obj = value as Record<string, unknown>;
  if (ct.properties) {
    for (const [key, prop] of Object.entries(ct.properties)) {
      if (prop.indexingType === 'disabled') continue;
      if (obj[key] === null || obj[key] === undefined) continue;
      validateProperty(obj[key], prop, [...path, key], errors, visited);
    }
  }
}

function validateArray(value: unknown, property: ArrayProperty<ArrayItems>, path: string[], errors: ValidationError[], visited: Set<string>) {
  if (!Array.isArray(value)) {
    addError(errors, path, `Expected array, received ${typeOf(value)}`, 'array', typeOf(value));
    return;
  }
  if (property.minItems !== undefined && value.length < property.minItems) {
    addError(errors, path, `Array must have at least ${property.minItems} items`);
  }
  if (property.maxItems !== undefined && value.length > property.maxItems) {
    addError(errors, path, `Array must have at most ${property.maxItems} items`);
  }
  for (let i = 0; i < value.length; i++) {
    validateProperty(value[i], property.items, [...path, String(i)], errors, visited);
  }
}

function validateProperty(value: unknown, property: AnyProperty, path: string[], errors: ValidationError[], visited: Set<string>) {
  if (value === null || value === undefined) return;

  switch (property.type) {
    case 'string':
      validateString(value, property, path, errors);
      break;
    case 'boolean':
      if (typeof value !== 'boolean') {
        addError(errors, path, `Expected boolean, received ${typeOf(value)}`, 'boolean', typeOf(value));
      }
      break;
    case 'integer':
      validateInteger(value, property, path, errors);
      break;
    case 'float':
      validateFloat(value, property, path, errors);
      break;
    case 'dateTime':
      if (typeof value !== 'string') {
        addError(errors, path, `Expected dateTime string, received ${typeOf(value)}`, 'string', typeOf(value));
      }
      break;
    case 'binary':
    case 'json':
      break;
    case 'richText':
      validateRichText(value, path, errors);
      break;
    case 'url':
      validateUrl(value, path, errors);
      break;
    case 'link':
      validateLink(value, path, errors);
      break;
    case 'contentReference':
      validateContentReference(value, path, errors);
      break;
    case 'content':
      validateContent(value, path, errors);
      break;
    case 'component': {
      const resolved = typeof property.contentType === 'string'
        ? getContentType(property.contentType)
        : property.contentType;
      if (resolved && 'baseType' in resolved) {
        validateComponent(value, resolved, path, errors, new Set(visited));
      }
      break;
    }
    case 'array':
      validateArray(value, property, path, errors, visited);
      break;
  }
}

function validateExperienceNode(value: unknown, path: string[], errors: ValidationError[]) {
  if (typeof value !== 'object' || value === null) {
    addError(errors, path, `Expected composition node, received ${typeOf(value)}`, 'object', typeOf(value));
    return;
  }
  const obj = value as Record<string, unknown>;
  if (typeof obj.__typename !== 'string') {
    addError(errors, [...path, '__typename'], `Expected string`, 'string', typeOf(obj.__typename));
  }
  if (typeof obj.key !== 'string') {
    addError(errors, [...path, 'key'], `Expected string`, 'string', typeOf(obj.key));
  }
  if (typeof obj.nodeType !== 'string') {
    addError(errors, [...path, 'nodeType'], `Expected string`, 'string', typeOf(obj.nodeType));
  }
  if (Array.isArray(obj.nodes)) {
    for (let i = 0; i < obj.nodes.length; i++) {
      validateExperienceNode(obj.nodes[i], [...path, 'nodes', String(i)], errors);
    }
  }
}

function validateBase(data: unknown, errors: ValidationError[]) {
  if (typeof data !== 'object' || data === null) {
    addError(errors, [], `Expected object, received ${typeOf(data)}`, 'object', typeOf(data));
    return false;
  }
  const obj = data as Record<string, unknown>;
  if (typeof obj._id !== 'string') {
    addError(errors, ['_id'], `Expected string, received ${typeOf(obj._id)}`, 'string', typeOf(obj._id));
  }
  if (typeof obj.__typename !== 'string') {
    addError(errors, ['__typename'], `Expected string, received ${typeOf(obj.__typename)}`, 'string', typeOf(obj.__typename));
  }
  if (typeof obj._metadata !== 'object' || obj._metadata === null) {
    addError(errors, ['_metadata'], `Expected object, received ${typeOf(obj._metadata)}`, 'object', typeOf(obj._metadata));
  }
  return true;
}

export function toSchema<T extends AnyContentType>(
  ct: T | ContentType<T>,
  options?: SchemaOptions,
) {
  const strict = options?.strict ?? false;

  return new Schema<T>((data: unknown) => {
    const errors: ValidationError[] = [];

    if (!validateBase(data, errors)) return errors;

    const obj = data as Record<string, unknown>;
    const visited = new Set<string>();
    visited.add(ct.key);

    const knownKeys = new Set(['_id', '_metadata', '__typename', '__context', '__composition']);

    if (ct.properties) {
      for (const [key, prop] of Object.entries(ct.properties)) {
        if (prop.indexingType === 'disabled') continue;
        knownKeys.add(key);
        if (obj[key] === null || obj[key] === undefined) continue;
        validateProperty(obj[key], prop, [key], errors, visited);
      }
    }

    if (ct.baseType === '_experience') {
      knownKeys.add('composition');
      if (obj.composition !== null && obj.composition !== undefined) {
        validateExperienceNode(obj.composition, ['composition'], errors);
      }
    }

    if (ct.baseType === '_section') {
      knownKeys.add('key');
      knownKeys.add('nodes');
      if (typeof obj.key !== 'string') {
        addError(errors, ['key'], `Expected string`, 'string', typeOf(obj.key));
      }
      if (Array.isArray(obj.nodes)) {
        for (let i = 0; i < obj.nodes.length; i++) {
          validateExperienceNode(obj.nodes[i], ['nodes', String(i)], errors);
        }
      }
    }

    if (strict) {
      for (const key of Object.keys(obj)) {
        if (!knownKeys.has(key)) {
          addError(errors, [key], `Unexpected property in strict mode`);
        }
      }
    }

    return errors;
  });
}
