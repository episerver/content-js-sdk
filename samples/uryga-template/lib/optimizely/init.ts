import { initReactComponentRegistry } from '@episerver/cms-sdk/react/server'
import {
  BlankExperienceContentType,
  initContentTypeRegistry,
  initDisplayTemplateRegistry,
} from '@episerver/cms-sdk'
import AvailabilityBlock, {
  AvailabilityBlockContentType,
} from '@/components/optimizely/block/availability-block'
import ContactBlock, {
  ContactBlockContentType,
} from '@/components/optimizely/block/contact-block'
import ProfileBlock, {
  ProfileBlockContentType,
  ProfileBlockDisplayTemplate,
} from '@/components/optimizely/block/profile-block'
import FooterColumn, {
  FooterColumnContentType,
} from '@/components/optimizely/block/footer-column'
import HeroBlock, {
  HeroBlockContentType,
} from '@/components/optimizely/block/hero-block'
import LogoItemBlock, {
  LogoItemBlockContentType,
} from '@/components/optimizely/block/logo-item-block'
import LogosBlock, {
  LogosBlockContentType,
} from '@/components/optimizely/block/logos-block'
import NavItem, {
  NavItemContentType,
} from '@/components/optimizely/block/nav-item'
import PortfolioGridBlock, {
  PortfolioGridBlockContentType,
} from '@/components/optimizely/block/portfolio-grid-block'
import PortfolioItemBlock, {
  PortfolioItemBlockContentType,
} from '@/components/optimizely/block/portfolio-item-block'
import ServiceItem, {
  ServiceItemContentType,
} from '@/components/optimizely/block/service-item'
import ServicesBlock, {
  ServicesBlockContentType,
} from '@/components/optimizely/block/services-block'
import {
  SocialLink,
  SocialLinkContentType,
} from '@/components/optimizely/block/social-link'
import StoryBlock, {
  StoryBlockContentType,
} from '@/components/optimizely/block/story-block'
import TestimonialItemBlock, {
  TestimonialItemBlockContentType,
} from '@/components/optimizely/block/testimonial-item-block'
import TestimonialsBlock, {
  TestimonialsBlockContentType,
} from '@/components/optimizely/block/testimonials-block'

import SEOExperience, {
  SEOExperienceContentType,
} from '@/components/optimizely/experience/SEOExpiernce'
import CMSPage, {
  CMSPageContentType,
} from '@/components/optimizely/page/CMSPage'
import Footer, {
  FooterContentType,
} from '@/components/optimizely/page/FooterPage'
import Header, {
  HeaderContentType,
} from '@/components/optimizely/page/HeaderPage'
import StartPage, {
  StartPageContentType,
} from '@/components/optimizely/page/StartPage'
import BlankExperience from '@/components/optimizely/experience/BlankExperience'
import BlankSection from '@/components/optimizely/section/BlankSection'

initContentTypeRegistry([
  // Block content types
  AvailabilityBlockContentType,
  ContactBlockContentType,
  FooterColumnContentType,
  HeroBlockContentType,
  LogoItemBlockContentType,
  LogosBlockContentType,
  NavItemContentType,
  PortfolioGridBlockContentType,
  PortfolioItemBlockContentType,
  ProfileBlockContentType,
  ServiceItemContentType,
  ServicesBlockContentType,
  SocialLinkContentType,
  StoryBlockContentType,
  TestimonialItemBlockContentType,
  TestimonialsBlockContentType,

  //  Experience content types
  BlankExperienceContentType,
  SEOExperienceContentType,

  // Page content types
  CMSPageContentType,
  FooterContentType,
  HeaderContentType,
  StartPageContentType,
])

initReactComponentRegistry({
  resolver: {
    CMSPage,
    Footer,
    Header,
    StartPage,

    AvailabilityBlock,
    ContactBlock,
    FooterColumn,
    HeroBlock,
    LogoItemBlock,
    LogosBlock,
    NavItem,
    PortfolioGridBlock,
    PortfolioItemBlock,
    ProfileBlock,
    ServiceItem,
    ServicesBlock,
    SocialLink,
    StoryBlock,
    TestimonialItemBlock,
    TestimonialsBlock,

    BlankExperience,
    SEOExperience,

    BlankSection,
  },
})

initDisplayTemplateRegistry([ProfileBlockDisplayTemplate])
