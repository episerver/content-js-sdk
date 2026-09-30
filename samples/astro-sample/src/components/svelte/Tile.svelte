<script lang="ts">
  import type { ContentProps } from '@optimizely/cms-sdk';
  import { getPreviewUtils } from '@optimizely/cms-sdk/core';
  import type { TileContentType } from '@/lib/contentTypes';

  let { content }: { content: ContentProps<typeof TileContentType> } = $props();

  const { pa } = $derived(getPreviewUtils(content));
</script>

<div class="tile">
  <h1 {...pa('title')}>{content.title}</h1>
  <p {...pa('description')}>{content.description}</p>
</div>
