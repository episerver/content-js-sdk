import { contentType, Infer } from '@episerver/cms-sdk';
import { getPreviewUtils } from '@episerver/cms-sdk/react/server';
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
  opti: Infer<typeof LocationContentType>;
};

export default function Location({ opti }: Props) {
  const { pa } = getPreviewUtils(opti);

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
        {opti.name}
      </h1>
      <p className="location__city" {...pa('city')}>
        {opti.city}
      </p>
      <p className="location__address" {...pa('address')}>
        {opti.address}
      </p>
      <p className="location__phone" {...pa('phone')}>
        {opti.phone}
      </p>
    </section>
  );
}
