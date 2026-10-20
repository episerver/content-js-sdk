import { ContentProps, contentType } from '@optimizely/cms-sdk';
import { getPreviewUtils, OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { TeaserCardComponent } from '../elements/TeaserCardComponent';

export const NewsEventsListContentType = contentType({
  key: 'NewsEvents',
  displayName: 'News List',
  baseType: '_component',
  description: 'Component for rendering list of news and events.',
  properties: {
    title: {
      type: 'string',
      displayName: 'Title',
      group: 'Content',
    },
    teasers: {
      type: 'array',
      items: {
        type: 'content',
        allowedTypes: [TeaserCardComponent],
      },
      displayName: 'List of Teasers',
    },
  },
  compositionBehaviors: ['sectionEnabled'],
});

export type NewsEventsListProps = {
  content: ContentProps<typeof NewsEventsListContentType>;
};

function NewsEventsList({ content }: NewsEventsListProps) {
  const { pa } = getPreviewUtils(content);
  return (
    <div className='space-y-8'>
      {content.title && (
        <h2
          className='text-4xl md:text-6xl font-bold mb-4 tracking-tight mt-16'
          {...pa('title')}
        >
          {content.title}
        </h2>
      )}

      <div className='space-y-10' {...pa('teasers')}>
        {content.teasers?.map((teaser, index) => {
          return <OptimizelyComponent key={index} content={teaser} tag='teaser' />;
        })}
      </div>
    </div>
  );
}

export default NewsEventsList;
