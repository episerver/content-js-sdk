import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { RichText } from '@optimizely/cms-sdk/react/richText';
import {
  ComponentContainerProps,
  getPreviewUtils,
  OptimizelyComposition,
} from '@optimizely/cms-sdk/react/server';
import { SEOContentType } from './base/SEO';

export const StandardContentType = contentType({
  key: 'Standard',
  displayName: 'Standard Page',
  baseType: '_experience',
  mayContainTypes: ['*'],
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
  content: ContentProps<typeof StandardContentType>;
};

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);
  return <div {...pa(node)} className="w-full block">{children}</div>;
}

function Standard({ content }: StandardPageProps) {
  const { pa } = getPreviewUtils(content);
  return (
    <main className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 md:py-10 lg:px-8 lg:py-12">
        <div className="space-y-6 sm:space-y-8">
          {/* Heading and Description */}
          <div className="space-y-3 sm:space-y-4">
            <h1
              {...pa('heading')}
              className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl lg:text-5xl"
            >
              {content.heading}
            </h1>
            <p
              {...pa('description')}
              className="text-base leading-relaxed text-gray-700 sm:text-lg md:text-xl"
            >
              {content.description}
            </p>
          </div>

          {/* Main Body Content */}
          <RichText
            {...pa('main_body')}
            content={content.main_body?.json}
            className="space-y-4 sm:space-y-6"
          />

          {/* section Area */}
          <div className="flex flex-col space-y-6 sm:space-y-8">
            <OptimizelyComposition
              nodes={content.composition.nodes ?? []}
              ComponentWrapper={ComponentWrapper}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default Standard;
