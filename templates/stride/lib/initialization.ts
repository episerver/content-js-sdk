import {
  config,
  initContentTypeRegistry,
  initDisplayTemplateRegistry,
} from '@optimizely/cms-sdk';
import {
  configureAdapter,
  initReactComponentRegistry,
  ReactContextAdapter,
} from '@optimizely/cms-sdk/react/server';
import Start, { StartPage } from '../components/pages/Start';
import BlankSection from '../components/sections/Blank';
import ImageCard, { ImageCardComponent } from '../components/elements/ImageCard';
import Heading, {
  HeadingComponent,
  HeadingDisplayTemplate,
} from '../components/elements/Heading';
import HorizontalRuler, {
  HorizontalRulerComponent,
} from '../components/elements/HorizontalRuler';
import RichText, { RichTextComponent } from '../components/elements/RichText';
import Image, { ImageComponent } from '../components/elements/Image';
import Video, { VideoComponent } from '../components/elements/Video';
import Hero, { HeroSection } from '../components/sections/Hero';
import {
  ColumnCardDisplayTemplate,
  ColumnDisplayTemplate,
  RowDisplayTemplate,
  SectionDisplayTemplate,
} from '../components/sections/DisplayTemplates';
import Button, {
  ButtonComponent,
  ButtonDisplayTemplate,
} from '../components/elements/Button';
import Product, { ProductPage } from '../components/pages/Product';
import { EyebrowComponent } from '../components/blocks/Eyebrow';
import Standard, { StandardPage } from '../components/pages/Standard';
import News, { NewsPage } from '../components/pages/News';
import TeaserCard, {
  TeaserCardComponent,
} from '../components/elements/TeaserCardComponent';
import NewsEventsList, {
  NewsEventsListContentType,
} from '../components/blocks/NewsEventsList';
import EventCard, { EventCardComponent } from '../components/elements/EventCard';
import EventCardsList, {
  EventCardsListContentType,
} from '../components/blocks/EventCardsList';

export function initialize() {
  configureAdapter(new ReactContextAdapter());

  config({
    apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  });

  initContentTypeRegistry([
    ProductPage,
    StandardPage,
    StartPage,
    NewsPage,
    EyebrowComponent,
    HeroSection,
    ImageCardComponent,
    ButtonComponent,
    HeadingComponent,
    HorizontalRulerComponent,
    TeaserCardComponent,
    NewsEventsListContentType,
    ImageComponent,
    RichTextComponent,
    VideoComponent,
    EventCardComponent,
    EventCardsListContentType,
  ]);

  initReactComponentRegistry({
    resolver: {
      ProductPage: Product,
      StandardPage: Standard,
      StartPage: Start,
      NewsPage2: News,
      NewsEvents: NewsEventsList,
      TeaserCardComponent: TeaserCard,
      BlankSection,
      HeroSection: Hero,
      ImageCardElement: ImageCard,
      ButtonElement: Button,
      HeadingElement: Heading,
      HorizontalRulerElement: HorizontalRuler,
      ImageElement: Image,
      RichTextElement: RichText,
      VideoElement: Video,
      EventCardComponent: EventCard,
      EventCardsList,
    },
  });

  initDisplayTemplateRegistry([
    SectionDisplayTemplate,
    RowDisplayTemplate,
    ColumnDisplayTemplate,
    ColumnCardDisplayTemplate,
    ButtonDisplayTemplate,
    HeadingDisplayTemplate,
  ]);
}
