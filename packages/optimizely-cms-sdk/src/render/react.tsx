'use server';
import { getContentType } from '../model/contentTypeRegistry';

type Props = {
  opti: {
    __typename: string;
  };
};

export async function OptimizelyComponent({ opti, ...props }: Props) {
  const contentType = opti.__typename;
  const Component = getContentType(contentType)?.component;

  if (!Component) {
    return <div>No component found for content type {contentType}</div>;
  }

  return <Component opti={opti} {...props} />;
}
