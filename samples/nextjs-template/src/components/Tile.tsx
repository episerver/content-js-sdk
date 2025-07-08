import { contentType, displayTemplate, Infer } from '@episerver/cms-sdk';

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

type Props = {
  opti: Infer<typeof TileContentType>;
};

export default function Tile({ opti }: Props) {
  return (
    <div className="tile">
      <div>Base Tile</div>
      <h1>{opti.title}</h1>
      <p>{opti.description}</p>
    </div>
  );
}

export function TileA({ opti }: Props) {
  return (
    <div className="tile">
      <div>TileA</div>
      <h4>{opti.title}</h4>
      <p>{opti.description}</p>
    </div>
  );
}
