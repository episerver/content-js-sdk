// @generated – do not edit

import { BlankExperienceContentType, initContentTypeRegistry, initDisplayTemplateRegistry } from '@optimizely/cms-sdk';
import type { ComponentType } from 'react';
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';
import { AboutExperienceContentType } from './components/AboutExperience';
import { AboutUsContentType } from './components/AboutUs';
import { ArticleContentType } from './components/Article';
import { BannerContentType } from './components/Banner';
import { BlogCardContentType } from './components/BlogCard';
import { BlogExperienceContentType } from './components/BlogExperience';
import { CallToActionContentType } from './components/CallToAction';
import { FAQContentType } from './components/FAQ';
import { HeroContentType } from './components/Hero';
import { LandingPageContentType } from './components/Landing';
import { LandingExperienceContentType } from './components/LandingExperience';
import { LandingSectionContentType, LandingSectionDisplayTemplate } from './components/LandingSection';
import { LocationContentType } from './components/Location';
import { MonthlySpecialContentType } from './components/MonthlySpecial';
import { OfficeContentType } from './components/OfficeLocations';
import { SmallFeatureContentType } from './components/SmallFeature';
import { SmallFeatureGridContentType } from './components/SmallFeatureGrid';
import { TileContentType, TileRowDisplayTemplate, TileColumnDisplayTemplate, SquareDisplayTemplate } from './components/Tile';
import { VideoFeatureContentType } from './components/VideoFeature';
import AboutExperienceComponent from './components/AboutExperience';
import AboutUsComponent from './components/AboutUs';
import ArticleComponent from './components/Article';
import BannerComponent from './components/Banner';
import BlogCardComponent from './components/BlogCard';
import BlogExperienceComponent from './components/BlogExperience';
import CallToActionComponent from './components/CallToAction';
import FAQComponent from './components/FAQ';
import LandingPageComponent from './components/Landing';
import LandingExperienceComponent from './components/LandingExperience';
import LandingSectionComponent from './components/LandingSection';
import LocationComponent from './components/Location';
import MonthlySpecialComponent from './components/MonthlySpecial';
import OfficeComponent from './components/OfficeLocations';
import SmallFeatureComponent from './components/SmallFeature';
import SmallFeatureGridComponent from './components/SmallFeatureGrid';
import TileComponent, { tags as TileComponentTags } from './components/Tile';
import VideoFeatureComponent from './components/VideoFeature';

// Content types to register
export const contentTypes = [
  BlankExperienceContentType,
  AboutExperienceContentType,
  AboutUsContentType,
  ArticleContentType,
  BannerContentType,
  BlogCardContentType,
  BlogExperienceContentType,
  CallToActionContentType,
  FAQContentType,
  HeroContentType,
  LandingPageContentType,
  LandingExperienceContentType,
  LandingSectionContentType,
  LocationContentType,
  MonthlySpecialContentType,
  OfficeContentType,
  SmallFeatureContentType,
  SmallFeatureGridContentType,
  TileContentType,
  VideoFeatureContentType,
]

// Display templates to register
export const displayTemplates = [
  LandingSectionDisplayTemplate,
  TileRowDisplayTemplate,
  TileColumnDisplayTemplate,
  SquareDisplayTemplate,
];

// React components by content type key
export const components = {
  'AboutExperience': AboutExperienceComponent,
  'AboutUs': AboutUsComponent,
  'Article': ArticleComponent,
  'Banner': BannerComponent,
  'BlogCard': BlogCardComponent,
  'BlogExperience': BlogExperienceComponent,
  'CallToAction': CallToActionComponent,
  'FAQ': FAQComponent,
  'Landing': LandingPageComponent,
  'LandingExperience': LandingExperienceComponent,
  'LandingSection': LandingSectionComponent,
  'Location': LocationComponent,
  'MonthlySpecial': MonthlySpecialComponent,
  'OfficeLocations': OfficeComponent,
  'SmallFeature': SmallFeatureComponent,
  'SmallFeatureGrid': SmallFeatureGridComponent,
  'Tile': { default: TileComponent, tags: TileComponentTags },
  'VideoFeature': VideoFeatureComponent,
};

// Initialize registries. `extraComponents` adds or overrides components, such as ones without a content type.
export function initRegistry(
  extraComponents: Record<string, ComponentType<any> | { default: ComponentType<any>; tags?: Record<string, ComponentType<any>> }> = {},
) {
  initContentTypeRegistry(contentTypes);
  initDisplayTemplateRegistry(displayTemplates);
  initReactComponentRegistry({ resolver: { ...components, ...extraComponents } });
}
