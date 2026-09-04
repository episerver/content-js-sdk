import {
  config,
  initContentTypeRegistry,
  initDisplayTemplateRegistry,
  getClient,
  BlankExperienceContentType,
} from '@optimizely/cms-sdk';
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';

import Landing from '../components/react/Landing';
import LandingSection from '../components/react/LandingSection';
import SmallFeatureGrid from '../components/react/SmallFeatureGrid';
import SmallFeature from '../components/react/SmallFeature';
import VideoFeature from '../components/react/VideoFeature';
import Article from '../components/react/Article';
import LandingExperience from '../components/react/LandingExperience';
import CallToAction from '../components/react/CallToAction';
import BlankSection from '../components/react/BlankSection';
import BlogExperience from '../components/react/BlogExperience';
import BlogCard from '../components/react/BlogCard';
import Banner from '../components/react/Banner';
import Tile, { SquareTile } from '../components/react/Tile';
import AboutExperience from '../components/react/AboutExperience';
import AboutUs from '../components/react/AboutUs';
import MonthlySpecial from '../components/react/MonthlySpecial';
import OfficeLocations from '../components/react/OfficeLocations';
import Location from '../components/react/Location';
import BlankExperience from '../components/react/BlankExperience';
import FAQ from '../components/react/FAQ';

import {
  HeroContentType,
  LandingPageContentType,
  LandingSectionContentType,
  LandingSectionDisplayTemplate,
  SmallFeatureGridContentType,
  SmallFeatureContentType,
  VideoFeatureContentType,
  ArticleContentType,
  LandingExperienceContentType,
  CallToActionContentType,
  BlogExperienceContentType,
  BlogCardContentType,
  BannerContentType,
  TileContentType,
  TileRowDisplayTemplate,
  TileColumnDisplayTemplate,
  SquareDisplayTemplate,
  AboutExperienceContentType,
  AboutUsContentType,
  MonthlySpecialContentType,
  OfficeContentType,
  LocationContentType,
  FAQContentType,
} from './contentTypes';

let initialized = false;

export function initOptimizely() {
  if (initialized) return;

  config({
    apiKey: import.meta.env.OPTIMIZELY_GRAPH_SINGLE_KEY || 'your api key here',
    graphUrl: import.meta.env.OPTIMIZELY_GRAPH_GATEWAY,
  });

  initContentTypeRegistry([
    BlankExperienceContentType,
    LandingSectionContentType,
    LandingPageContentType,
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
    FAQContentType,
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
      Tile: {
        default: Tile,
        tags: {
          Square: SquareTile,
        },
      },
      AboutExperience,
      AboutUs,
      MonthlySpecial,
      OfficeLocations,
      Location,
      BlankExperience,
      FAQ,
    },
  });

  initDisplayTemplateRegistry([
    TileRowDisplayTemplate,
    TileColumnDisplayTemplate,
    LandingSectionDisplayTemplate,
    SquareDisplayTemplate,
  ]);

  initialized = true;
}

export { getClient };
