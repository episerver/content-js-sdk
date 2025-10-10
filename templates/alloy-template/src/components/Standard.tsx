import { contentType, Infer } from '@optimizely/cms-sdk';
import { RichText } from '@optimizely/cms-sdk/react/richText';
import {
  ComponentContainerProps,
  getPreviewUtils,
  OptimizelyExperience,
} from '@optimizely/cms-sdk/react/server';

export const StandardContentType = contentType({
  key: 'Standard',
  displayName: 'Standard Page',
  baseType: '_experience',
  mayContainTypes: ['_self'],
  properties: {
    teaser_image: {
      type: 'contentReference',
      allowedTypes: ['_image'],
      displayName: 'Teaser Image',
    },
    teaser_text: {
      type: 'string',
      displayName: 'Teaser Text',
    },
    main_body: {
      type: 'richText',
      displayName: 'Main Body',
    },
    title: {
      type: 'string',
    },
    keywords: {
      type: 'string',
    },
    page_description: {
      type: 'string',
    },
  },
});

type StandardPageProps = {
  opti: Infer<typeof StandardContentType>;
};

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);
  return <div {...pa(node)}>{children}</div>;
}

function StandardPage({ opti }: StandardPageProps) {
  return (
    <div>
      <h2>{opti.title}</h2>
      <p>{opti.teaser_text}</p>
      <div>
        {opti.teaser_image?.url.default && (
          <img src={opti.teaser_image.url.default} alt={'Teaser Image'} />
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

export default StandardPage;
