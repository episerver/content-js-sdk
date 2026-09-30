<script lang="ts">
  import {
    isWrappedComponent,
    planComposition,
    type ExperienceNode,
    type OptimizelyContent,
  } from '@optimizely/cms-sdk/core';
  import OptimizelyComponent from './OptimizelyComponent.svelte';

  let { nodes }: { nodes: ExperienceNode[] } = $props();

  const items = $derived(planComposition(nodes));
</script>

{#each items as item}
  {#if isWrappedComponent(item)}
    <div {...item.previewAttrs}>
      <OptimizelyComponent
        content={item.content as OptimizelyContent}
        displaySettings={item.displaySettings}
      />
    </div>
  {:else if item.kind === 'component'}
    <OptimizelyComponent
      content={item.content as OptimizelyContent}
      displaySettings={item.displaySettings}
      {...item.previewAttrs}
    />
  {/if}
{/each}
