import { displayTemplate } from '@optimizely/cms-sdk';
import {
  getPreviewUtils,
  StructureContainerProps,
} from '@optimizely/cms-sdk/react/server';
import { cn } from '../../lib/utils';

export const SectionDisplayTemplate = displayTemplate({
  key: 'SectionStyles',
  isDefault: true,
  displayName: 'Section styles',
  baseType: '_section',
  settings: {
    width: {
      editor: 'select',
      displayName: 'Width',
      sortOrder: 1,
      choices: {
        default: { displayName: 'Default', sortOrder: 1 },
        full: { displayName: 'Full', sortOrder: 2 },
        fullBleed: { displayName: 'Full bleed', sortOrder: 3 },
      },
    },
    fadeOut: {
      editor: 'checkbox',
      displayName: 'Fade out',
      sortOrder: 2,
      choices: {
        true: { displayName: 'Enabled', sortOrder: 1 },
        false: { displayName: 'Disabled', sortOrder: 2 },
      },
    },
  },
});

export const RowDisplayTemplate = displayTemplate({
  key: 'RowStyles',
  isDefault: true,
  displayName: 'Row styles',
  nodeType: 'row',
  settings: {
    verticalSpacing: {
      editor: 'select',
      sortOrder: 1,
      displayName: 'Vertical spacing',
      choices: {
        default: { displayName: 'Default', sortOrder: 1 },
        medium: { displayName: 'Medium', sortOrder: 2 },
        negative: { displayName: 'Negative', sortOrder: 3 },
      },
    },
  },
});

export const ColumnDisplayTemplate = displayTemplate({
  key: 'ColumnStyles',
  isDefault: true,
  displayName: 'Column styles',
  nodeType: 'column',
  settings: {
    fadeOut: {
      editor: 'checkbox',
      displayName: 'Fade out',
      sortOrder: 1,
      choices: {
        true: { displayName: 'Enabled', sortOrder: 1 },
        false: { displayName: 'Disabled', sortOrder: 2 },
      },
    },
  },
});

export const ColumnCardDisplayTemplate = displayTemplate({
  key: 'ColumnCard',
  isDefault: false,
  displayName: 'Card',
  nodeType: 'column',
  settings: {},
});

export function getDisplayStyle(
  displaySettings: { key: string; value: string }[] | null | undefined,
  settingKey: string,
  stylesMap: Record<string, string | null>,
): string {
  const setting = displaySettings?.find(s => s.key === settingKey);
  return setting ? (stylesMap[setting.value] ?? '') : '';
}

const fadeOutStyles = {
  true: 'mt-[10%] -mb-24 md:mb-0 md:-mt-[10%] [mask-image:linear-gradient(#000_40%,transparent_75%)]',
  false: null,
};

export function ColumnWrapper({ children, node }: StructureContainerProps) {
  const { pa } = getPreviewUtils(node);

  const fadeOut = getDisplayStyle(node.displaySettings, 'fadeOut', fadeOutStyles);

  const cardStyle =
    node.displayTemplateKey === 'ColumnCard' ?
      'card p-6 rounded-2xl border border-foreground/5'
    : null;

  return (
    <div className={cn('basis-0 grow', fadeOut, cardStyle)} {...pa(node)}>
      {children}
    </div>
  );
}
