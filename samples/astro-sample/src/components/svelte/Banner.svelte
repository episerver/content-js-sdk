<script lang="ts">
  import type { ContentProps } from '@optimizely/cms-sdk';
  import { getPreviewUtils } from '@optimizely/cms-sdk/core';
  import type { BannerContentType } from '@/lib/contentTypes';

  let { content }: { content: ContentProps<typeof BannerContentType> } = $props();

  const { pa } = $derived(getPreviewUtils(content));
</script>

<div class="banner">
  <div class="banner-content">
    <h1 class="banner-title" {...pa('title')}>{content.title}</h1>
    <p class="banner-subtitle" {...pa('subtitle')}>{content.subtitle}</p>
    {#if content.submit}
      <a {...pa('submit')} href={content.submit.url.default ?? ''} class="banner-btn">Submit</a>
    {/if}
  </div>
</div>
