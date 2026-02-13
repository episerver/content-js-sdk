import { contentType, Infer } from '@optimizely/cms-sdk';
import css from './components.module.css';

export const FxFeatureCT = contentType({
  key: 'FxFeature',
  displayName: 'Fx Feature',
  baseType: '_component',
  properties: {
    title: { type: 'string' },
    text: { type: 'string' },
  },
  compositionBehaviors: ['elementEnabled'],
});

type Props = {
  content: Infer<typeof FxFeatureCT>;
};

export default function FxFeature({ content }: Props) {
  return (
    <div className={css.FxFeature}>
      <h3>{content.title}</h3>
      <p>{content.text}</p>
    </div>
  );
}
