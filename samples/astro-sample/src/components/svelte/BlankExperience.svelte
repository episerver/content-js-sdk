<script lang="ts">
  import type { ContentProps } from '@optimizely/cms-sdk';
  import type { BlankExperienceContentType } from '@/lib/contentTypes';
  import OptimizelyComposition from './optimizely/OptimizelyComposition.svelte';

  let { content }: { content: ContentProps<typeof BlankExperienceContentType> } = $props();
</script>

<main class="blank-experience">
  <OptimizelyComposition nodes={content.composition.nodes ?? []} />
</main>
