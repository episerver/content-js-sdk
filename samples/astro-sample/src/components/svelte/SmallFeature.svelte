<script lang="ts">
  import { damAssets, type ContentProps } from '@optimizely/cms-sdk';
  import { getPreviewUtils } from '@optimizely/cms-sdk/core';
  import type { SmallFeatureContentType } from '@/lib/contentTypes';
  import RichText from './optimizely/RichText.svelte';

  let { content }: { content: ContentProps<typeof SmallFeatureContentType> } = $props();

  const { pa, src } = $derived(getPreviewUtils(content));
  const { getAlt } = $derived(damAssets(content));
  const imageUrl = $derived(src(content.image));
</script>

<div class="small-feature-grid">
  <h3 {...pa('heading')}>{content.heading}</h3>
  <div style="position: relative">
    {#if imageUrl}
      <img src={imageUrl} alt={getAlt(content.image, 'image')} {...pa('image')} />
    {/if}
  </div>
  <RichText content={content.body?.json} />
</div>
