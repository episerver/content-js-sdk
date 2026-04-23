import {
  initContentTypeRegistry,
  BlankExperienceContentType,
  initDisplayTemplateRegistry,
  GraphClient,
} from "@optimizely/cms-sdk";
import { initReactComponentRegistry } from "@optimizely/cms-sdk/react/server";
import AboutExperience, {
  AboutExperienceContentType,
} from "./components/AboutExperience";
import AboutUs, { AboutUsContentType } from "./components/AboutUs";
import Article, { ArticleContentType } from "./components/Article";
import Banner, { BannerContentType } from "./components/Banner";
import BlankExperience from "./components/BlankExperience";
import BlankSection from "./components/BlankSection";
import BlogCard, { BlogCardContentType } from "./components/BlogCard";
import BlogExperience, {
  BlogExperienceContentType,
} from "./components/BlogExperience";
import CallToAction, {
  CallToActionContentType,
} from "./components/CallToAction";
import FAQ, { FAQContentType } from "./components/FAQ";
import { HeroContentType } from "./components/Hero";
import Landing, { LandingPageContentType } from "./components/Landing";
import LandingExperience, {
  LandingExperienceContentType,
} from "./components/LandingExperience";
import LandingSection, {
  LandingSectionContentType,
  LandingSectionDisplayTemplate,
} from "./components/LandingSection";
import Location, { LocationContentType } from "./components/Location";
import MonthlySpecial, {
  MonthlySpecialContentType,
} from "./components/MonthlySpecial";
import OfficeLocations, {
  OfficeContentType,
} from "./components/OfficeLocations";
import SmallFeature, {
  SmallFeatureContentType,
} from "./components/SmallFeature";
import SmallFeatureGrid, {
  SmallFeatureGridContentType,
} from "./components/SmallFeatureGrid";
import Tile, {
  TileContentType,
  SquareTile,
  TileRowDisplayTemplate,
  TileColumnDisplayTemplate,
  SquareDisplayTemplate,
} from "./components/Tile";
import VideoFeature, {
  VideoFeatureContentType,
} from "./components/VideoFeature";

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

const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!, {
  graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
});

export default client;