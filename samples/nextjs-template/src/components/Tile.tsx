import { contentType, displayTemplate, Infer } from '@episerver/cms-sdk';
import { getPreviewUtils } from '@episerver/cms-sdk/react/server';

export const TileContentType = contentType({
  key: 'Tile',
  displayName: 'Tile Component',
  baseType: '_component',
  properties: {
    title: {
      type: 'string',
    },
    description: {
      type: 'string',
    },
  },
  compositionBehaviors: ['elementEnabled'],
});

export const TileRowDisplayTemplate = displayTemplate({
  key: 'TileRowDisplayTemplate',
  isDefault: true,
  displayName: 'TileRowDisplayTemplate',
  nodeType: 'row',
  settings: {
    padding: {
      editor: 'select',
      displayName: 'Padding',
      sortOrder: 0,
      choices: {
        small: {
          displayName: 'Small',
          sortOrder: 1,
        },
        medium: {
          displayName: 'Medium',
          sortOrder: 2,
        },
        large: {
          displayName: 'Large',
          sortOrder: 3,
        },
      },
    },
  },
});

export const TileColumnDisplayTemplate = displayTemplate({
  key: 'TileColumnDisplayTemplate',
  isDefault: true,
  displayName: 'TileColumnDisplayTemplate',
  nodeType: 'column',
  settings: {
    background: {
      editor: 'select',
      displayName: 'Background Color',
      sortOrder: 0,
      choices: {
        red: {
          displayName: 'Red',
          sortOrder: 1,
        },
        black: {
          displayName: 'Black',
          sortOrder: 2,
        },
        grey: {
          displayName: 'Grey',
          sortOrder: 3,
        },
      },
    },
  },
});

export const SquarTileDisplayTemplate = displayTemplate({
  key: 'SquarTileDisplayTemplate',
  isDefault: false,
  displayName: 'SquarTileDisplayTemplate',
  baseType: '_component',
  settings: {
    color: {
      editor: 'select',
      displayName: 'Description font color',
      sortOrder: 0,
      choices: {
        yellow: {
          displayName: 'Yellow',
          sortOrder: 1,
        },
        green: {
          displayName: 'Green',
          sortOrder: 2,
        },
        orange: {
          displayName: 'Orange',
          sortOrder: 3,
        },
      },
    },
  },
  tag: 'SquarTile',
});

type Props = {
  opti: Infer<typeof TileContentType>;
  displaySettings?: Record<string, string>;
};

export default function Tile({ opti }: Props) {
  const { pa } = getPreviewUtils(opti);
  return (
    <div className="tile">
      <h1 {...pa('title')}>{opti.title}</h1>
      <p {...pa('description')}>{opti.description}</p>
    </div>
  );
}

// This is a specific tile component that uses the SquarTileDisplayTemplate
export function SquarTile({ opti, displaySettings }: Props) {
  const { pa } = getPreviewUtils(opti);
  return (
    <div className="squarTile">
      <h4 {...pa('title')}>{opti.title}</h4>
      <p style={{ color: displaySettings?.color }} {...pa('description')}>
        {opti.description}
      </p>
    </div>
  );
}
