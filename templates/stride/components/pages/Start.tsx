import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { OptimizelyComposition } from '@optimizely/cms-sdk/react/server';
import FullWidthLayout from '../layout/FullWidthLayout';

export const StartPage = contentType({
  key: 'StartPage',
  baseType: '_experience',
  displayName: 'Start Page',
  description: 'Represents the start page of the website.',
  mayContainTypes: ['*'],
});

type StartPageProps = {
  content: ContentProps<typeof StartPage>;
};

export default function Start({ content }: StartPageProps) {
  return (
    <FullWidthLayout>
      <OptimizelyComposition nodes={content.composition.nodes ?? []} />
    </FullWidthLayout>
  );
}
