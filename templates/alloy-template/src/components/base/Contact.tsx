import React from 'react';
import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const ContactContentType = contentType({
  key: 'Contact',
  displayName: 'Contact',
  baseType: '_component',
  properties: {
    image: {
      type: 'contentReference',
      allowedTypes: ['_image'],
      displayName: 'Image',
    },
    name: {
      type: 'string',
      displayName: 'Name',
    },
    description: {
      type: 'string',
      displayName: 'Description',
    },
    phone: {
      type: 'string',
      displayName: 'Phone',
    },
    email: {
      type: 'string',
      displayName: 'Email',
    },
  },
  compositionBehaviors: ['elementEnabled'],
});

export type ContactProps = {
  content: ContentProps<typeof ContactContentType>;
};

function Contact({ content }: ContactProps) {
  const { pa, src } = getPreviewUtils(content);
  const image = src(content.image);
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
      {content.image?.url.default && (
        <div className="mb-4" {...pa('image')}>
          {image ? (<img
            src={image}
            alt={`${content.name}'s Image`}
            className="w-full h-64 object-cover rounded-lg"
          />):null}
        </div>
      )}
      <div className="space-y-3">
        <h3
          {...pa('name')}
          className="text-2xl font-bold text-gray-900 uppercase tracking-wide"
        >
          {content.name}
        </h3>
        <p
          {...pa('description')}
          className="text-gray-700 text-base leading-relaxed"
        >
          {content.description}
        </p>
        <div className="space-y-2 pt-2">
          {content.email && (
            <a
              {...pa('email')}
              href={`mailto:${content.email}`}
              className="text-teal-600 hover:text-teal-700 font-medium block transition-colors"
            >
              {content.email}
            </a>
          )}
          {content.phone && (
            <a
              {...pa('phone')}
              href={`tel:${content.phone}`}
              className="text-teal-600 hover:text-teal-700 font-medium block transition-colors"
            >
              {content.phone}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default Contact;
