import { contentType, Infer } from '@episerver/cms-sdk';
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
  opti: Infer<typeof FxSectionHeadingCT>;
};

export default function FxSectionHeading({ opti }: Props) {
  return (
    <div className={css.FxSectionHeading}>
      {opti.pretitle && <h2 className={css.pretitle}>{opti.pretitle}</h2>}
      {opti.title && <p className={css.title}>{opti.title}</p>}
      {opti.subtitle && <p className={css.subtitle}>{opti.subtitle}</p>}
    </div>
  );
}
