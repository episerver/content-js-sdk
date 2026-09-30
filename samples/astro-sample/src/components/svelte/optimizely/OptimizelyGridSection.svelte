<script lang="ts">
  import type { Component } from 'svelte';
  import {
    getStructureContainer,
    planGridSection,
    type ExperienceNode,
    type GridRenderItem,
  } from '@optimizely/cms-sdk/core';
  import OptimizelyComponent from './OptimizelyComponent.svelte';
  import FallbackRow from './FallbackRow.svelte';
  import FallbackColumn from './FallbackColumn.svelte';
  import { getRegistry } from './context';

  let { nodes }: { nodes: ExperienceNode[] } = $props();

  const registry = getRegistry();
  const fallbacks = { row: FallbackRow, column: FallbackColumn };
  const items = $derived(planGridSection(nodes, { registry }));
</script>

{#snippet renderItems(items: GridRenderItem<Component<never>>[])}
  {#each items as item (item.key)}
    {#if item.kind === 'component'}
      <OptimizelyComponent
        content={item.content}
        displaySettings={item.displaySettings}
        {...item.previewAttrs}
      />
    {:else}
      {@const Container = getStructureContainer(item, { fallbacks }) as
        | Component<Record<string, unknown>>
        | undefined}
      {#if Container}
        <Container node={item.node} index={item.index} displaySettings={item.displaySettings}>
          {@render renderItems(item.children)}
        </Container>
      {:else}
        {@render renderItems(item.children)}
      {/if}
    {/if}
  {/each}
{/snippet}

{@render renderItems(items)}
