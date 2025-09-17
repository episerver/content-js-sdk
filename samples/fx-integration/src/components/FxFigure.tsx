import { contentType, Infer } from '@episerver/cms-sdk';
import { FxTextCt } from './FxText';

export const FxFigureCT = contentType({
  key: 'FxFigure',
  displayName: 'Fx Figure',
  baseType: '_component',
  properties: {
    text: { type: 'content', allowedTypes: [FxTextCt] },
    logo: { type: 'string' },
    link: { type: 'link' },
  },
});

type Props = {
  opti: Infer<typeof FxFigureCT>;
};

export default function FxFigure({ opti }: Props) {
  return <></>;
}
