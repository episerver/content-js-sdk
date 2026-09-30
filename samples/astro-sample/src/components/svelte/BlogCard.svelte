<script lang="ts">
  import type { ContentProps } from '@optimizely/cms-sdk';
  import { getPreviewUtils } from '@optimizely/cms-sdk/core';
  import type { BlogCardContentType } from '@/lib/contentTypes';

  let { content }: { content: ContentProps<typeof BlogCardContentType> } = $props();

  const { pa } = $derived(getPreviewUtils(content));
</script>

<article class="blog-card">
  <h2 {...pa('title')}>{content.title}</h2>
  <p class="subtitle" {...pa('subtitle')}>{content.subtitle}</p>
  <div class="blog-meta">
    <span class="author" {...pa('author')}>{content.author}</span>
    <span class="date" {...pa('date')}>
      {content.date ? new Date(content.date).toLocaleDateString() : 'N/A'}
    </span>
  </div>
</article>
