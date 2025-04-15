import { contentType, Infer } from 'optimizely-cms-sdk';

export const ContentType = contentType({
  key: 'Landing',
  displayName: 'Landing page',
  baseType: 'page',
  properties: {
    heading: { type: 'string' },
    summary: { type: 'string' },

    background: { type: 'contentReference' },
    theme: {
      type: 'string',
      enum: {
        values: [
          { displayName: 'Dark', value: 'dark' },
          { displayName: 'Light', value: 'light' },
        ],
      },
    },
    sections: {
      type: 'array',
      items: {
        type: 'content',
        allowedTypes: ['LandingSection'],
      },
    },
  },
});

type Props = {
  opti: Infer<typeof ContentType>;
};

export default function LandingComponent({ opti }: Props) {
  return <div>{opti.heading}</div>;
}
