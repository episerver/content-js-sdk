import {
  contentType,
  displayTemplate,
  ContentProps,
} from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

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

export const SquareDisplayTemplate = displayTemplate({
  key: 'SquareDisplayTemplate',
  isDefault: false,
  displayName: 'SquareDisplayTemplate',
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
    orientation: {
      editor: 'select',
      displayName: 'Orientation',
      sortOrder: 0,
      choices: {
        vertical: { displayName: 'Vertical', sortOrder: 1 },
        horizontal: { displayName: 'Horizontal', sortOrder: 2 },
      },
    },
  },
  tag: 'Square',
});

type Props = {
  content: ContentProps<typeof TileContentType>;
  displaySettings?: ContentProps<typeof SquareDisplayTemplate>;
};

export default function Tile({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <div className="tile">
      <h1 {...pa('title')}>{content.title}</h1>
      <p {...pa('description')}>{content.description}</p>
    </div>
  );
}

// This is a specific tile component that uses the SquareDisplayTemplate
export function SquareTile({ content, displaySettings }: Props) {
  const { pa } = getPreviewUtils(content);

  return (
    <div className="squarTile">
      <h4 {...pa('title')}>{content.title}</h4>
      <p
        style={{
          color: displaySettings?.color,
          flexDirection:
            displaySettings?.orientation === 'horizontal' ? 'row' : 'column',
        }}
        {...pa('description')}
      >
        {content.description}
      </p>
    </div>
  );
}
