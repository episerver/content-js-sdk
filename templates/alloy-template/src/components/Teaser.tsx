import React from 'react';
import Image from 'next/image';
import { contentType, Infer } from '@episerver/cms-sdk';
import { getPreviewUtils } from '@episerver/cms-sdk/react/server';

export const TeaserContentType = contentType({
  key: 'Teaser',
  displayName: 'Teaser',
  baseType: '_component',
  properties: {
    image: {
      type: 'contentReference',
      allowedTypes: ['_image'],
      displayName: 'Image',
    },
    heading: {
      type: 'string',
      displayName: 'Heading',
    },
    text: {
      type: 'string',
      displayName: 'Text',
    },
    link: {
      type: 'contentReference',
      allowedTypes: ['_page'],
      displayName: 'Link',
    },
  },
});

export type TeaserProps = {
  opti: Infer<typeof TeaserContentType>;
};

function Teaser({ opti }: TeaserProps) {
  const { pa, src } = getPreviewUtils(opti);
  return (
    <div className="teaserblock">
      <div className="text-center">
        <a
          {...pa('link')}
          href={opti.link?.url.default || undefined}
          className="text-gray-800 no-underline"
        >
          {opti.image?.url.default && (
            <div className="h-[200px] overflow-hidden rounded">
              <Image
                {...pa('image')}
                src={src(opti.image?.url.default)}
                alt="Teaser Image"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <h2 className="text-[1.2rem] mt-4" {...pa('heading')}>
            {opti.heading}
          </h2>
          <p className="text-[1rem]" {...pa('text')}>
            {opti.text}
          </p>
        </a>
      </div>
    </div>
  );
}

export default Teaser;
