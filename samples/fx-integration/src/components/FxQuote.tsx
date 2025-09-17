import { contentType, Infer } from '@episerver/cms-sdk';

export const FxQuoteCT = contentType({
  key: 'FxQuote',
  displayName: 'Fx Quote',
  baseType: '_component',
  properties: {
    quote: { type: 'string' },
    role: { type: 'string' },
    author: { type: 'string' },
    logo: { type: 'string' },
    link: { type: 'link' },
  },
});

type Props = {
  opti: Infer<typeof FxQuoteCT>;
};

export default function FxQuote({ opti }: Props) {
  return <></>;
}
