import Article, { ArticleContentType } from '@/components/Article';
import { config, initContentTypeRegistry } from '@optimizely/cms-sdk';
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY || "your api key here",
  graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
});

initContentTypeRegistry([ArticleContentType]);
initReactComponentRegistry({
  resolver: {
    HelloWorld_Article: Article,
  },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body>{children}</body>
    </html>
  );
}
