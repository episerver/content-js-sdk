import { contentType, Infer } from '@optimizely/cms-sdk';
import css from './components.module.css';

export const FxSectionHeadingCT = contentType({
  key: 'FxSectionHeading',
  displayName: 'Fx Section heading',
  baseType: '_component',
  properties: {
    pretitle: { type: 'string' },
    title: { type: 'string' },
    subtitle: { type: 'string' },
    align: { type: 'string' },
  },
  compositionBehaviors: ['sectionEnabled'],
});

type Props = {
  content: Infer<typeof FxSectionHeadingCT>;
};

export default function FxSectionHeading({ content }: Props) {
  return (
    <div className={css.FxSectionHeading}>
      {content.pretitle && <h2 className={css.pretitle}>{content.pretitle}</h2>}
      {content.title && <p className={css.title}>{content.title}</p>}
      {content.subtitle && <p className={css.subtitle}>{content.subtitle}</p>}
    </div>
  );
}
