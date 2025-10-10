import { contentType, Infer } from '@optimizely/cms-sdk';
import { RichText } from '@optimizely/cms-sdk/react/richText';
import {
  ComponentContainerProps,
  getPreviewUtils,
  OptimizelyExperience,
} from '@optimizely/cms-sdk/react/server';
import { StandardContentType } from './Standard';

export const NewsContentType = contentType({
  key: 'News',
  displayName: 'News Page',
  baseType: '_experience',
  mayContainTypes: [StandardContentType],
  properties: {
    image: {
      type: 'contentReference',
      displayName: 'Teaser Image',
    },
    title: {
      type: 'string',
      displayName: 'Teaser Text',
    },
    description: {
      type: 'string',
      displayName: 'Description',
    },
    main_body: {
      type: 'richText',
      displayName: 'Main Body',
    },
  },
});

type NewsPageProps = {
  opti: Infer<typeof NewsContentType>;
};

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);
  return <div {...pa(node)}>{children}</div>;
}

function News({ opti }: NewsPageProps) {
  return (
    <div>
      <h2>{opti.title}</h2>
      <p>{opti.description}</p>
      <div>
        {opti.image?.url.default && (
          <img src={opti.image.url.default} alt={'Teaser Image'} />
        )}
      </div>
      <RichText content={opti.main_body?.json} />
      <OptimizelyExperience
        nodes={opti.composition.nodes ?? []}
        ComponentWrapper={ComponentWrapper}
      />
    </div>
  );
}

export default News;
