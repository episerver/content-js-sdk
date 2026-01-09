import { contentType, ContentProps } from '@optimizely/cms-sdk';

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
  content: ContentProps<typeof FxQuoteCT>;
};

export default function FxQuote({ content }: Props) {
  return (
    <div>
      <div>{content.quote}</div>
    </div>
  );
}
