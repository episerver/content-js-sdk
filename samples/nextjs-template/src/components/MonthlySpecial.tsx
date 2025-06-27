import { contentType, Infer } from '@episerver/cms-sdk';
import { BlogCardContentType } from './BlogCard';
import {
  OptimizelyComponent,
  OptimizelyExperience,
} from '@episerver/cms-sdk/react/server';

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
  return (
    <div className="monthly-special">
      <div className="monthly-special__content">
        <h1 className="monthly-special__title">{opti.title}</h1>
        <p className="monthly-special__subtitle">{opti.subtitle}</p>
      </div>
      <div className="monthly-special__blog">
        {opti.blog && <OptimizelyComponent opti={opti.blog} />}
      </div>
    </div>
  );
}
