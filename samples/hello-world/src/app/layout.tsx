import Article, { ArticleContentType } from '@/components/Article';
import { initContentTypeRegistry } from '@episerver/cms-sdk';
import { initReactComponentRegistry } from '@episerver/cms-sdk/react/server';

initContentTypeRegistry([ArticleContentType]);
initReactComponentRegistry({
  resolver: {
    Article,
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
