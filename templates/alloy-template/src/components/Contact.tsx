import React from 'react';
import { contentType, Infer } from '@episerver/cms-sdk';

export const ContactContentType = contentType({
  key: 'Contact',
  displayName: 'Contact',
  baseType: '_component',
  properties: {
    teaser_image: {
      type: 'contentReference',
      allowedTypes: ['_image'],
      displayName: 'Teaser Image',
    },
    teaser_text: {
      type: 'string',
      displayName: 'Teaser Text',
    },
    unique_selling_points: {
      type: 'string',
      displayName: 'Unique Selling Points',
    },
    main_body: {
      type: 'richText',
      displayName: 'Main Body',
    },
    large_content_area: {
      type: 'array',
      displayName: 'Large Content Area',
      items: {
        type: 'contentReference',
      },
    },
    small_content_area: {
      type: 'array',
      displayName: 'Small Content Area',
      items: {
        type: 'contentReference',
      },
    },
    title: {
      type: 'string',
    },
    keywords: {
      type: 'string',
    },
    page_description: {
      type: 'string',
    },
  },
});

export type ContactProps = {
  opti: Infer<typeof ContactContentType>;
};

function Contact(props: ContactProps) {
  return <div>Contact</div>;
}

export default Contact;
