import { contentType, Infer } from '@episerver/cms-sdk';
import { FxCallToActionCT } from './FxCallToAction';
import css from './components.module.css';
import { OptimizelyComponent } from '@episerver/cms-sdk/react/server';

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
  compositionBehaviors: ['sectionEnabled'],
});

type Props = {
  opti: Infer<typeof FxHeroContentType>;
};

export default function FxHero({ opti }: Props) {
  return (
    <div className={css.FxHero}>
      <h1>{opti.title}</h1>
      <p>{opti.subtitle}</p>

      <div className={css.ctas}>
        {opti.ctas?.map((cta) => (
          <OptimizelyComponent opti={cta} />
        ))}
      </div>
    </div>
  );
}
