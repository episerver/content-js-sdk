import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { CmsField } from '../shared/CmsField';
import { Check, CheckCheck, Flag, Globe, Sparkles, Wallet } from 'lucide-react';

export const EyebrowComponent = contentType({
  key: 'EyebrowComponent',
  baseType: '_component',
  displayName: 'Eyebrow',
  description: 'Eyebrow with text and icon.',
  properties: {
    eyebrow: {
      type: 'string',
      displayName: 'Eyebrow',
      isLocalized: true,
      sortOrder: 1,
    },
    icon: {
      type: 'string',
      format: 'selectOne',
      displayName: 'Icon',
      sortOrder: 2,
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
  },
});

type EyebrowComponentProps = {
  content: ContentProps<typeof EyebrowComponent>;
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

export default function Eyebrow({ content }: EyebrowComponentProps) {
  const IconComponent = content.icon ? iconMap[content.icon] : null;

  return (
    <CmsField content={content} field={c => c.eyebrow}>
      <div className='flex gap-2 items-center'>
        {IconComponent && <IconComponent size={16} />}
        <p className='text-xs uppercase font-semibold tracking-wider text-foreground letter-spacing-wider font-code '>
          {content.eyebrow}
        </p>
      </div>
    </CmsField>
  );
}
