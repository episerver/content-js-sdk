import React from 'react';

import { Bodoni_Moda, Inter } from 'next/font/google';
import './globals.css';
import {
  BlankExperienceContentType,
  initContentTypeRegistry,
  initDisplayTemplateRegistry,
} from '@episerver/cms-sdk';
import { initReactComponentRegistry } from '@episerver/cms-sdk/react/server';

import Landing, {
  ContentType as LadningContentType,
} from '@/components/Landing';
import LandingSection, {
  LandingSectionContentType,
  LandingSectionDisplayTemplate,
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
import BlogExperience, {
  BlogExperienceContentType,
} from '@/components/BlogExperience';
import BlogCard, { BlogCardContentType } from '@/components/BlogCard';
import Banner, { BannerContentType } from '@/components/Banner';
import Tile, { TileContentType } from '@/components/Tile';
import AboutExperience, {
  AboutExperienceContentType,
} from '@/components/AboutExperience';
import AboutUs, { AboutUsContentType } from '@/components/AboutUs';
import MonthlySpecial, {
  MonthlySpecialContentType,
} from '@/components/MonthlySpecial';
import OfficeLocations, {
  OfficeContentType,
} from '@/components/OfficeLocations';
import Location, { LocationContentType } from '@/components/Location';
import BlankExperience from '@/components/BlankExperience';

initContentTypeRegistry([
  BlankExperienceContentType,
  LandingSectionContentType,
  LadningContentType,
  SmallFeatureGridContentType,
  SmallFeatureContentType,
  VideoFeatureContentType,
  HeroContentType,
  ArticleContentType,
  LandingExperienceContentType,
  CallToActionContentType,
  BlogExperienceContentType,
  BlogCardContentType,
  BannerContentType,
  TileContentType,
  AboutExperienceContentType,
  AboutUsContentType,
  MonthlySpecialContentType,
  OfficeContentType,
  LocationContentType,
  BlankExperienceContentType,
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
    BlogCard,
    BlogExperience,
    Banner,
    Tile,
    AboutExperience,
    AboutUs,
    MonthlySpecial,
    OfficeLocations,
    Location,
    BlankExperience,
  },
});

initDisplayTemplateRegistry([LandingSectionDisplayTemplate]);

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
