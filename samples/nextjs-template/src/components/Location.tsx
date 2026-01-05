import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import Image from 'next/image';

export const LocationContentType = contentType({
  key: 'Location',
  displayName: 'Location component',
  baseType: '_component',
  properties: {
    name: {
      type: 'string',
    },
    city: {
      type: 'string',
    },
    address: {
      type: 'string',
    },
    phone: {
      type: 'string',
    },
  },
});

type Props = {
  content: ContentProps<typeof LocationContentType>;
};

export default function Location({ content }: Props) {
  const { pa } = getPreviewUtils(content);

  return (
    <section className="location">
      <Image
        className="location__image"
        src="/building.svg"
        alt="Location Image"
        width={20}
        height={20}
      />
      <h1 className="location__name" {...pa('name')}>
        {content.name}
      </h1>
      <p className="location__city" {...pa('city')}>
        {content.city}
      </p>
      <p className="location__address" {...pa('address')}>
        {content.address}
      </p>
      <p className="location__phone" {...pa('phone')}>
        {content.phone}
      </p>
    </section>
  );
}
