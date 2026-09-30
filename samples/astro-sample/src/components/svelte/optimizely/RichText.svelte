<script lang="ts">
  import {
    buildRenderTree,
    resolveRichTextNodes,
    type RichTextPropsBase,
  } from '@optimizely/cms-sdk/core';
  import RichTextNode from './RichTextNode.svelte';

  let { content }: { content?: RichTextPropsBase['content'] } = $props();

  const tree = $derived(
    buildRenderTree(resolveRichTextNodes(content), { decodeHtmlEntities: true }),
  );
</script>

{#each tree as node}<RichTextNode {node} />{/each}
