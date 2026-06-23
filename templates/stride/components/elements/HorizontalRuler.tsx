import { ContentProps, contentType } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import EditableField from '../EditableField';

export const HorizontalRulerComponent = contentType({
  key: 'HorizontalRulerElement',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled'],
  displayName: 'Horizontal Ruler',
  description: 'Horizontal ruler with labels.',
  properties: {
    topLabel: {
      type: 'string',
      displayName: 'Top Label',
      isLocalized: true,
      sortOrder: 1,
    },
    sideLabel: {
      type: 'string',
      displayName: 'Side Label',
      isLocalized: true,
      sortOrder: 2,
    },
  },
});

type HorizontalRulerComponentProps = {
  content: ContentProps<typeof HorizontalRulerComponent>;
};

export default function HorizontalRuler({ content }: HorizontalRulerComponentProps) {
  const { pa } = getPreviewUtils(content);

  return (
    <div className='h-9 font-code text-xs uppercase font-bold tracking-wide border-b-4 mb-6 border-foreground'>
      <EditableField field={content.topLabel}>
        <span
          className='absolute text-background2 bg-foreground px-1'
          {...pa('topLabel')}
        >
          {content.topLabel}
        </span>
      </EditableField>
      <EditableField field={content.sideLabel}>
        <span
          className='absolute inline-block origin-top-left md:-translate-x-4 -translate-x-1 translate-y-18  text-key1 mb-4 rotate-90'
          {...pa('sideLabel')}
        >
          {content.sideLabel}
        </span>
      </EditableField>
    </div>
  );
}
