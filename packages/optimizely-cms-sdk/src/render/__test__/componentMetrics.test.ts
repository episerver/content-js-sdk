import { describe, expect, test, beforeEach, vi } from 'vitest';
import { config, getGraphConfig } from '../../graph/index.js';
import { ComponentRegistry } from '../componentRegistry.js';
import { startComponentResolveSpan } from '../../telemetry/spans.js';

const instruments = vi.hoisted(() => ({
  histogram: { record: vi.fn() },
  counter: { add: vi.fn() },
}));

vi.mock('../../telemetry/meter.js', async importOriginal => ({
  ...(await importOriginal<typeof import('../../telemetry/meter.js')>()),
  getMeter: () => ({
    createHistogram: () => instruments.histogram,
    createCounter: () => instruments.counter,
  }),
}));

vi.mock('../../telemetry/spans.js', () => ({
  startComponentResolveSpan: vi.fn(),
}));

const span = { setAttribute: vi.fn(), end: vi.fn() };
const registry = new ComponentRegistry({ Hero: 'HeroComponent' });

describe('component lookup metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(startComponentResolveSpan).mockReturnValue(span as any);
  });

  test('are recorded by default', () => {
    config({ apiKey: 'test-key' });

    registry.getComponent('Hero', { tag: 'Wide' });

    const attributes = {
      'optimizely.component.type': 'Hero',
      'optimizely.component.found': true,
      'optimizely.component.tag': 'Wide',
    };
    expect(instruments.histogram.record).toHaveBeenCalledExactlyOnceWith(
      expect.any(Number),
      attributes,
    );
    expect(instruments.counter.add).toHaveBeenCalledExactlyOnceWith(1, attributes);
  });

  test('are no-ops when componentMetrics is false, while the span is still emitted', () => {
    config({ apiKey: 'test-key', telemetry: { componentMetrics: false } });

    registry.getComponent('Missing');

    expect(instruments.histogram.record).not.toHaveBeenCalled();
    expect(instruments.counter.add).not.toHaveBeenCalled();
    expect(span.setAttribute).toHaveBeenCalledWith('optimizely.component.found', false);
    expect(span.end).toHaveBeenCalledOnce();
  });

  test('are recorded again after config() is called without telemetry', () => {
    config({ apiKey: 'test-key', telemetry: { componentMetrics: false } });
    config({ apiKey: 'test-key' });

    registry.getComponent('Hero');

    expect(instruments.histogram.record).toHaveBeenCalledOnce();
    expect(instruments.counter.add).toHaveBeenCalledOnce();
  });

  test('setting is not stored in the Graph config', () => {
    config({ apiKey: 'test-key', telemetry: { componentMetrics: false } });

    expect(getGraphConfig()).not.toHaveProperty('telemetry');
  });
});
