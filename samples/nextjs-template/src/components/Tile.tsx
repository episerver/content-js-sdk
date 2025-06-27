import { contentType, Infer } from '@episerver/cms-sdk';

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

type Props = {
  opti: Infer<typeof TileContentType>;
};

export default function Tile({ opti }: Props) {
  return (
    <div className="tile">
      <h1>{opti.title}</h1>
      <p>{opti.description}</p>
    </div>
  );
}
