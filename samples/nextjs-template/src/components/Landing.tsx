import { contentType, Infer } from 'optimizely-cms-sdk';
import { OptimizelyComponent } from 'optimizely-cms-sdk/dist/render/react';

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
  return (
    <div>
      <h1>{opti.heading}</h1>
      <p>{opti.summary}</p>
      {opti.sections.map((section) => (
        <OptimizelyComponent opti={section} />
      ))}
    </div>
  );
}
