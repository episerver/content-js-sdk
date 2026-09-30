<script lang="ts">
  import type { ContentProps } from '@optimizely/cms-sdk';
  import { getPreviewUtils } from '@optimizely/cms-sdk/core';
  import type { SmallFeatureGridContentType } from '@/lib/contentTypes';
  import OptimizelyComponent from './optimizely/OptimizelyComponent.svelte';

  let { content }: { content: ContentProps<typeof SmallFeatureGridContentType> } = $props();

  const { pa } = $derived(getPreviewUtils(content));
</script>

<div class="small-feature-grid" {...pa('smallFeatures')}>
  {#each content.smallFeatures ?? [] as feature}
    <OptimizelyComponent content={feature} />
  {/each}
</div>
