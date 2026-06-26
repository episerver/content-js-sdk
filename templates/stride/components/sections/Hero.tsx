import { ContentProps, contentType } from '@optimizely/cms-sdk';
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
import { CmsField } from '../shared/CmsField';

export const HeroSection = contentType({
  key: 'HeroSection',
  baseType: '_section',
  displayName: 'Hero Section',
  description: 'Hero section with support for video background',
  properties: {
    video: {
      type: 'contentReference',
      allowedTypes: ['_video'],
      displayName: 'Video',
      sortOrder: 1,
    },
  },
});

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
        'relative z-10  container px-5 mx-auto md:flex gap-12 items-center py-20',
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
  {
    /* 
    TODO: Hack to flow buttons. Preferrably we should be able to add the attributes directly
    to the component ala 'asChild' so this element is not needed.
    */
  }
  if (node.type === 'ButtonElement') {
    return (
      <span className='pe-2' {...pa(node)}>
        {children}
      </span>
    );
  } else {
    return <div {...pa(node)}>{children}</div>;
  }
}

export default function Hero({ content, displaySettings }: HeroSectionProps) {
  const { pa } = getPreviewUtils(content);

  const width = widthStyles[displaySettings?.width ?? 'default'];

  const fadeOut =
    displaySettings?.fadeOut ?
      ' -mb-20 [mask-image:linear-gradient(#000_60%,transparent_70%)]'
    : null;

  return (
    <section className={cn('p-1 pt-0', width, fadeOut)} {...pa(content)}>
      <div className='bg-cover bg-center relative bg-no-repeat rounded-lg overflow-x-clip box-border'>
        <CmsField content={content} field={c => c.video}>
          <video
            src={content.video?.url.default ?? ''}
            autoPlay
            loop
            muted
            className='md:opacity-90 opacity-50 absolute inset-0 w-full h-full object-cover rounded-lg'
          />
        </CmsField>

        {/* TODO: Remove this video when we've fixed the issue with missing section fragments. */}
        <video
          src={
            content.video?.url.default ??
            'https://cdn.midjourney.com/video/12166248-0ad6-4ab9-a545-022e30eef2ee/3.mp4'
          }
          autoPlay
          loop
          muted
          className='md:opacity-90 opacity-50 absolute inset-0 w-full h-full object-cover rounded-lg'
        />

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
