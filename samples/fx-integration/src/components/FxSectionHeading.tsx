import { contentType, Infer } from '@episerver/cms-sdk';

export const FxSectionHeadingCT = contentType({
  key: 'FxSectionHeading',
  displayName: 'Fx Section heading',
  baseType: '_component',
  properties: {
    icon: { type: 'string' },
    pretitle: { type: 'string' },
    title: { type: 'string' },
    subtitle: { type: 'string' },
    align: { type: 'string' },
  },
});

type Props = {
  opti: Infer<typeof FxSectionHeadingCT>;
};

export default function FxSectionHeading({ opti }: Props) {
  return (
    <>
      <h1>{opti.title}</h1>
      <p>{opti.subtitle}</p>
    </>
  );
}
