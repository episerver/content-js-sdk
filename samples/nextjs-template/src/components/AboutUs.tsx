import { contentType, damAssets, ContentProps } from '@optimizely/cms-sdk';
import { RichText, ElementProps } from '@optimizely/cms-sdk/react/richText';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const AboutUsContentType = contentType({
  key: 'AboutUs',
  baseType: '_component',
  displayName: 'About Us',
  properties: {
    heading: {
      type: 'string',
      group: 'Information',
    },
    body: {
      type: 'richText',
    },
    image: {
      type: 'contentReference',
      allowedTypes: ['_image'],
    },
  },
  compositionBehaviors: ['sectionEnabled'],
});

export type AboutUsProps = {
  content: ContentProps<typeof AboutUsContentType>;
};

// Custom renderer for 'heading-two' elements to apply specific styles
const customHeadingTwo = (props: ElementProps) => {
  return <h1 style={{ color: 'blue' }}>{props.text}</h1>;
};

export default function AboutUs({ content }: AboutUsProps) {
  const { src } = getPreviewUtils(content);
  const { getSrcset, getAlt } = damAssets(content);
  const image = src(content.image);
  return (
    <section className="about-us">
      {content.image && (
        <div className="about-us-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {image ? (<img src={image} srcSet={getSrcset(content.image)} sizes="(max-width: 768px) 100vw, 50vw" alt={getAlt(content.image, 'About us image')}/>) : null}
        </div>
      )}
      <h2>{content.heading}</h2>
      <div className="about-us-content">
        <div className="about-us-text">
          <RichText
            content={content.body?.json}
            elements={{
              'heading-two': customHeadingTwo,
            }}
          />
        </div>
      </div>
    </section>
  );
}
