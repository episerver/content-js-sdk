import { contentType, Infer } from '@episerver/cms-sdk';
import { FxCallToActionCT } from './FxCallToAction';

export const FxHeroContentType = contentType({
  key: 'FxHero',
  displayName: 'Fx Hero',
  baseType: '_component',
  properties: {
    title: { type: 'string' },
    subtitle: { type: 'string' },
    ctas: {
      type: 'array',
      items: { type: 'content', allowedTypes: [FxCallToActionCT] },
    },
  },
});

type Props = {
  opti: Infer<typeof FxHeroContentType>;
};

export default function FxHero({ opti }: Props) {
  return (
    <>
      <h1>{opti.title}</h1>
      <p>{opti.subtitle}</p>
    </>
  );
}
