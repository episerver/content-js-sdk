import { contentType, Infer } from '@optimizely/cms-sdk';
import css from './components.module.css';

export const FxCallToActionCT = contentType({
  key: 'FxCallToAction',
  displayName: 'Fx Call to Action',
  baseType: '_component',
  properties: {
    text: { type: 'string' },
    link: { type: 'link' },
    appearance: {
      type: 'string',
      enum: [
        { value: 'primary', displayName: 'primary' },
        { value: 'secondary', displayName: 'secondary' },
      ],
    },
  },
});

type Props = {
  opti: Infer<typeof FxCallToActionCT>;
};

export default function FxCallToAction({ opti }: Props) {
  const cls = [
    css.FxCallToAction,
    opti.appearance && css[opti.appearance],
  ].join(' ');
  return (
    <a className={cls} href={opti.link?.url.default ?? '#'}>
      {opti.text}
    </a>
  );
}
