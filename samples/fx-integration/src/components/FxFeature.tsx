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
  opti: Infer<typeof FxFeatureCT>;
};

export default function FxFeature({ opti }: Props) {
  return (
    <div className={css.FxFeature}>
      <h3>{opti.title}</h3>
      <p>{opti.text}</p>
    </div>
  );
}
