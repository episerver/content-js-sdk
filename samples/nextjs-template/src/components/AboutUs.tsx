import { contentType, Infer } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const AboutUsContentType = contentType({
  key: 'AboutUs',
  baseType: '_component',
  displayName: 'About Us',
  properties: {
    heading: {
      type: 'string',
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

export default function AboutUs({ opti }: AboutUsProps) {
  const { pa } = getPreviewUtils(opti);
  return (
    <section className="about-us">
      {opti.image && (
        <div className="about-us-image">
          <img src={opti.image.url.default ?? ''} alt="aboutus_image" />
        </div>
      )}
      <h2>{opti.heading}</h2>
      <div className="about-us-content">
        <div className="about-us-text">
          <RichText
            {...pa('body')}
            content={opti.body?.json}
            elements={{
              'heading-two': (props) => (
                <h1 style={{ color: 'blue' }}>{props.text}</h1>
              ),
            }}
          />
        </div>
      </div>
    </section>
  );
}
