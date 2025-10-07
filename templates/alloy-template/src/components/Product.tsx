import { contentType, Infer } from '@optimizely/cms-sdk';
import { RichText } from '@optimizely/cms-sdk/react/richText';
import {
  ComponentContainerProps,
  getPreviewUtils,
  OptimizelyExperience,
} from '@optimizely/cms-sdk/react/server';
import { JumbotronContentType } from './Jumbotron';
import Notice from './base/Notice';

export const ProductContentType = contentType({
  key: 'Product',
  displayName: 'Product Page',
  baseType: '_experience',
  properties: {
    teaser_image: {
      type: 'contentReference',
      displayName: 'Teaser Image',
    },
    teaser_text: {
      type: 'string',
      displayName: 'Teaser Text',
    },
    unique_selling_points: {
      type: 'array',
      items: {
        type: 'string',
      },
      displayName: 'Unique Selling Points',
    },
    main_body: {
      type: 'richText',
      displayName: 'Main Body',
    },
    large_content_area: {
      type: 'array',
      displayName: 'Large Content Area',
      items: {
        type: 'content',
      },
    },
    small_content_area: {
      type: 'array',
      displayName: 'Small Content Area',
      items: {
        type: 'content',
        restrictedTypes: [JumbotronContentType],
      },
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

type ProductProps = {
  opti: Infer<typeof ProductContentType>;
};

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);
  return <div {...pa(node)}>{children}</div>;
}

function Product({ opti }: ProductProps) {
  return (
    <div>
      <h2>{opti.title}</h2>
      <p>{opti.page_description}</p>
      {opti.teaser_image?.url.default && (
        <img src={opti.teaser_image?.url.default} alt="" />
      )}
      <RichText content={opti.main_body?.json} />
      {opti.unique_selling_points && (
        <Notice title="Unique Selling Points">
          <ul>
            {opti.unique_selling_points.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </Notice>
      )}
      <OptimizelyExperience
        nodes={opti.composition.nodes ?? []}
        ComponentWrapper={ComponentWrapper}
      />
    </div>
  );
}

export default Product;
