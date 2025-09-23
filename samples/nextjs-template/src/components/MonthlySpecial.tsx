import { contentType, Infer } from '@optimizely/cms-sdk';
import { BlogCardContentType } from './BlogCard';
import {
  getPreviewUtils,
  OptimizelyComponent,
} from '@optimizely/cms-sdk/react/server';

export const MonthlySpecialContentType = contentType({
  key: 'MonthlySpecial',
  displayName: 'Monthly Special',
  baseType: '_component',
  properties: {
    title: {
      type: 'string',
    },
    subtitle: {
      type: 'string',
    },
    blog: {
      type: 'content',
      allowedTypes: [BlogCardContentType],
    },
  },
  compositionBehaviors: ['sectionEnabled'],
});

type Props = {
  opti: Infer<typeof MonthlySpecialContentType>;
};

export default function MonthlySpecial({ opti }: Props) {
  const { pa } = getPreviewUtils(opti);
  return (
    <div className="monthly-special">
      <div className="monthly-special__content">
        <h1 className="monthly-special__title" {...pa('title')}>
          {opti.title}
        </h1>
        <p className="monthly-special__subtitle" {...pa('subtitle')}>
          {opti.subtitle}
        </p>
      </div>
      <div className="monthly-special__blog" {...pa('blog')}>
        {opti.blog && <OptimizelyComponent opti={opti.blog} />}
      </div>
    </div>
  );
}
