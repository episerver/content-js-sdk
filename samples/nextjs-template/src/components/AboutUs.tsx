import { contentType, Infer } from '@optimizely/cms-sdk';
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
  opti: Infer<typeof AboutUsContentType>;
};

// Custom renderer for 'heading-two' elements to apply specific styles
const customHeadingTwo = (props: ElementProps) => {
  return <h1 style={{ color: 'blue' }}>{props.text}</h1>;
};

export default function AboutUs({ opti }: AboutUsProps) {
  const { src, alt } = getPreviewUtils(opti);
  return (
    <section className="about-us">
      {opti.image && (
        <div className="about-us-image">
          {/* Added as example for using src and alt utilities */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src(opti.image)} alt={alt(opti.image)} />
        </div>
      )}
      <h2>{opti.heading}</h2>
      <div className="about-us-content">
        <div className="about-us-text">
          <RichText
            content={opti.body?.json}
            elements={{
              'heading-two': customHeadingTwo,
            }}
          />
        </div>
      </div>
    </section>
  );
}
