import { Bodoni_Moda, Inter } from 'next/font/google';
import { initContentTypeRegistry } from 'optimizely-cms-sdk';
import './globals.css';

import { ContentType as Article } from '@/components/Article';
import { ContentType as Hero } from '@/components/Hero';
import { ContentType as Landing } from '@/components/Landing';
import { ContentType as LandingSection } from '@/components/LandingSection';
import { ContentType as SmallFeature } from '@/components/SmallFeature';
import { ContentType as SmallFeatureGrid } from '@/components/SmallFeatureGrid';

// Initialize the content type registry for the entire app
initContentTypeRegistry([
  Article,
  Hero,
  Landing,
  LandingSection,
  SmallFeature,
  SmallFeatureGrid,
]);

const serifFont = Bodoni_Moda({
  variable: '--font-serif',
  subsets: ['latin'],
});

const sansFont = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={[serifFont.variable, sansFont.variable].join(' ')}
    >
      <body>{children}</body>
    </html>
  );
}
