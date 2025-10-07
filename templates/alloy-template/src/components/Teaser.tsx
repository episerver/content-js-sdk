import { contentType, Infer } from '@optimizely/cms-sdk';

export const TeaserContentType = contentType({
  key: 'Teaser',
  displayName: 'Teaser',
  baseType: '_component',
  properties: {
    heading: {
      type: 'string',
      displayName: 'Heading',
    },
    text: {
      type: 'string',
      displayName: 'Text',
    },
    image: {
      type: 'contentReference',
      allowedTypes: ['_image'],
      displayName: 'Image',
    },
    link: {
      type: 'url',
      displayName: 'Link',
    },
  },
});

type TeaserProps = {
  opti: Infer<typeof TeaserContentType>;
  layout?: 'vertical' | 'horizontal';
};

function Teaser({ opti, layout }: TeaserProps) {
  if (layout === 'horizontal') {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {opti.image?.url.default && (
            <div className="md:w-1/2 h-64 md:h-auto overflow-hidden">
              <img
                src={opti.image?.url.default}
                alt="teaser_image"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="md:w-1/2 p-8 flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
              {opti.heading}
            </h2>
            <blockquote className="text-gray-700 text-base leading-relaxed mb-4 italic">
              "{opti.text}"
            </blockquote>
          </div>
        </div>
      </div>
    );
  }

  // Vertical layout (default)
  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
      {opti.image?.url.default && (
        <div className="h-48 w-full overflow-hidden">
          <img
            src={opti.image?.url.default}
            alt="teaser_image"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-3 uppercase tracking-wide">
          {opti.heading}
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed">{opti.text}</p>
      </div>
    </div>
  );
}

export default Teaser;
