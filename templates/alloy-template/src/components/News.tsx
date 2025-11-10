import { contentType, Infer } from '@optimizely/cms-sdk';
import { RichText } from '@optimizely/cms-sdk/react/richText';
import {
  ComponentContainerProps,
  getPreviewUtils,
  OptimizelyExperience,
} from '@optimizely/cms-sdk/react/server';
import { StandardContentType } from './Standard';

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
    // SEO group
    site_title: {
      type: 'string',
      displayName: 'Title',
      group: 'SEO',
    },
    keywords: {
      type: 'array',
      items: {
        type: 'string',
      },
      displayName: 'Keywords',
      group: 'SEO',
    },
    page_description: {
      type: 'string',
      displayName: 'Page Description',
      group: 'SEO',
    },
    disable_indexing: {
      type: 'boolean',
      displayName: 'Disable Indexing',
      group: 'SEO',
    },
  },
});

type NewsPageProps = {
  opti: Infer<typeof NewsContentType>;
};

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);
  return <div {...pa(node)}>{children}</div>;
}

function News({ opti }: NewsPageProps) {
  const { pa } = getPreviewUtils(opti);
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          {/* Main Content */}
          <div className="space-y-8">
            {/* Heading and Description */}
            <div className="space-y-4">
              <h1
                {...pa('title')}
                className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl"
              >
                {opti.title}
              </h1>
              <p
                {...pa('description')}
                className="text-lg leading-relaxed text-gray-700"
              >
                {opti.description}
              </p>
            </div>

            {/* Main Body Content */}
            <div className="space-y-6">
              <RichText {...pa('main_body')} content={opti.main_body?.json} />
            </div>
          </div>

          <OptimizelyExperience
            nodes={opti.composition.nodes ?? []}
            ComponentWrapper={ComponentWrapper}
          />
        </div>
      </div>
    </main>
  );
}

export default News;
