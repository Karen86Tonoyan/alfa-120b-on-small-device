// @ts-nocheck
import { afterEach, describe, expect, it } from 'vitest';
import type { ModelAdapter } from '@/lib/adapters/types';
import { BENCHMARK_CASES } from '@/lib/benchmark/catalog';
import { clearStoredBenchmarkSnapshot, loadStoredBenchmarkSnapshot, runBenchmarkSnapshot, storeBenchmarkSnapshot } from '@/lib/benchmark/metrics';
import { runPipeline } from '@/lib/pipeline/orchestrator';

describe('pipeline resilience hardening', () => {
  it('quarantines oversized input before dispatch', async () => {
    const input = `plan ${'A'.repeat(22000)}`;
    const result = await runPipeline(input, { mode: 'filtered' });

    expect(result.resilience.degraded).toBe(true);
    expect(result.resilience.input_truncated).toBe(true);
    expect(result.resilience.fault_codes).toContain('INPUT_TOO_LARGE');
    expect(result.route.should_dispatch).toBe(false);
    expect(result.route.lane).toBe('quarantine-lane');
    expect(result.final_decision).toBe('HOLD');
  });

  it('fails safer when adapter dispatch throws', async () => {
    const adapter: ModelAdapter = {
      provider: 'test',
      modelId: 'boom-model',
      chat: async () => {
        throw new Error('adapter offline');
      },
      testConnection: async () => false,
    };

    const result = await runPipeline('Jaka jest stolica Francji?', { mode: 'filtered', adapter });

    expect(result.resilience.fault_codes).toContain('MODEL_ADAPTER_FAILURE');
    expect(result.final_decision).toBe('HOLD');
    expect(result.response_mode).toBe('restricted');
    expect(result.model_response).toContain('adapter offline');
  });
});

describe('benchmark storage hardening', () => {
  const originalLocalStorage = window.localStorage;

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: originalLocalStorage,
    });
    clearStoredBenchmarkSnapshot();
  });

  it('falls back to memory when localStorage is unavailable', async () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: () => {
          throw new Error('denied');
        },
        setItem: () => {
          throw new Error('denied');
        },
        removeItem: () => {
          throw new Error('denied');
        },
      },
    });

    const subset = BENCHMARK_CASES.filter((item) => ['tp-2', 'tp-9'].includes(item.id));
    const snapshot = await runBenchmarkSnapshot(subset);

    storeBenchmarkSnapshot(snapshot);
    const loaded = loadStoredBenchmarkSnapshot();

    expect(loaded?.timestamp).toBe(snapshot.timestamp);
    expect(loaded?.total_cases).toBe(2);
  });

  it('drops corrupted snapshot payloads instead of crashing', () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: () => '{"broken":true}',
        setItem: () => undefined,
        removeItem: () => undefined,
      },
    });

    expect(loadStoredBenchmarkSnapshot()).toBeNull();
  });
});
