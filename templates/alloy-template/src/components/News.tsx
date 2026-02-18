import { contentType, ContentProps, damAssets } from '@optimizely/cms-sdk';
import { RichText } from '@optimizely/cms-sdk/react/richText';
import {
  ComponentContainerProps,
  getPreviewUtils,
  OptimizelyComposition,
} from '@optimizely/cms-sdk/react/server';
import { StandardContentType } from './Standard';
import { SEOContentType } from './base/SEO';

export const NewsContentType = contentType({
  key: 'News',
  displayName: 'News Page',
  baseType: '_experience',
  mayContainTypes: [StandardContentType],
  properties: {
    image: {
      type: 'contentReference',
      displayName: 'Teaser Image',
    },
    title: {
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

type NewsPageProps = {
  content: ContentProps<typeof NewsContentType>;
};

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);
  return <div {...pa(node)} className="w-full block">{children}</div>;
}

function News({ content }: NewsPageProps) {
  const { pa, src } = getPreviewUtils(content);
  const { getAlt, getSrcset, isDamImageAsset } = damAssets(content);

  return (
    <main className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 md:py-10 lg:px-8 lg:py-12">
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-1 lg:grid-cols-[1fr_320px]">
          {/* Main Content */}
          <div className="space-y-6 sm:space-y-8">
            {/* Heading and Description */}
            <div className="space-y-3 sm:space-y-4">
              <h1
                {...pa('title')}
                className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl lg:text-5xl"
              >
                {content.title}
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

            {/* Media Asset - handles images, videos, and files */}
            {isDamImageAsset(content.image) && (
              <div className="overflow-hidden rounded-lg">
                <img
                  {...pa('image')}
                  src={src(content.image)}
                  srcSet={getSrcset(content.image)}
                  alt={getAlt(content.image, 'Teaser Image')}
                  className="h-auto w-full object-cover aspect-video sm:aspect-auto sm:max-h-100 md:max-h-125 lg:max-h-150"
                />
              </div>
            )}
          </div>

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

export default News;
