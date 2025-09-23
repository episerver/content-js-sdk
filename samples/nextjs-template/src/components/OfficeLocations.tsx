import { contentType, Infer } from '@optimizely/cms-sdk';
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
  opti: Infer<typeof OfficeContentType>;
};

export default function OfficeLocations({ opti }: Props) {
  const { pa } = getPreviewUtils(opti);

  return (
    <section className="office-locations">
      <h1 className="office-locations__title" {...pa('title')}>
        {opti.title}
      </h1>
      <p className="office-locations__subtitle" {...pa('subtitle')}>
        {opti.subtitle}
      </p>
      <div className="office-locations__list" {...pa('offices')}>
        {(opti.offices ?? []).map((office, i) => (
          <OptimizelyComponent opti={office} key={i} />
        ))}
      </div>
    </section>
  );
}
