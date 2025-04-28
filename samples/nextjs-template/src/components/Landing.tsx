import { contentType, Infer } from 'optimizely-cms-sdk';
import { OptimizelyComponent } from 'optimizely-cms-sdk/dist/render/react';
import { LandingSectionContentType } from './LandingSection';
import { ContentType as CustomImage } from './CustomImage';
import { ArticleContentType } from './Article';

export const ContentType = contentType({
  key: 'Landing',
  displayName: 'Landing page',
  baseType: 'page',
  properties: {
    heading: { type: 'string' },
    summary: { type: 'string' },

    background: { type: 'contentReference', allowedTypes: [CustomImage] },
    theme: {
      type: 'string',
      enum: {
        values: [
          { displayName: 'Dark', value: 'dark' },
          { displayName: 'Light', value: 'light' },
        ],
      },
    },
    firstSection: {
      type: 'content',
      allowedTypes: [LandingSectionContentType],
    },
    sections: {
      type: 'array',
      items: {
        type: 'content',
        allowedTypes: [LandingSectionContentType],
        restrictedTypes: [ArticleContentType],
      },
    },
  },
  component: LandingComponent,
});

type Props = {
  opti: Infer<typeof ContentType>;
};

export default function LandingComponent({ opti }: Props) {
  return (
    <div>
      <h1>{opti.heading}</h1>
      <p>{opti.summary}</p>
      {opti.sections.map((section, i) => (
        <OptimizelyComponent key={i} opti={section} />
      ))}
    </div>
  );
}
