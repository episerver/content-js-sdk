<script lang="ts">
  import type { OptimizelyContent } from '@optimizely/cms-sdk/core';
  import { svelteRegistry } from '@/lib/svelteRegistry';
  import { setRegistry } from './optimizely/context';
  import OptimizelyComponent from './optimizely/OptimizelyComponent.svelte';

  let { content }: { content: OptimizelyContent } = $props();

  setRegistry(svelteRegistry);
</script>

<OptimizelyComponent {content} />
