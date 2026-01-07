import { contentType, Infer } from '@optimizely/cms-sdk';
import { FxCallToActionCT } from './FxCallToAction';
import css from './components.module.css';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';

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
  content: Infer<typeof FxHeroContentType>;
};

export default function FxHero({ content }: Props) {
  return (
    <div className={css.FxHero}>
      <h1>{content.title}</h1>
      <p>{content.subtitle}</p>

      <div className={css.ctas}>
        {content.ctas?.map((cta, i) => (
          <OptimizelyComponent key={i} opti={cta} />
        ))}
      </div>
    </div>
  );
}
