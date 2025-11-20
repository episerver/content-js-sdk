import React from 'react';
import { contentType, Infer } from '@optimizely/cms-sdk';

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
  opti: Infer<typeof ContactContentType>;
};

function Contact({ opti }: ContactProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
      {opti.image?.url.default && (
        <div className="mb-4">
          <img
            src={opti.image?.url.default}
            alt={`${opti.name}'s Image`}
            className="w-full h-64 object-cover rounded-lg"
          />
        </div>
      )}
      <div className="space-y-3">
        <h3 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
          {opti.name}
        </h3>
        <p className="text-gray-700 text-base leading-relaxed">
          {opti.description}
        </p>
        <div className="space-y-2 pt-2">
          {opti.email && (
            <a
              href={`mailto:${opti.email}`}
              className="text-teal-600 hover:text-teal-700 font-medium block transition-colors"
            >
              {opti.email}
            </a>
          )}
          {opti.phone && (
            <a
              href={`tel:${opti.phone}`}
              className="text-teal-600 hover:text-teal-700 font-medium block transition-colors"
            >
              {opti.phone}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default Contact;
