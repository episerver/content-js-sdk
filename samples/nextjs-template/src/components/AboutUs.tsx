import { contentType, Infer } from '@optimizely/cms-sdk';
import { RichText, ElementProps } from '@optimizely/cms-sdk/react/richText';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import Image from 'next/image';

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
  const {  src } = getPreviewUtils(opti);
  return (
    <section className="about-us">
      {opti?.image?.url?.default && (
        <div className="about-us-image">
          <Image src={src(opti.image.url.default)} alt="" fill={true}/>
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
