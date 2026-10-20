<script lang="ts">
  import type { ContentProps } from '@optimizely/cms-sdk';
  import { getPreviewUtils } from '@optimizely/cms-sdk/core';
  import type { BlogExperienceContentType } from '@/lib/contentTypes';
  import OptimizelyComponent from './optimizely/OptimizelyComponent.svelte';
  import OptimizelyComposition from './optimizely/OptimizelyComposition.svelte';

  let { content }: { content: ContentProps<typeof BlogExperienceContentType> } = $props();

  const { pa } = $derived(getPreviewUtils(content));
</script>

<main class="blog-experience">
  <header class="blog-header">
    <h1 {...pa('title')}>{content.title}</h1>
    <p {...pa('subtitle')}>{content.subtitle}</p>
  </header>
  <section class="blog-articles" {...pa('articles')}>
    {#each content.articles ?? [] as article}
      <OptimizelyComponent content={article} />
    {/each}
  </section>
  <OptimizelyComposition nodes={content.composition.nodes ?? []} />
</main>
