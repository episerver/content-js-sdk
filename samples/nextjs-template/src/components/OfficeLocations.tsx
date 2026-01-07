import { contentType, ContentProps } from '@optimizely/cms-sdk';
import {
  getPreviewUtils,
  OptimizelyComponent,
} from '@optimizely/cms-sdk/react/server';
import { LocationContentType } from './Location';

export const OfficeContentType = contentType({
  key: 'OfficeLocations',
  displayName: 'Office Locations',
  baseType: '_component',
  properties: {
    title: {
      type: 'string',
    },
    subtitle: {
      type: 'string',
    },
    offices: {
      type: 'array',
      items: {
        type: 'content',
        allowedTypes: [LocationContentType],
      },
    },
  },
  compositionBehaviors: ['sectionEnabled'],
});

type Props = {
  content: ContentProps<typeof OfficeContentType>;
};

export default function OfficeLocations({ content }: Props) {
  const { pa } = getPreviewUtils(content);

  return (
    <section className="office-locations">
      <h1 className="office-locations__title" {...pa('title')}>
        {content.title}
      </h1>
      <p className="office-locations__subtitle" {...pa('subtitle')}>
        {content.subtitle}
      </p>
      <div className="office-locations__list" {...pa('offices')}>
        {(content.offices ?? []).map((office, i) => (
          <OptimizelyComponent content={office} key={i} />
        ))}
      </div>
    </section>
  );
}
