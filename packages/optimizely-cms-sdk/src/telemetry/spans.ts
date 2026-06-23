import { getTracer } from './tracer.js';
import { createSpan } from './tracer.js';
import { SemanticAttributes } from './attributes.js';
import type { PreviewParams, GraphReference } from '../graph/index.js';

// Fragment and Query Generation Helpers

/**
 * Span for fragment generation at the root level.
 */
export function startFragmentSpan(
  contentType: string,
  damEnabled: boolean,
  threshold: number,
  suffix: string,
) {
  const tracer = getTracer();
  return tracer.startSpan('optimizely.fragment.create', {
    attributes: {
      [SemanticAttributes.OPTI_CONTENT_TYPE]: contentType,
      [SemanticAttributes.OPTI_DAM_ENABLED]: damEnabled,
      [SemanticAttributes.OPTI_FRAGMENT_THRESHOLD]: threshold,
      [SemanticAttributes.OPTI_FRAGMENT_SUFFIX]: suffix,
    },
  });
}

/**
 * Span for single content query generation.
 */
export function startSingleQuerySpan(contentType: string, damEnabled: boolean) {
  const tracer = getTracer();
  return tracer.startSpan('optimizely.query.create', {
    attributes: {
      [SemanticAttributes.OPTI_QUERY_TYPE]: 'single',
      [SemanticAttributes.OPTI_CONTENT_TYPE]: contentType,
      [SemanticAttributes.OPTI_DAM_ENABLED]: damEnabled,
    },
  });
}

/**
 * Span for multiple content query generation.
 */
export function startMultipleQuerySpan(contentType: string, damEnabled: boolean) {
  const tracer = getTracer();
  return tracer.startSpan('optimizely.query.create', {
    attributes: {
      [SemanticAttributes.OPTI_QUERY_TYPE]: 'multiple',
      [SemanticAttributes.OPTI_CONTENT_TYPE]: contentType,
      [SemanticAttributes.OPTI_DAM_ENABLED]: damEnabled,
    },
  });
}

// GraphQL Request Helpers

/**
 * Wraps request operation in span.
 */
export function withRequestSpan<T>(
  graphUrl: string,
  userAgent: string,
  cache: boolean,
  slot: string,
  hasPreviewToken: boolean,
  fn: (span: any) => Promise<T>,
): Promise<T> {
  return createSpan('optimizely.graph.request', async span => {
    span.setAttributes({
      [SemanticAttributes.HTTP_METHOD]: 'POST',
      [SemanticAttributes.HTTP_URL]: graphUrl,
      [SemanticAttributes.HTTP_USER_AGENT]: userAgent,
      [SemanticAttributes.OPTI_CACHE_ENABLED]: cache,
      [SemanticAttributes.OPTI_SLOT]: slot,
      [SemanticAttributes.OPTI_PREVIEW_TOKEN]: hasPreviewToken,
    });
    return fn(span);
  });
}

/**
 * Wraps getContentByPath in span.
 */
export function withGetContentByPathSpan<T>(
  path: string,
  cache: boolean,
  fn: (span: any) => Promise<T>,
): Promise<T> {
  return createSpan('optimizely.content.get_by_path', async span => {
    span.setAttributes({
      [SemanticAttributes.OPTI_CONTENT_PATH]: path,
      [SemanticAttributes.OPTI_CACHE_ENABLED]: cache,
    });
    return fn(span);
  });
}

/**
 * Wraps getPreviewContent in span.
 */
export function withGetPreviewContentSpan<T>(
  params: PreviewParams,
  fn: (span: any) => Promise<T>,
): Promise<T> {
  return createSpan('optimizely.content.get_preview', async span => {
    span.setAttributes({
      [SemanticAttributes.OPTI_CONTENT_KEY]: params.key,
      [SemanticAttributes.OPTI_PREVIEW_TOKEN]: true,
      [SemanticAttributes.OPTI_PREVIEW_MODE]: params.ctx,
      [SemanticAttributes.OPTI_PREVIEW_VERSION]: params.ver,
      [SemanticAttributes.OPTI_PREVIEW_LOCALE]: params.loc,
    });
    return fn(span);
  });
}

/**
 * Wraps getContent in span.
 */
export function withGetContentSpan<T>(
  ref: GraphReference,
  fn: (span: any) => Promise<T>,
): Promise<T> {
  return createSpan('optimizely.content.get', async span => {
    span.setAttributes({
      [SemanticAttributes.OPTI_CONTENT_KEY]: ref.key,
      [SemanticAttributes.OPTI_CONTENT_LOCALE]: ref.locale || 'default',
      [SemanticAttributes.OPTI_CONTENT_VERSION]: ref.version || 'latest',
    });
    return fn(span);
  });
}

// Component Resolution Helpers

/**
 * Creates span for component resolution in ComponentRegistry.
 */
export function startComponentResolveSpan(contentType: string, tag?: string) {
  const tracer = getTracer();
  return tracer.startSpan('optimizely.component.resolve', {
    attributes: {
      [SemanticAttributes.OPTI_COMPONENT_TYPE]: contentType,
      ...(tag && { [SemanticAttributes.OPTI_COMPONENT_TAG]: tag }),
    },
  });
}

/**
 * Wraps a React component in span.
 */
export function withReactComponentSpan<T>(
  contentType: string,
  hasTag: boolean,
  hasDisplaySettings: boolean,
  fn: (span: any) => Promise<T>,
): Promise<T> {
  return createSpan('optimizely.react.render_component', async span => {
    span.setAttributes({
      [SemanticAttributes.OPTI_COMPONENT_TYPE]: contentType,
      [SemanticAttributes.OPTI_COMPONENT_HAS_TAG]: hasTag,
      [SemanticAttributes.OPTI_COMPONENT_HAS_DISPLAY_SETTINGS]: hasDisplaySettings,
    });
    return fn(span);
  });
}
