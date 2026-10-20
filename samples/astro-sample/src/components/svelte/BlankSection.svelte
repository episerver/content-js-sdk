<script lang="ts">
  import type { ContentProps } from '@optimizely/cms-sdk';
  import { getPreviewUtils } from '@optimizely/cms-sdk/core';
  import type { BlankSectionContentType } from '@/lib/contentTypes';
  import OptimizelyGridSection from './optimizely/OptimizelyGridSection.svelte';

  let { content }: { content: ContentProps<typeof BlankSectionContentType> } = $props();

  const { pa } = $derived(getPreviewUtils(content));
</script>

<section {...pa(content)}>
  <OptimizelyGridSection nodes={content.nodes} />
</section>
