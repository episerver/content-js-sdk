<script lang="ts">
  import { getRichTextTree, type RichTextPropsBase } from '@optimizely/cms-sdk/core';
  import RichTextNode from './RichTextNode.svelte';

  let { content }: { content?: RichTextPropsBase['content'] } = $props();

  const tree = $derived(getRichTextTree(content));
</script>

{#each tree as node}<RichTextNode {node} />{/each}
