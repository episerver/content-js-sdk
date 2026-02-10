import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

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
      required: true,
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
  opti: ContentProps<typeof ButtonContentType>;
};

function Button({ opti }: ButtonProps) {
  const { pa } = getPreviewUtils(opti);
  return (
    <a
      {...pa('link')}
      href={opti?.link?.default ?? undefined}
      className="inline-block bg-teal-500 hover:bg-teal-600 text-white font-medium py-3 px-8 rounded-md transition-colors duration-200 text-base"
    >
      <span {...pa('text')}>{opti.text}</span>
    </a>
  );
}

export default Button;
