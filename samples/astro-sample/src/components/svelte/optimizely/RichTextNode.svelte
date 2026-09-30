<script lang="ts">
  import {
    getMarkTag,
    getRichTextElement,
    toStyleString,
    type RenderNode,
  } from '@optimizely/cms-sdk/core';
  import RichTextNode from './RichTextNode.svelte';

  let { node }: { node: RenderNode } = $props();
</script>

{#snippet marked(text: string, marks: string[])}
  {#if marks.length > 0}
    <svelte:element this={getMarkTag(marks[0])}
      >{@render marked(text, marks.slice(1))}</svelte:element
    >
  {:else}{text}{/if}
{/snippet}

{#if node.type === 'text'}
  {@render marked(node.content ?? '', node.marks ?? [])}
{:else}
  {@const { tag, selfClosing, attributes, style } = getRichTextElement(node)}
  {#if selfClosing}
    <svelte:element this={tag} {...attributes} style={toStyleString(style)} />
  {:else}
    <svelte:element this={tag} {...attributes} style={toStyleString(style)}>
      {#each node.children ?? [] as child}<RichTextNode node={child} />{/each}
    </svelte:element>
  {/if}
{/if}
