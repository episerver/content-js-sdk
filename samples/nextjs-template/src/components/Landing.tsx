import { contentType, Infer } from 'optimizely-cms-sdk';
import { OptimizelyComponent } from 'optimizely-cms-sdk/dist/render/react';
import { LandingSectionContentType } from './LandingSection';

export const ContentType = contentType({
  key: 'Landing',
  displayName: 'Landing page',
  baseType: 'page',
  properties: {
    heading: { type: 'string' },
    summary: { type: 'string' },

    background: { type: 'contentReference', allowedTypes: ['Image'] },
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
        allowedTypes: [LandingSectionContentType],
      },
    },
  },
});

type Props = {
  opti: Infer<typeof ContentType>;
};

export default function LandingComponent({ opti }: Props) {
  return (
    <main>
      <header className={['uni-hero', opti.theme].join(' ')}>
        <img src={opti.background.url.default} alt="" />
        <div className="heading">
          <h1>{opti.heading}</h1>
          <p>{opti.summary}</p>
        </div>
      </header>
      {opti.sections.map((section, i) => (
        <OptimizelyComponent key={i} opti={section} />
      ))}
    </main>
  );
}
