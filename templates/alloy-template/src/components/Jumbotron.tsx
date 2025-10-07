import { contentType, Infer } from '@optimizely/cms-sdk';

export const JumbotronContentType = contentType({
  key: 'Jumbotron',
  displayName: 'Jumbotron',
  baseType: '_component',
  properties: {
    image: {
      type: 'contentReference',
      allowedTypes: ['_image'],
      displayName: 'Image',
    },
    image_description: {
      type: 'string',
      displayName: 'Image Description',
    },
    large_heading: {
      type: 'string',
      displayName: 'Large Heading',
    },
    small_heading: {
      type: 'string',
      displayName: 'Small Heading',
    },
    button_link: {
      type: 'url',
      displayName: 'Button Link',
    },
    button_text: {
      type: 'string',
      displayName: 'Button Text',
    },
  },
});

type JumbotronProps = {
  opti: Infer<typeof JumbotronContentType>;
};

function Jumbotron({ opti }: JumbotronProps) {
  return (
    <div className="relative h-96 md:h-[500px] overflow-hidden">
      {/* Background Image */}
      {opti.image?.url.default && (
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: `url(${opti.image.url.default}) !important`,
            backgroundSize: 'cover !important',
            backgroundPosition: 'center !important',
            backgroundRepeat: 'no-repeat !important',
            width: '100%',
            height: '100%',
          }}
        />
      )}

      {/* Dark Overlay - Very light */}
      <div className="absolute inset-0 bg-black bg-opacity-10" />

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl">
            {/* Large Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              {opti.large_heading}
            </h1>

            {/* Small Heading/Description */}
            {opti.small_heading && (
              <p className="text-lg md:text-xl text-white mb-8 leading-relaxed max-w-2xl">
                {opti.small_heading}
              </p>
            )}

            {/* Call to Action Button */}
            {opti.button_link && opti.button_text && (
              <a
                href={opti.button_link.default ?? undefined}
                className="inline-block bg-teal-500 hover:bg-teal-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 text-lg"
              >
                {opti.button_text}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Jumbotron;
