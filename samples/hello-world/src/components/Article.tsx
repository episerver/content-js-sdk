import { contentType, Infer } from '@optimizely/cms-sdk';

// An "Article" content type
export const ArticleContentType = contentType({
  key: 'HelloWorld_Article',
  displayName: '(Hello World) Article',
  baseType: '_page',
  properties: {
    heading: {
      type: 'string',
    },
    body: {
      type: 'richText',
    },
  },
});

type Props = {
  content: Infer<typeof ArticleContentType>;
};

/** Component that renders an "Article" */
export default function Article({ content }: Props) {
  return (
    <main>
      <h1>{content.heading}</h1>
      <div dangerouslySetInnerHTML={{ __html: content.body?.html ?? '' }} />
    </main>
  );
}
