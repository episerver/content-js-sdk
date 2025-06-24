import { contentType, Infer } from '@episerver/cms-sdk';
import { getPreviewUtils } from '@episerver/cms-sdk/react/server';
export const CallToActionContentType = contentType({
  key: 'CallToAction',
  baseType: '_component',
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
  const { pa } = getPreviewUtils(opti);

  return (
    <a href={opti.link ?? '#'} {...pa('label')}>
      {opti.label}
    </a>
  );
}
