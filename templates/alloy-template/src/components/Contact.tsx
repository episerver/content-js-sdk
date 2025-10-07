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
    heading: {
      type: 'string',
      displayName: 'Heading',
    },
    contact: {
      type: 'content',
      displayName: 'Contact',
    },
    link: {
      type: 'url',
      displayName: 'Link',
    },
    link_text: {
      type: 'string',
      displayName: 'Link Text',
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
