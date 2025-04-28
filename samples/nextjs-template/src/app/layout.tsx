import React from 'react';

import { Bodoni_Moda, Inter } from 'next/font/google';
import './globals.css';
import { initContentTypeRegistry } from 'optimizely-cms-sdk';
import { initReactComponentRegistry } from 'optimizely-cms-sdk/dist/render/react';

import Landing, {
  ContentType as LadningContentType,
} from '@/components/Landing';
import LandingSection, {
  LandingSectionContentType,
} from '@/components/LandingSection';

initContentTypeRegistry([LandingSectionContentType, LadningContentType]);
initReactComponentRegistry({
  resolver: {
    Landing,
    LandingSection,
  },
});

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
