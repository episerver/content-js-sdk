import { ContentProps, contentType } from '@optimizely/cms-sdk';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { TeaserCardContract } from '../contracts/TeaserCard';
import { ButtonContentType } from './Button';

export const NewsEventsListContentType = contentType({
  key: 'NewsEventsList',
  displayName: 'News & Events List',
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
        allowedTypes: [TeaserCardContract],
      },
      displayName: 'List of Teasers',
    },
    call_to_action: {
      type: 'component',
      contentType: ButtonContentType,
      displayName: 'Call to Action Text',
      group: 'Content',
    },
  },
  compositionBehaviors: ['sectionEnabled'],
});

export type NewsEventsListProps = {
  content: ContentProps<typeof NewsEventsListContentType>;
};

function NewsEventsList({ content }: NewsEventsListProps) {
  return (
    <div className='space-y-8'>
      {/* Title */}
      {content.title && (
        <h2 className='text-3xl md:text-3xl font-bold text-gray-900 uppercase tracking-tight'>
          {content.title}
        </h2>
      )}

      {/* Teasers List */}
      <div className='space-y-6'>
        {content.teasers?.map((teaser, index) => {
          return <OptimizelyComponent key={index} content={teaser} tag='teaser' />;
        })}
      </div>

      {/* Call to Action Button */}
      {content.call_to_action && (
        <div className='pt-4'>
          <OptimizelyComponent content={content.call_to_action} />
        </div>
      )}
    </div>
  );
}

export default NewsEventsList;
