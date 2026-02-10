import {
  contentType,
  displayTemplate,
  ContentProps,
} from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import { cn } from '../../util/merge';

export const NoticeContentType = contentType({
  key: 'Notice',
  displayName: 'Notice',
  baseType: '_component',
  properties: {
    title: {
      type: 'string',
      displayName: 'Notice Title',
    },
    points: {
      type: 'array',
      items: {
        type: 'string',
      },
      displayName: 'Points',
    },
  },
  compositionBehaviors: ['elementEnabled'],
});

// Display Template for Notice component color
export const NoticeDisplayTemplate = displayTemplate({
  key: 'NoticeDisplayTemplate',
  isDefault: false,
  displayName: 'NoticeDisplayTemplate',
  baseType: '_component',
  settings: {
    color: {
      editor: 'select',
      displayName: 'Notice Background Color',
      sortOrder: 0,
      choices: {
        green: {
          displayName: 'Green',
          sortOrder: 1,
        },
        orange: {
          displayName: 'Orange',
          sortOrder: 2,
        },
      },
    },
  },
});

type NoticeProps = {
  content: ContentProps<typeof NoticeContentType>;
  displaySettings?: Record<string, string>;
};

function Notice({ content, displaySettings }: NoticeProps) {
  const { pa } = getPreviewUtils(content);
  const bgColor =
    displaySettings?.color === 'green' ? 'bg-[#1cb898]' : 'bg-[#ff944f]';
  return (
    <div className={cn('rounded-lg bg-teal-500 p-6 text-white', bgColor)}>
      <h3 className="mb-4 text-xl font-bold" {...pa('title')}>
        {content.title}
      </h3>
      <ul className="space-y-2" {...pa('points')}>
        {content.points?.map((item, itemIndex) => (
          <li key={itemIndex} className="text-sm leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Notice;
