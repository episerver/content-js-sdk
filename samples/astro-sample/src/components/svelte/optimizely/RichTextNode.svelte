<script lang="ts">
  import { defaultMarkTypeMap, type RenderNode } from '@optimizely/cms-sdk/core';
  import RichTextNode from './RichTextNode.svelte';
  import { toElementProps } from './richText';

  let { node }: { node: RenderNode } = $props();

  const VOID_TAGS = ['img', 'br', 'hr'];
</script>

{#snippet marked(text: string, marks: string[])}
  {#if marks.length > 0}
    <svelte:element this={defaultMarkTypeMap[marks[0]] ?? 'span'}
      >{@render marked(text, marks.slice(1))}</svelte:element
    >
  {:else}{text}{/if}
{/snippet}

{#if node.type === 'text'}
  {@render marked(node.content ?? '', node.marks ?? [])}
{:else}
  {@const { tag, attributes } = toElementProps(node)}
  {#if VOID_TAGS.includes(tag)}
    <svelte:element this={tag} {...attributes} />
  {:else}
    <svelte:element this={tag} {...attributes}>
      {#each node.children ?? [] as child}<RichTextNode node={child} />{/each}
    </svelte:element>
  {/if}
{/if}
