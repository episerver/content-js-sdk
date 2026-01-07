import { contentType, Infer } from '@optimizely/cms-sdk';
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
  content: Infer<typeof FxFigureCT>;
};

export default function FxFigure({ content }: Props) {
  return (
    <div className={css.FxFigure}>
      <div>
        {content.highlightText}

        <span className={css.muted}>{content.normalText}</span>
      </div>
    </div>
  );
}
