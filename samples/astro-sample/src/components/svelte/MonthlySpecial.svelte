<script lang="ts">
  import type { ContentProps } from '@optimizely/cms-sdk';
  import { getPreviewUtils } from '@optimizely/cms-sdk/core';
  import type { MonthlySpecialContentType } from '@/lib/contentTypes';
  import OptimizelyComponent from './optimizely/OptimizelyComponent.svelte';

  let { content }: { content: ContentProps<typeof MonthlySpecialContentType> } = $props();

  const { pa } = $derived(getPreviewUtils(content));
</script>

<div class="monthly-special">
  <div class="monthly-special__content">
    <h1 class="monthly-special__title" {...pa('title')}>{content.title}</h1>
    <p class="monthly-special__subtitle" {...pa('subtitle')}>{content.subtitle}</p>
  </div>
  <div class="monthly-special__blog" {...pa('blog')}>
    {#if content.blog}
      <OptimizelyComponent content={content.blog} />
    {/if}
  </div>
</div>
