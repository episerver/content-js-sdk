import Article, { ArticleContentType } from '@/components/Article';
import { initContentTypeRegistry } from '@optimizely/cms-sdk';
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
