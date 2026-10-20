<script lang="ts">
  import type { Component } from 'svelte';
  import { resolveContentComponent, type OptimizelyContent } from '@optimizely/cms-sdk/core';
  import { getRegistry } from './context';

  type Props = {
    content: OptimizelyContent;
    displaySettings?: Record<string, string | boolean>;
    tag?: string;
    [prop: string]: unknown;
  };

  let { content, displaySettings, tag, ...props }: Props = $props();

  const registry = getRegistry();
  const resolved = $derived(
    resolveContentComponent(content, { tag, props, registry }),
  );
</script>

{#snippet rendered()}
  {#if resolved.component}
    {@const Resolved = resolved.component as Component<Record<string, unknown>>}
    <Resolved content={resolved.contentProps} {displaySettings} {...resolved.componentProps} />
  {:else if import.meta.env.DEV}
    <div style="margin: 1rem; padding: 1rem; border: 1px solid; border-radius: 8px">
      No Svelte component found for content type <b>{resolved.typename}</b>
    </div>
  {/if}
{/snippet}

{#if resolved.previewAttrs}
  <div {...resolved.previewAttrs}>{@render rendered()}</div>
{:else}
  {@render rendered()}
{/if}
