import { contentType, Infer } from 'optimizely-cms-sdk';

export const CallToActionContentType = contentType({
  key: 'CallToAction',
  baseType: 'component',
  displayName: 'Call to Action',
  properties: {
    label: {
      type: 'string',
    },
    link: {
      type: 'string',
    },
  },
  compositionBehaviors: ['elementEnabled'],
});

type Props = {
  opti: Infer<typeof CallToActionContentType>;
};

export default function CallToAction({ opti }: Props) {
  return <a href={opti.link}>{opti.label}</a>;
}
