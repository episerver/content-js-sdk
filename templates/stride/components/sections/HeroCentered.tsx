import { ContentProps } from '@optimizely/cms-sdk';
import {
  OptimizelyGridSection,
  getPreviewUtils,
  StructureContainerProps,
  ComponentContainerProps,
} from '@optimizely/cms-sdk/react/server';
import { cn } from '../../lib/utils';
import {
  ColumnWrapper,
  getDisplayStyle,
  SectionDisplayTemplate,
} from './DisplayTemplates';
import { HeroSection } from './Hero';

type HeroSectionProps = {
  content: ContentProps<typeof HeroSection>;
  displaySettings?: ContentProps<typeof SectionDisplayTemplate>;
};

const verticalSpacingStyles = {
  default: '',
  medium: 'md:py-20 py-6',
  negative: ' md:-mb-50',
};

const widthStyles = {
  default: '',
  full: 'container',
  fullBleed: '',
};

function RowWrapper({ children, node }: StructureContainerProps) {
  const { pa } = getPreviewUtils(node);

  const verticalSpacing = getDisplayStyle(
    node.displaySettings,
    'verticalSpacing',
    verticalSpacingStyles,
  );

  return (
    <div
      className={cn(
        'h-[90vh] max-h-[900px] relative z-10 container px-5 mx-auto flex flex-col items-center justify-center text-center py-20',
        verticalSpacing,
      )}
      {...pa(node)}
    >
      {children}
    </div>
  );
}

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);

  if (node.type === 'ButtonElement') {
    return (
      <span className='pe-2' {...pa(node)}>
        {children}
      </span>
    );
  }

  if (node.type === 'ImageElement') {
    return (
      <div className='flex items-center mt-8' {...pa(node)}>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}

export default function HeroCentered({ content, displaySettings }: HeroSectionProps) {
  const { pa } = getPreviewUtils(content);
  const width = widthStyles[displaySettings?.width ?? 'default'];
  const fadeOut =
    displaySettings?.fadeOut ?
      ' -mb-20 [mask-image:linear-gradient(#000_75%,transparent_100%)]'
    : null;

  return (
    <section className={cn('p-1 pt-0', width, fadeOut)} {...pa(content)}>
      <div className='bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-lg overflow-x-clip'>
        <OptimizelyGridSection
          nodes={content.nodes}
          row={RowWrapper}
          column={ColumnWrapper}
          ComponentWrapper={ComponentWrapper}
        />
      </div>
    </section>
  );
}
