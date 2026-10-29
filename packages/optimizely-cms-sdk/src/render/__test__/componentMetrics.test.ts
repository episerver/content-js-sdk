import { describe, expect, test, beforeEach, vi } from 'vitest';
import type { ObservableCallback } from '@opentelemetry/api';
import { config, getGraphConfig } from '../../graph/index.js';
import { ComponentRegistry } from '../componentRegistry.js';
import { startComponentResolveSpan } from '../../telemetry/spans.js';

const instruments = vi.hoisted(() => ({
  histogram: { record: vi.fn() },
  counter: { add: vi.fn() },
  lookupCallbacks: [] as ObservableCallback[],
}));

vi.mock('../../telemetry/meter.js', async importOriginal => ({
  ...(await importOriginal<typeof import('../../telemetry/meter.js')>()),
  getMeter: () => ({
    createHistogram: () => instruments.histogram,
    createCounter: () => instruments.counter,
    createObservableCounter: () => ({
      addCallback: (callback: ObservableCallback) =>
        instruments.lookupCallbacks.push(callback),
    }),
  }),
}));

vi.mock('../../telemetry/spans.js', () => ({
  startComponentResolveSpan: vi.fn(),
}));

const span = { setAttribute: vi.fn(), end: vi.fn() };
const registry = new ComponentRegistry({ Hero: 'HeroComponent' });

// Runs the metric reader's collection and returns the lookup observations
const collect = () => {
  const observer = { observe: vi.fn() };
  instruments.lookupCallbacks.forEach(callback => callback(observer));
  return observer.observe;
};

const lookupAttributes = (type: string, found: boolean) => ({
  'optimizely.component.type': type,
  'optimizely.component.found': found,
});

describe('component lookup metrics', () => {
  beforeEach(() => {
    collect();
    vi.clearAllMocks();
    vi.mocked(startComponentResolveSpan).mockReturnValue(span as any);
  });

  test('are recorded by default, deferred until collection', () => {
    config({ apiKey: 'test-key' });

    registry.getComponent('Hero', { tag: 'Wide' });

    expect(instruments.histogram.record).not.toHaveBeenCalled();

    const observe = collect();
    const attributes = {
      ...lookupAttributes('Hero', true),
      'optimizely.component.tag': 'Wide',
    };
    expect(instruments.histogram.record).toHaveBeenCalledExactlyOnceWith(
      expect.any(Number),
      attributes,
    );
    expect(observe).toHaveBeenCalledWith(1, attributes);
  });

  test('replay each duration once and report cumulative lookup totals', () => {
    config({ apiKey: 'test-key' });

    registry.getComponent('Teaser');
    registry.getComponent('Teaser');
    collect();
    registry.getComponent('Teaser');
    instruments.histogram.record.mockClear();
    const observe = collect();

    expect(instruments.histogram.record).toHaveBeenCalledOnce();
    expect(observe).toHaveBeenCalledWith(3, lookupAttributes('Teaser', false));
  });

  test('are no-ops when componentMetrics is false, while the span is still emitted', () => {
    config({ apiKey: 'test-key', telemetry: { componentMetrics: false } });

    registry.getComponent('Missing');
    const observe = collect();

    expect(instruments.histogram.record).not.toHaveBeenCalled();
    expect(observe).not.toHaveBeenCalledWith(
      expect.anything(),
      lookupAttributes('Missing', false),
    );
    expect(span.setAttribute).toHaveBeenCalledWith('optimizely.component.found', false);
    expect(span.end).toHaveBeenCalledOnce();
  });

  test('are recorded again after config() is called without telemetry', () => {
    config({ apiKey: 'test-key', telemetry: { componentMetrics: false } });
    config({ apiKey: 'test-key' });

    registry.getComponent('Hero');
    const observe = collect();

    expect(instruments.histogram.record).toHaveBeenCalledOnce();
    expect(observe).toHaveBeenCalledWith(1, lookupAttributes('Hero', true));
  });

  test('setting is not stored in the Graph config', () => {
    config({ apiKey: 'test-key', telemetry: { componentMetrics: false } });

    expect(getGraphConfig()).not.toHaveProperty('telemetry');
  });
});
