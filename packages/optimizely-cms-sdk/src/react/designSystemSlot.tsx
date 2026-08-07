/**
 * Rendering for the design-system viewer's placeholder content.
 *
 * Sample content marks fillable areas and structure captions with a reserved
 * content type. `OptimizelyComponent` hands anything carrying that type here
 * before the registry lookup — apps never register it, and going through the
 * normal render path means placeholders appear wherever content flows: content
 * areas, compositions, grid sections.
 *
 * Kept out of `server.tsx` so the production render path holds one call, not
 * the viewer's chrome.
 */
import { JSX } from 'react';
import { DESIGN_SYSTEM_SLOT } from '../designSystem/slot.js';

const SLOT_FONT =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/** Chip naming the structure node (row, column) it is rendered inside. */
function DesignSystemCaption({ label, nodeType }: { label?: string; nodeType?: string }) {
  return (
    <span
      // The viewer's stylesheet reaches the app's own row/column element
      // through this — `:has(> [data-ods-caption])` — to outline it.
      data-ods-caption={nodeType ?? 'node'}
      style={{
        alignSelf: 'flex-start',
        display: 'inline-block',
        padding: '0.15rem 0.5rem',
        borderRadius: 999,
        border: '1px solid #dfe4ea',
        background: '#f1f3f5',
        color: '#5f6b7a',
        font: `600 0.68rem/1.4 ${SLOT_FONT}`,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

/**
 * Visible stand-in for an empty, fillable area. Inline styles only — the SDK
 * can't assume the host app ships any CSS pipeline.
 */
function DesignSystemSlot({ label }: { label?: string }) {
  return (
    <div
      role="note"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        minHeight: 104,
        width: '100%',
        padding: '1rem',
        border: '2px dashed #c3cbd6',
        borderRadius: 10,
        background:
          'repeating-linear-gradient(45deg,#fbfcfd 0 10px,#f3f5f8 10px 20px)',
        color: '#5f6b7a',
        font: `500 0.875rem/1.3 ${SLOT_FONT}`,
        textAlign: 'center',
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: '1.5px solid #c3cbd6',
          fontSize: '0.95rem',
          lineHeight: 1,
        }}
      >
        +
      </span>
      {label ?? 'Drop components here'}
    </div>
  );
}

/**
 * Renders design-system sample content, or returns `null` for anything else so
 * the caller carries on with its normal lookup.
 */
export function renderDesignSystemSlot(content: {
  __typename?: string;
}): JSX.Element | null {
  if (content.__typename !== DESIGN_SYSTEM_SLOT) {
    return null;
  }

  const slot = content as { _slotLabel?: string; _slotKind?: string; _slotNode?: string };
  return slot._slotKind === 'caption' ?
      <DesignSystemCaption label={slot._slotLabel} nodeType={slot._slotNode} />
    : <DesignSystemSlot label={slot._slotLabel} />;
}
