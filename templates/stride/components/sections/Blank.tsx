import { BlankSectionContentType, ContentProps } from '@optimizely/cms-sdk';
import {
  OptimizelyGridSection,
  getPreviewUtils,
  StructureContainerProps,
} from '@optimizely/cms-sdk/react/server';
import { cn } from '../../lib/utils';
import {
  ColumnWrapper,
  getDisplayStyle,
  SectionDisplayTemplate,
} from './DisplayTemplates';

type BlankSectionProps = {
  content: ContentProps<typeof BlankSectionContentType>;
  displaySettings?: ContentProps<typeof SectionDisplayTemplate>;
};

const verticalSpacingStyles = {
  default: '',
  medium: 'md:py-20 py-6',
  negative: ' md:-mb-50',
};

const widthStyles = {
  default: 'container',
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
      className={cn('flex flex-col md:flex-row md:gap-6 gap-2', verticalSpacing)}
      {...pa(node)}
    >
      {children}
    </div>
  );
}

export default function BlankSection({ content, displaySettings }: BlankSectionProps) {
  const { pa } = getPreviewUtils(content);

  const width = widthStyles[displaySettings?.width ?? 'default'];

  const fadeOut =
    displaySettings?.fadeOut ?
      ' -mb-20 [mask-image:linear-gradient(#000_60%,transparent_70%)]'
    : null;

  return (
    <section className={cn('pt-20', width, fadeOut)} {...pa(content)}>
      <OptimizelyGridSection
        nodes={content.nodes}
        row={RowWrapper}
        column={ColumnWrapper}
      />
    </section>
  );
}
