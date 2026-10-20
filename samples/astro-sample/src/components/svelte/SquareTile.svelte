<script lang="ts">
  import type { ContentProps } from '@optimizely/cms-sdk';
  import { getPreviewUtils } from '@optimizely/cms-sdk/core';
  import type { SquareDisplayTemplate, TileContentType } from '@/lib/contentTypes';

  let {
    content,
    displaySettings,
  }: {
    content: ContentProps<typeof TileContentType>;
    displaySettings?: ContentProps<typeof SquareDisplayTemplate>;
  } = $props();

  const { pa } = $derived(getPreviewUtils(content));
</script>

<div class="squarTile">
  <h4 {...pa('title')}>{content.title}</h4>
  <p
    style:color={displaySettings?.color}
    style:flex-direction={displaySettings?.orientation === 'horizontal' ? 'row' : 'column'}
    {...pa('description')}
  >
    {content.description}
  </p>
</div>
