import { contentType, Infer } from '@episerver/cms-sdk';

export const FxTextCt = contentType({
  key: 'FxText',
  displayName: 'Fx Text',
  baseType: '_component',
  properties: {
    highlight: { type: 'string' },
    normal: { type: 'string' },
    style: {
      type: 'string',
      enum: [
        { value: 'subtle', displayName: 'Subtle' },
        { value: 'animated', displayName: 'Animated' },
      ],
    },
  },
});

type Props = {
  opti: Infer<typeof FxTextCt>;
};

export default function FxText({ opti }: Props) {
  return (
    <span className="hdsadkl">
      <span className="highlight">{opti.highlight}</span>
      <span className="normal">{opti.normal}</span>
    </span>
  );
}
