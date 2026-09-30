<script lang="ts">
  import { isWrappedComponent, planComposition, type ExperienceNode } from '@optimizely/cms-sdk/core';
  import OptimizelyComponent from './OptimizelyComponent.svelte';

  let { nodes }: { nodes: ExperienceNode[] } = $props();

  const items = $derived(planComposition(nodes));
</script>

{#each items as item (item.key)}
  {#if item.kind === 'unknown'}
    {#if import.meta.env.DEV}
      <div style="margin: 1rem; padding: 1rem; border: 1px solid; border-radius: 8px">
        Unresolved composition node <b>{item.key}</b>
      </div>
    {/if}
  {:else if isWrappedComponent(item)}
    <div {...item.previewAttrs}>
      <OptimizelyComponent
        content={item.content}
        displaySettings={item.displaySettings}
      />
    </div>
  {:else if item.kind === 'component'}
    <OptimizelyComponent
      content={item.content}
      displaySettings={item.displaySettings}
      {...item.previewAttrs}
    />
  {/if}
{/each}
