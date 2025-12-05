import { contentType, displayTemplate, Infer } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const ArticleContentType = contentType({
  key: 'Article',
  displayName: 'Article page',
  baseType: '_page',
  properties: {
    heading: {
      displayName: 'The Headline 😊',
      type: 'string',
    },
    subtitle: {
      type: 'string',
      displayName: 'SUBTITLE!!!!!!',
    },
    body: {
      displayName: 'body 🐈',
      type: 'richText',
    },
  },
});

export const TeaserDisplayTemplate = displayTemplate({
  key: 'TeaserDisplayTemplate',
  displayName: 'TeaserDisplayTemplate',
  isDefault: false,
  baseType: '_component',
  settings: {
    orientation: {
      editor: 'select',
      displayName: 'Teaser Orientation',
      sortOrder: 0,
      choices: {
        vertical: { displayName: 'Vertical', sortOrder: 1 },
        horizontal: { displayName: 'Horizontal', sortOrder: 2 },
      },
    },
  },
});

type Props = {
  opti: Infer<typeof ArticleContentType>;
  displaySettings?: Infer<typeof TeaserDisplayTemplate>;
};

export default function Article({ opti, displaySettings }: Props) {
  const { pa } = getPreviewUtils(opti);

  return (
    <main>
      <h1 {...pa('heading')}>{opti.heading}</h1>
      <p {...pa('subtitle')}>{opti.subtitle}</p>
      <p>{displaySettings?.orientation}</p>
      <div
        {...pa('body')}
        dangerouslySetInnerHTML={{ __html: opti.body?.html ?? '' }}
      />
    </main>
  );
}

