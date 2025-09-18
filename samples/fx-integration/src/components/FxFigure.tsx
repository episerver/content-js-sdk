import { contentType, Infer } from '@episerver/cms-sdk';

export const FxFigureCT = contentType({
  key: 'FxFigure',
  displayName: 'Fx Figure',
  baseType: '_component',
  properties: {
    highlightText: { type: 'string' },
    normalText: { type: 'string' },
    logo: { type: 'string' },
    link: { type: 'link' },
  },
  compositionBehaviors: ['elementEnabled'],
});

type Props = {
  opti: Infer<typeof FxFigureCT>;
};

export default function FxFigure({ opti }: Props) {
  return <></>;
}
