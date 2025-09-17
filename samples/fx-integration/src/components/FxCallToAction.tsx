import { contentType, Infer } from '@episerver/cms-sdk';

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
  return (
    <a href={opti.link ?? '#'} className={opti.appearance ?? ''}>
      <span>{opti.icon}</span>
      {opti.text}
    </a>
  );
}
