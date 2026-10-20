import { AsyncLocalStorage } from 'node:async_hooks';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi, type MockInstance } from 'vitest';
import {
  type Attributes,
  type Context,
  type ContextManager,
  type Counter,
  type Histogram,
  type Span,
  type SpanOptions,
  type SpanStatus,
  type Tracer,
  ROOT_CONTEXT,
  SpanStatusCode,
  TraceFlags,
  context,
  trace,
} from '@opentelemetry/api';
import {
  METER_NAME,
  METER_VERSION,
  MetricNames,
  SemanticAttributes,
  createSpan,
  getMeter,
  getTracer,
  logError,
  logWarning,
  metrics,
} from '../index.js';
import { withComponentRenderSpan } from '../../core/index.js';
import { SDK_VERSION } from '../../generated/version.js';

// IN-MEMORY TRACING

type RecordedSpan = {
  name: string;
  attributes: Attributes;
  events: { name: string; attributes?: Attributes }[];
  exceptions: unknown[];
  status?: SpanStatus;
  ended: boolean;
};

const recorded: RecordedSpan[] = [];

const recordingSpan = (name: string, options: SpanOptions = {}): Span => {
  const record: RecordedSpan = {
    name,
    attributes: { ...options.attributes },
    events: [],
    exceptions: [],
    ended: false,
  };
  recorded.push(record);

  const span: Span = {
    spanContext: () => ({
      traceId: '0af7651916cd43dd8448eb211c80319c',
      spanId: 'b7ad6b7169203331',
      traceFlags: TraceFlags.SAMPLED,
    }),
    setAttribute: (key, value) => {
      record.attributes[key] = value;
      return span;
    },
    setAttributes: attributes => {
      Object.assign(record.attributes, attributes);
      return span;
    },
    addEvent: (eventName, attributes) => {
      record.events.push({ name: eventName, attributes: attributes as Attributes });
      return span;
    },
    addLink: () => span,
    addLinks: () => span,
    setStatus: status => {
      record.status = status;
      return span;
    },
    updateName: () => span,
    end: () => {
      record.ended = true;
    },
    isRecording: () => true,
    recordException: exception => {
      record.exceptions.push(exception);
    },
  };
  return span;
};

const recordingTracer = {
  startSpan: (name: string, options?: SpanOptions) => recordingSpan(name, options),
  startActiveSpan: (name: string, ...rest: unknown[]) => {
    const fn = rest.at(-1) as (span: Span) => unknown;
    const options = (typeof rest[0] === 'object' ? rest[0] : {}) as SpanOptions;
    const span = recordingSpan(name, options);
    return context.with(trace.setSpan(context.active(), span), () => fn(span));
  },
} as unknown as Tracer;

class AsyncContextManager implements ContextManager {
  private storage = new AsyncLocalStorage<Context>();

  active = () => this.storage.getStore() ?? ROOT_CONTEXT;

  with<A extends unknown[], F extends (...args: A) => ReturnType<F>>(
    activeContext: Context,
    fn: F,
    thisArg?: ThisParameterType<F>,
    ...args: A
  ): ReturnType<F> {
    return this.storage.run(activeContext, () => fn.call(thisArg, ...args));
  }

  bind = <T>(_context: Context, target: T) => target;
  enable = () => this;
  disable = () => this;
}

const spanNamed = (name: string) => recorded.find(span => span.name === name);

// TESTS

let warnSpy: MockInstance<typeof console.warn>;
let errorSpy: MockInstance<typeof console.error>;

beforeEach(() => {
  recorded.length = 0;
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
  errorSpy.mockRestore();
});

describe('without a registered OpenTelemetry provider', () => {
  test('getTracer and getMeter return one shared instance each', () => {
    expect(getTracer()).toBe(getTracer());
    expect(getMeter()).toBe(getMeter());
  });

  test('createSpan still runs the function and returns its result on a non-recording span', async () => {
    const result = await createSpan('test.noop', span => {
      expect(span.isRecording()).toBe(false);
      return 42;
    });

    expect(result).toBe(42);
  });

  test('createSpan rethrows what the function throws', async () => {
    const failure = new Error('boom');

    await expect(createSpan('test.noop', () => Promise.reject(failure))).rejects.toBe(failure);
  });

  test('logWarning falls back to console.warn', () => {
    logWarning('careful', { 'fragment.count': 150 });

    expect(warnSpy).toHaveBeenCalledWith('careful', { 'fragment.count': 150 });
  });

  test('logError falls back to console.error, with or without an error', () => {
    const failure = new Error('boom');

    logError('failed', failure, { attempt: 2 });
    logError('failed quietly', undefined, { attempt: 3 });

    expect(errorSpy).toHaveBeenNthCalledWith(1, 'failed', failure, { attempt: 2 });
    expect(errorSpy).toHaveBeenNthCalledWith(2, 'failed quietly', { attempt: 3 });
  });
});

describe('with a registered provider', () => {
  beforeAll(() => {
    context.setGlobalContextManager(new AsyncContextManager());
    trace.setGlobalTracerProvider({ getTracer: () => recordingTracer });
  });

  afterAll(() => {
    trace.disable();
    context.disable();
  });

  test('createSpan marks a successful span OK, keeps its attributes and ends it', async () => {
    await createSpan('test.success', span => span.setAttribute('records', 3), {
      attributes: { source: 'api' },
    });

    expect(spanNamed('test.success')).toEqual({
      name: 'test.success',
      attributes: { source: 'api', records: 3 },
      events: [],
      exceptions: [],
      status: { code: SpanStatusCode.OK },
      ended: true,
    });
  });

  test('createSpan records a failure as an exception and an ERROR status, then rethrows', async () => {
    const failure = new Error('boom');

    await expect(createSpan('test.failure', async () => Promise.reject(failure))).rejects.toBe(failure);

    expect(spanNamed('test.failure')).toMatchObject({
      exceptions: [failure],
      status: { code: SpanStatusCode.ERROR, message: 'boom' },
      ended: true,
    });
  });

  test('logWarning adds a warning event to the active span instead of logging', async () => {
    await createSpan('test.warning', async () => logWarning('careful', { 'fragment.count': 150 }));

    expect(spanNamed('test.warning')?.events).toEqual([
      { name: 'warning', attributes: { 'fragment.count': 150, 'warning.message': 'careful' } },
    ]);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test('logError adds an error event with the exception details to the active span', async () => {
    const failure = new TypeError('bad input');

    await createSpan('test.error', async () => logError('failed', failure, { attempt: 2 }));

    expect(spanNamed('test.error')?.events).toEqual([
      {
        name: 'error',
        attributes: {
          attempt: 2,
          'error.message': 'failed',
          'exception.message': 'bad input',
          'exception.type': 'TypeError',
          'exception.stacktrace': failure.stack,
        },
      },
    ]);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test('withComponentRenderSpan names the span after the framework and tags the component', async () => {
    const result = await withComponentRenderSpan('vue', 'Hero', true, false, async () => 'rendered');

    expect(result).toBe('rendered');
    expect(spanNamed('optimizely.vue.render_component')?.attributes).toEqual({
      [SemanticAttributes.OPTI_COMPONENT_TYPE]: 'Hero',
      [SemanticAttributes.OPTI_COMPONENT_HAS_TAG]: true,
      [SemanticAttributes.OPTI_COMPONENT_HAS_DISPLAY_SETTINGS]: false,
    });
  });
});

describe('recordMetrics', () => {
  test('records the elapsed time on the histogram and counts one call', () => {
    const histogram = { record: vi.fn() };
    const counter = { add: vi.fn() };
    const attributes = { 'optimizely.content_type': 'Article' };

    metrics.recordMetrics(
      histogram as unknown as Histogram,
      counter as unknown as Counter,
      performance.now() - 50,
      attributes,
    );

    const [duration, recordedAttributes] = histogram.record.mock.calls[0];
    expect(duration).toBeGreaterThanOrEqual(50);
    expect(recordedAttributes).toBe(attributes);
    expect(counter.add).toHaveBeenCalledWith(1, attributes);
  });
});

describe('exported constants', () => {
  test('the meter is identified by the package name and SDK version', () => {
    expect(METER_NAME).toBe('@optimizely/cms-sdk');
    expect(METER_VERSION).toBe(SDK_VERSION);
  });

  test('every metric name sits in the optimizely namespace and is unique', () => {
    const names = Object.values(MetricNames);

    expect(names.every(name => name.startsWith('optimizely.'))).toBe(true);
    expect(new Set(names).size).toBe(names.length);
  });
});
