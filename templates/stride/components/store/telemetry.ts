'use client';
/**
 * Telemetry — contracts.md §6. Local-only versioned browser event log.
 *
 * Exactly ONE TelemetrySink implementation exists; it is constructed inside
 * StoreProvider and exposed as `strideStoreBridge.telemetry`, consumed by the
 * WebMCP tools script (issue 0002) AND the Clear/Export UI controls. No second
 * write path to the storage key.
 */
import type { ErrorCode } from '../../lib/store/engine';

export type ToolName =
  | 'search_products'
  | 'compare_bikes'
  | 'get_cart'
  | 'add_to_cart'
  | 'update_cart_item'
  | 'remove_from_cart';

export type ToolOutcome = 'ok' | 'partial_failure' | ErrorCode;

/** Exactly four fields. Never more (PRD §3.6). */
export interface TelemetryEvent {
  sessionId: string;
  tool: ToolName;
  outcome: ToolOutcome;
  durationMs: number;
}

export interface TelemetryLogV1 {
  version: 1;
  events: TelemetryEvent[];
}

export interface TelemetrySink {
  record(event: TelemetryEvent): void;
  exportJson(): string; // serialized TelemetryLogV1 (the Export JSON control)
  clear(): void; // the separate Clear telemetry control
}

export const TELEMETRY_STORAGE_KEY = 'stride.telemetry';

const EMPTY_LOG: TelemetryLogV1 = { version: 1, events: [] };

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function createTelemetrySink(): TelemetrySink {
  return {
    record(event: TelemetryEvent): void {
      const store = storage();
      if (!store) return;
      const raw = store.getItem(TELEMETRY_STORAGE_KEY);
      let events: TelemetryEvent[] = [];
      if (raw !== null) {
        // Unknown/other versions: migrate forward — never silently drop events.
        try {
          const parsed: unknown = JSON.parse(raw);
          if (parsed !== null && typeof parsed === 'object' && Array.isArray((parsed as TelemetryLogV1).events)) {
            events = (parsed as TelemetryLogV1).events;
          } else if (Array.isArray(parsed)) {
            events = parsed as TelemetryEvent[];
          }
        } catch {
          // unreadable log: start a fresh v1 envelope rather than throwing away the record call
        }
      }
      const next: TelemetryLogV1 = { version: 1, events: [...events, event] };
      store.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(next));
    },

    exportJson(): string {
      const store = storage();
      if (!store) return JSON.stringify(EMPTY_LOG);
      const raw = store.getItem(TELEMETRY_STORAGE_KEY);
      if (raw === null) return JSON.stringify(EMPTY_LOG);
      // Unknown versions on read: export as-is.
      return raw;
    },

    clear(): void {
      storage()?.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(EMPTY_LOG));
    },
  };
}
