import { ContentProps, contentType } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import EditableField from '../EditableField';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  CheckCheck,
  Flag,
  Globe,
  Sparkles,
  Wallet,
} from 'lucide-react';

export const ImageCardComponent = contentType({
  key: 'ImageCardElement',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  displayName: 'Image Card',
  description: 'Card with support for image and call to action',
  properties: {
    image: {
      type: 'contentReference',
      allowedTypes: ['_image'],
      displayName: 'Image',
      sortOrder: 1,
    },
    eyebrow: {
      type: 'string',
      displayName: 'Eyebrow',
      isLocalized: true,
      sortOrder: 2,
    },
    title: {
      type: 'string',
      displayName: 'Title',
      isLocalized: true,
      sortOrder: 3,
    },
    icon: {
      type: 'string',
      format: 'selectOne',
      displayName: 'Icon',
      sortOrder: 4,
      enum: [
        { value: 'default', displayName: 'No icon' },
        { value: 'check', displayName: 'Check' },
        { value: 'checkCheck', displayName: 'Double Check' },
        { value: 'globe', displayName: 'Globe' },
        { value: 'flag', displayName: 'Flag' },
        { value: 'sparkles', displayName: 'Sparkles' },
        { value: 'wallet', displayName: 'Wallet' },
      ],
    },
    link: {
      type: 'url',
      displayName: 'Link',
      isrequired: true,
      isLocalized: true,
      sortOrder: 5,
    },
  },
});

type ImageCardComponentProps = {
  content: ContentProps<typeof ImageCardComponent>;
};

const iconMap: Record<string, React.ElementType | null> = {
  default: null,
  check: Check,
  checkCheck: CheckCheck,
  globe: Globe,
  flag: Flag,
  sparkles: Sparkles,
  wallet: Wallet,
};

export default function ImageCard({ content }: ImageCardComponentProps) {
  const { pa } = getPreviewUtils(content);
  const IconComponent = content.icon ? iconMap[content.icon] : null;

  return (
    <Link
      href={content.link?.default ?? '#'}
      className='grow basis-0 group z-20 relative flex justify-between flex-col transition-all card hover:border-foreground/10!'
    >
      <EditableField field={content.image}>
        <div className='relative aspect-664/635 w-full -mb-40 rounded-3xl overflow-hidden -mt-12 mask-[linear-gradient(#000_50%,transparent_80%)]'>
          <img
            src={content.image?.url.default ?? ''}
            alt=''
            className='object-cover scale-115 object-top mt-24 group-hover:-translate-y-6 group-hover:scale-120 transition-transform'
            {...pa('image')}
          />
        </div>
      </EditableField>

      <EditableField field={[content.eyebrow, content.title]}>
        <div className='p-8 flex flex-col justify-end min-h-55 z-30'>
          <EditableField field={content.eyebrow}>
            <div className='flex gap-2 items-center'>
              {IconComponent && <IconComponent size={16} />}
              <p
                className='text-xs uppercase font-semibold tracking-wider text-foreground letter-spacing-wider font-code '
                {...pa('eyebrow')}
              >
                {content.eyebrow}
              </p>
            </div>
          </EditableField>
          <EditableField field={content.title}>
            <div className='flex flex-col mt-0'>
              <h3
                className='text-2xl md:text-2xl font-bold tracking-tight text-foreground mb-0'
                {...pa('title')}
              >
                {content.title}
              </h3>
              <span className='text-foreground/50 group-hover:text-foreground absolute right-6 bottom-6 transition-all border border-foreground/5 group-hover:bg-background p-3 rounded-full'>
                <ArrowRight size={16} />
              </span>
            </div>
          </EditableField>
        </div>
      </EditableField>
    </Link>
  );
}
