import { contentType, Infer } from '@optimizely/cms-sdk';
import { RichText } from '@optimizely/cms-sdk/react/richText';
import {
  ComponentContainerProps,
  getPreviewUtils,
  OptimizelyExperience,
} from '@optimizely/cms-sdk/react/server';
import { SEOContentType } from './base/SEO';

export const StandardContentType = contentType({
  key: 'Standard',
  displayName: 'Standard Page',
  baseType: '_experience',
  mayContainTypes: ['_self', 'News'], // Passed 'News' as a string to avoid circular dependency
  properties: {
    image: {
      type: 'contentReference',
      allowedTypes: ['_image'],
      displayName: 'Teaser Image',
    },
    heading: {
      type: 'string',
      displayName: 'Teaser Text',
    },
    description: {
      type: 'string',
      displayName: 'Description',
    },
    main_body: {
      type: 'richText',
      displayName: 'Main Body',
    },
    seo_properties: {
      type: 'component',
      contentType: SEOContentType,
      displayName: 'SEO',
    },
  },
});

type StandardPageProps = {
  opti: Infer<typeof StandardContentType>;
};

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);
  return <div {...pa(node)}>{children}</div>;
}

function Standard({ opti }: StandardPageProps) {
  const { pa } = getPreviewUtils(opti);
  return (
    <main className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 md:py-10 lg:px-8 lg:py-12">
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-1 lg:grid-cols-[1fr_320px]">
          {/* Main Content */}
          <div className="space-y-6 sm:space-y-8">
            {/* Heading and Description */}
            <div className="space-y-3 sm:space-y-4">
              <h1
                {...pa('heading')}
                className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl lg:text-5xl"
              >
                {opti.heading}
              </h1>
              <p
                {...pa('description')}
                className="text-base leading-relaxed text-gray-700 sm:text-lg md:text-xl"
              >
                {opti.description}
              </p>
            </div>

            {/* Main Body Content */}
            <RichText
              {...pa('main_body')}
              content={opti.main_body?.json}
              className="space-y-4 sm:space-y-6"
            />
          </div>
        </div>
      </div>
      {/* section Area */}
      <div className="">
        <OptimizelyExperience
          nodes={opti.composition.nodes ?? []}
          ComponentWrapper={ComponentWrapper}
        />
      </div>
    </main>
  );
}

export default Standard;
