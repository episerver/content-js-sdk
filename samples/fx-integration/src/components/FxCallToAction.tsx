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
  content: Infer<typeof FxCallToActionCT>;
};

export default function FxCallToAction({ content }: Props) {
  const cls = [
    css.FxCallToAction,
    content.appearance && css[content.appearance],
  ].join(' ');
  return (
    <a className={cls} href={content.link?.url.default ?? '#'}>
      {content.text}
    </a>
  );
}
