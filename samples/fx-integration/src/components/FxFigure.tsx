import { contentType, Infer } from '@episerver/cms-sdk';
import css from './components.module.css';

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
  return (
    <div className={css.FxFigure}>
      <div>
        {opti.highlightText}

        <span className={css.muted}>{opti.normalText}</span>
      </div>
    </div>
  );
}
