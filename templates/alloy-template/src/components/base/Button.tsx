import { contentType, Infer } from '@optimizely/cms-sdk';

export const ButtonContentType = contentType({
  key: 'Button',
  displayName: 'Button',
  baseType: '_component',
  description:
    'The Button content type represents a button component on the website.',
  properties: {
    link: {
      type: 'url',
      displayName: 'Button Link',
      group: 'Information',
    },
    text: {
      type: 'string',
      displayName: 'Button Text',
      group: 'Information',
    },
  },
  compositionBehaviors: ['elementEnabled'],
});

type ButtonProps = {
  opti: Infer<typeof ButtonContentType>;
};

function Button({ opti }: ButtonProps) {
  return (
    <a
      href={opti?.link?.default ?? undefined}
      className="inline-block bg-teal-500 hover:bg-teal-600 text-white font-medium py-3 px-8 rounded-md transition-colors duration-200 text-base"
    >
      {opti.text}
    </a>
  );
}

export default Button;
