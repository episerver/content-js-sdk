import {
  config,
  initContentTypeRegistry,
  initDisplayTemplateRegistry,
} from '@optimizely/cms-sdk';
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';
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

export function initialize() {
  config({
    apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  });

  initContentTypeRegistry([
    ProductPage,
    StandardPage,
    StartPage,
    EyebrowComponent,
    HeroSection,
    ImageCardComponent,
    ButtonComponent,
    HeadingComponent,
    HorizontalRulerComponent,
    ImageComponent,
    RichTextComponent,
    VideoComponent,
  ]);

  initReactComponentRegistry({
    resolver: {
      ProductPage: Product,
      StandardPage: Standard,
      StartPage: Start,
      BlankSection,
      HeroSection: Hero,
      ImageCardElement: ImageCard,
      ButtonElement: Button,
      HeadingElement: Heading,
      HorizontalRulerElement: HorizontalRuler,
      ImageElement: Image,
      RichTextElement: RichText,
      VideoElement: Video,
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
