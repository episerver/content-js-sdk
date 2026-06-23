import { ContentProps, contentType, displayTemplate } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import { Check, CheckCheck, Globe, Flag, Sparkles, Wallet } from 'lucide-react';
import EditableField from '../EditableField';

export const HeadingComponent = contentType({
  key: 'HeadingElement',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  displayName: 'Heading',
  description: 'Heading element with an optional icon.',
  properties: {
    heading: {
      type: 'string',
      displayName: 'Heading',
      isLocalized: true,
      sortOrder: 1,
    },
  },
});

export const HeadingDisplayTemplate = displayTemplate({
  key: 'HeadingStyles',
  isDefault: true,
  displayName: 'Heading styles',
  contentType: 'HeadingElement',
  settings: {
    level: {
      editor: 'select',
      displayName: 'Level',
      sortOrder: 1,
      choices: {
        default: { displayName: 'Default', sortOrder: 1 },
        h2: { displayName: 'H2', sortOrder: 2 },
        h3: { displayName: 'H3', sortOrder: 3 },
        h4: { displayName: 'H4', sortOrder: 4 },
        h5: { displayName: 'H5', sortOrder: 5 },
      },
    },
    icon: {
      editor: 'select',
      displayName: 'Icon',
      sortOrder: 2,
      choices: {
        default: { displayName: 'No icon', sortOrder: 1 },
        check: { displayName: 'Check', sortOrder: 2 },
        checkCheck: { displayName: 'Double Check', sortOrder: 3 },
        globe: { displayName: 'Globe', sortOrder: 4 },
        flag: { displayName: 'Flag', sortOrder: 5 },
        sparkles: { displayName: 'Sparkles', sortOrder: 6 },
        wallet: { displayName: 'Wallet', sortOrder: 7 },
      },
    },
  },
});

type HeadingComponentProps = {
  content: ContentProps<typeof HeadingComponent>;
  displaySettings?: ContentProps<typeof HeadingDisplayTemplate>;
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

const iconSizeMap: Record<string, number> = {
  h2: 48,
  h3: 32,
  h4: 24,
  h5: 18,
};

const levelMap: Record<string, string> = {
  default: 'h2',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
};

const stylesMap: Record<string, string> = {
  h2: 'text-4xl md:text-6xl font-bold mb-4 tracking-tight',
  h3: 'text-2xl md:text-2xl font-bold mb-4 tracking-tight',
  h4: 'text-xl md:text-lg font-semibold mb-4 tracking-tight',
  h5: 'text-md md:text-sm font-semibold mb-4 tracking-tight',
};

export default function Heading({ content, displaySettings }: HeadingComponentProps) {
  const { pa } = getPreviewUtils(content);
  const level = displaySettings?.level ? levelMap[displaySettings.level] : 'h2';
  const HeadingTag = level as React.ElementType;
  const IconComponent = displaySettings?.icon ? iconMap[displaySettings.icon] : null;

  return (
    <EditableField field={content.heading}>
      {IconComponent ?
        <div className='flex gap-2'>
          <IconComponent size={iconSizeMap[level]} />
          <HeadingTag className={stylesMap[level]} {...pa('heading')}>
            {content.heading}
          </HeadingTag>
        </div>
      : <HeadingTag className={stylesMap[level]} {...pa('heading')}>
          {content.heading}
        </HeadingTag>
      }
    </EditableField>
  );
}
