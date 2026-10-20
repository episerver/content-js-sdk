<script lang="ts">
  import type { ContentProps } from '@optimizely/cms-sdk';
  import { getPreviewUtils } from '@optimizely/cms-sdk/core';
  import type { CallToActionContentType } from '@/lib/contentTypes';

  let { content }: { content: ContentProps<typeof CallToActionContentType> } = $props();

  const { pa } = $derived(getPreviewUtils(content));
</script>

<a href={content.link ?? '#'} {...pa('label')}>{content.label}</a>
