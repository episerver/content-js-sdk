import { contentType, Infer } from '@episerver/cms-sdk';

export const FxFeatureCT = contentType({
  key: 'FxFeature',
  displayName: 'Fx Feature',
  baseType: '_component',
  properties: {
    title: { type: 'string' },
    text: { type: 'string' },
  },
});

type Props = {
  opti: Infer<typeof FxFeatureCT>;
};

export default function FxFeature({ opti }: Props) {
  return <></>;
}
