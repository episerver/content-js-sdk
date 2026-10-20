import type { ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import { TileContentType, SquareDisplayTemplate } from '@/lib/contentTypes';

type Props = {
  content: ContentProps<typeof TileContentType>;
  displaySettings?: ContentProps<typeof SquareDisplayTemplate>;
};

export default function Tile({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <div className='tile'>
      <h1 {...pa('title')}>{content.title}</h1>
      <p {...pa('description')}>{content.description}</p>
    </div>
  );
}

// This is a specific tile component that uses the SquareDisplayTemplate
export function SquareTile({ content, displaySettings }: Props) {
  const { pa } = getPreviewUtils(content);

  return (
    <div className='squarTile'>
      <h4 {...pa('title')}>{content.title}</h4>
      <p
        style={{
          color: displaySettings?.color,
          flexDirection: displaySettings?.orientation === 'horizontal' ? 'row' : 'column',
        }}
        {...pa('description')}
      >
        {content.description}
      </p>
    </div>
  );
}
