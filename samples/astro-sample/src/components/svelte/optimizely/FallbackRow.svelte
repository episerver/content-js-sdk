<script lang="ts">
  import type { Snippet } from 'svelte';
  import { getPreviewUtils, type ExperienceNode } from '@optimizely/cms-sdk/core';

  let { node, children }: { node: ExperienceNode; children: Snippet } = $props();

  const { pa } = $derived(getPreviewUtils(node));
</script>

<div style="display: flex; gap: 1rem" {...pa(node)}>
  {@render children()}
</div>
