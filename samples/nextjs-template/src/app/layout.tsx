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
import SmallFeatureGrid, {
  SmallFeatureGridContentType,
} from '@/components/SmallFeatureGrid';
import SmallFeature, {
  SmallFeatureContentType,
} from '@/components/SmallFeature';
import VideoFeature, {
  VideoFeatureContentType,
} from '@/components/VideoFeature';
import { HeroContentType } from '@/components/Hero';
import Article, { ArticleContentType } from '@/components/Article';
import LandingExperience, {
  LandingExperienceContentType,
} from '@/components/LandingExperience';
import CallToAction, {
  CallToActionContentType,
} from '@/components/CallToAction';

initContentTypeRegistry([
  LandingSectionContentType,
  LadningContentType,
  SmallFeatureGridContentType,
  SmallFeatureContentType,
  VideoFeatureContentType,
  HeroContentType,
  ArticleContentType,
  LandingExperienceContentType,
  CallToActionContentType,
]);
initReactComponentRegistry({
  resolver: {
    Landing,
    LandingSection,
    VideoFeature,
    SmallFeatureGrid,
    SmallFeature,
    Article,
    LandingExperience,
    CallToAction,
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
