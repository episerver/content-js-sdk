import { ContentProps, contentType } from '@optimizely/cms-sdk';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { EventCardComponent } from '../elements/EventCard';

export const EventCardsListContentType = contentType({
  key: 'EventCardsList',
  displayName: 'Event Cards List',
  baseType: '_component',
  description: 'Component for rendering list of events.',
  properties: {
    title: {
      type: 'string',
      displayName: 'Title',
    },
    events: {
      type: 'array',
      items: {
        type: 'content',
        allowedTypes: [EventCardComponent],
      },
      displayName: 'List of events',
    },
  },
  compositionBehaviors: ['sectionEnabled'],
});

export type EventCardsListProps = {
  content: ContentProps<typeof EventCardsListContentType>;
};

function EventCardsList({ content }: EventCardsListProps) {
  return (
    <section>
      <h2 className='text-4xl md:text-6xl font-bold mb-4 tracking-tight border-b border-white/10 pb-4'>
        {content.title}
      </h2>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {content.events?.map((eventContent, index) => (
          <OptimizelyComponent content={eventContent} key={`event-${index + 1}`} />
        ))}
      </div>
    </section>
  );
}

export default EventCardsList;
