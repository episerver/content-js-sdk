<script lang="ts">
  import type { ContentProps } from '@optimizely/cms-sdk';
  import { getPreviewUtils } from '@optimizely/cms-sdk/core';
  import type { ArticleContentType } from '@/lib/contentTypes';
  import RichText from './optimizely/RichText.svelte';

  let { content }: { content: ContentProps<typeof ArticleContentType> } = $props();

  const { pa } = $derived(getPreviewUtils(content));
</script>

<main>
  <h1 {...pa('heading')}>{content.heading}</h1>
  <p {...pa('subtitle')}>{content.subtitle}</p>
  <div {...pa('body')}>
    <RichText content={content.body?.json} />
  </div>
</main>
