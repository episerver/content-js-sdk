import { contentType, Infer } from '@episerver/cms-sdk';

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
  return (
    <div className="banner">
      <div className="banner-content">
        <h1 className="banner-title">{opti.title}</h1>
        <p className="banner-subtitle">{opti.subtitle}</p>
        {opti.submit && (
          <a href={opti.submit.url.default ?? ''} className="banner-btn">
            Submit
          </a>
        )}
      </div>
    </div>
  );
}
