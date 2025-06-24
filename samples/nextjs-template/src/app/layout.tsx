import React from 'react';

import { Bodoni_Moda, Inter } from 'next/font/google';
import './globals.css';
import { initContentTypeRegistry } from '@episerver/cms-sdk';
import { initReactComponentRegistry } from '@episerver/cms-sdk/react/server';

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
import BlankSection from '@/components/BlankSection';

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
    BlankSection,
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
