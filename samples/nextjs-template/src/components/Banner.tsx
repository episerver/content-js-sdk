import { contentType, Infer } from '@optimizely/cms-sdk';
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
  opti: Infer<typeof BannerContentType>;
};

export default function Banner({ opti }: Props) {
  const { pa } = getPreviewUtils(opti);
  return (
    <div className="banner">
      <div className="banner-content">
        <h1 className="banner-title" {...pa('title')}>
          {opti.title}
        </h1>
        <p className="banner-subtitle" {...pa('subtitle')}>
          {opti.subtitle}
        </p>
        {opti.submit && (
          <a
            {...pa('submit')}
            href={opti.submit.url.default ?? ''}
            className="banner-btn"
          >
            Submit
          </a>
        )}
      </div>
    </div>
  );
}
