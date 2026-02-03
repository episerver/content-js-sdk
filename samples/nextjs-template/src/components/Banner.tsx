import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const BannerContentType = contentType({
  key: 'Banner',
  displayName: 'Banner',
  baseType: '_component',
  properties: {
    title: {
      type: 'string',
    },
    subtitle: {
      type: 'string',
    },
    submit: {
      type: 'link',
    },
  },
  compositionBehaviors: ['sectionEnabled'],
});

type Props = {
  content: ContentProps<typeof BannerContentType>;
};

export default function Banner({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <div className="banner">
      <div className="banner-content">
        <h1 className="banner-title" {...pa('title')}>
          {content.title}
        </h1>
        <p className="banner-subtitle" {...pa('subtitle')}>
          {content.subtitle}
        </p>
        {content.submit && (
          <a
            {...pa('submit')}
            href={content.submit.url.default ?? ''}
            className="banner-btn"
          >
            Submit
          </a>
        )}
      </div>
    </div>
  );
}
