import { beforeAll, describe, expect, test } from 'vitest';
import { createFragment, createSingleContentQuery } from '../createQuery.js';
import { initContentTypeRegistry } from '../../model/index.js';
import {
  callToAction,
  heroBlock,
  landingPage,
  aboutPage,
  articlePage,
  allContentTypes,
  superHeroBlock,
  fAQPage,
  contactUsPage,
  mediaPage,
  blogPage,
  specialPage,
  mediaBlock,
  FeedBackPage,
  ContentPage,
  LocationPage,
  ReviewPage,
  HomePage,
  Paragraph,
  Card,
  SelfPage,
} from './fixtures.js';

beforeAll(() => {
  initContentTypeRegistry(allContentTypes);
});

describe('createFragment()', () => {
  test('works for simple properties', async () => {
    const result = await createFragment(callToAction.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment CallToAction on CallToAction { __typename label link }",
      ]
    `);
  });

  test('works for components inside components', async () => {
    const result = await createFragment(heroBlock.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment CallToAction on CallToAction { __typename label link }",
        "fragment myButton on myButton { __typename label link }",
        "fragment Hero on Hero { __typename heading callToAction { ...CallToAction ...myButton } }",
      ]
    `);
  });

  test('works for components inside components (several levels) : landingPage', async () => {
    const result = await createFragment(landingPage.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment CallToAction on CallToAction { __typename label link }",
        "fragment myButton on myButton { __typename label link }",
        "fragment Hero on Hero { __typename heading callToAction { ...CallToAction ...myButton } }",
        "fragment SuperHero on SuperHero { __typename heading embed_video callToAction { ...CallToAction } }",
        "fragment SpecialHero on SpecialHero { __typename heading primaryCallToAction { ...CallToAction } callToAction { ...CallToAction } }",
        "fragment LandingPage on LandingPage { __typename hero { ...Hero ...SuperHero ...SpecialHero } body { html, json } }",
      ]
    `);
  });

  test('works when the same reference is repeated', async () => {
    const result = await createFragment(superHeroBlock.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment CallToAction on CallToAction { __typename label link }",
        "fragment SuperHero on SuperHero { __typename heading embed_video callToAction { ...CallToAction } }",
      ]
    `);
  });

  test('When contentType has both allowedTypes and restrictedTypes', async () => {
    const result = await createFragment(aboutPage.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment CallToAction on CallToAction { __typename label link }",
        "fragment myButton on myButton { __typename label link }",
        "fragment Hero on Hero { __typename heading callToAction { ...CallToAction ...myButton } }",
        "fragment AboutPage on AboutPage { __typename hero { ...Hero } body { html, json } }",
      ]
    `);
  });

  test('When the contentType has only allowedTypes defined', async () => {
    const result = await createFragment(fAQPage.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment myButton on myButton { __typename label link }",
        "fragment CallToAction on CallToAction { __typename label link }",
        "fragment Hero on Hero { __typename heading callToAction { ...CallToAction ...myButton } }",
        "fragment SuperHero on SuperHero { __typename heading embed_video callToAction { ...CallToAction } }",
        "fragment fAQPage on fAQPage { __typename hero { ...myButton ...Hero ...SuperHero } body { html, json } }",
      ]
    `);
  });

  test('When the contentType has only restrictedTypes (no allowedTypes) defined', async () => {
    const result = await createFragment(contactUsPage.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment CallToAction on CallToAction { __typename label link }",
        "fragment SpecialHero on SpecialHero { __typename heading primaryCallToAction { ...CallToAction } callToAction { ...CallToAction } }",
        "fragment myButton on myButton { __typename label link }",
        "fragment Hero on Hero { __typename heading callToAction { ...CallToAction ...myButton } }",
        "fragment SuperHero on SuperHero { __typename heading embed_video callToAction { ...CallToAction } }",
        "fragment LandingPage on LandingPage { __typename hero { ...Hero ...SuperHero ...SpecialHero } body { html, json } }",
        "fragment ArticlePage on ArticlePage { __typename body { html, json } relatedArticle { url { type, default }} source { type, default } tags }",
        "fragment AboutPage on AboutPage { __typename hero { ...Hero } body { html, json } }",
        "fragment AboutContent on AboutContent { __typename heading embed_video callToAction { ...CallToAction ...myButton } }",
        "fragment fAQPage on fAQPage { __typename hero { ...myButton ...Hero ...SuperHero } body { html, json } }",
        "fragment mediaMetaData on IContentMetadata { displayName url { default } ... on MediaMetadata { mimeType thumbnail content } }",
        "fragment customImage on customImage { __typename name alt _metadata { ...mediaMetaData } }",
        "fragment _image on _Image { __typename _metadata { ...mediaMetaData } }",
        "fragment customMedia on customMedia { __typename name fileType _metadata { ...mediaMetaData } }",
        "fragment _media on _Media { __typename _metadata { ...mediaMetaData } }",
        "fragment customVideo on customVideo { __typename name date _metadata { ...mediaMetaData } }",
        "fragment _video on _Video { __typename _metadata { ...mediaMetaData } }",
        "fragment mediaPage on mediaPage { __typename media { ...customImage ..._image ...customMedia ..._media ...customVideo ..._video } }",
        "fragment blogPage on blogPage { __typename blog { ...ArticlePage ...customImage ..._image } }",
        "fragment mediaBlock on mediaBlock { __typename media { ...mediaPage } }",
        "fragment NewHero on NewHero { __typename heading summary background { url { type default }} theme }",
        "fragment NewHeroProperty on NewHeroProperty { __typename heading summary background { url { type default }} theme }",
        "fragment FeedBackPage on FeedBackPage { __typename p_contentArea { ...NewHero } p_block { ...NewHeroProperty } }",
        "fragment Paragraph on Paragraph { __typename title }",
        "fragment LocationPage on LocationPage { __typename location_area { ...CallToAction ...SpecialHero ...Hero ...SuperHero ...myButton ...AboutContent ...mediaBlock ...NewHero ...Paragraph } }",
        "fragment SelfPage on SelfPage { __typename p_contentArea { ...SelfPage } }",
        "fragment HomePage on HomePage { __typename p_contentArea { ...LandingPage ...ArticlePage ...AboutPage ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...specialPage ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage ...SelfPage ...CallToAction ...SpecialHero ...Hero ...SuperHero ...myButton ...AboutContent ...mediaBlock ...NewHero ...Paragraph ...customVideo ..._video ...customImage ..._image ...customMedia ..._media } }",
        "fragment ReviewPage on ReviewPage { __typename location_area { ...LandingPage ...ArticlePage ...AboutPage ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customImage ..._image ...customMedia ..._media ...customVideo ..._video ...specialPage ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage ...SelfPage } }",
        "fragment ContentPage on ContentPage { __typename p_contentArea { ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...myButton ...AboutPage ...AboutContent ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customImage ..._image ...customMedia ..._media ...customVideo ..._video ...specialPage ...mediaBlock ...NewHero ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage ...Paragraph ...SelfPage } }",
        "fragment specialPage on specialPage { __typename media { ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...myButton ...AboutPage ...AboutContent ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customMedia ..._media ...customVideo ..._video ...specialPage ...mediaBlock ...NewHero ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage ...Paragraph ...SelfPage } }",
        "fragment contactUsPage on contactUsPage { __typename others { ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...AboutPage ...AboutContent ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customImage ..._image ...customMedia ..._media ...customVideo ..._video ...specialPage ...mediaBlock ...NewHero ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage ...Paragraph ...SelfPage } body { html, json } }",
      ]
    `);
  });

  test('When the contentType has allowedTypes defined with special type', async () => {
    const result = await createFragment(blogPage.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment ArticlePage on ArticlePage { __typename body { html, json } relatedArticle { url { type, default }} source { type, default } tags }",
        "fragment mediaMetaData on IContentMetadata { displayName url { default } ... on MediaMetadata { mimeType thumbnail content } }",
        "fragment customImage on customImage { __typename name alt _metadata { ...mediaMetaData } }",
        "fragment _image on _Image { __typename _metadata { ...mediaMetaData } }",
        "fragment blogPage on blogPage { __typename blog { ...ArticlePage ...customImage ..._image } }",
      ]
    `);
  });

  test('When the contentType has special allowedTypes defined (_image, _media, _video)', async () => {
    const result = await createFragment(mediaPage.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment mediaMetaData on IContentMetadata { displayName url { default } ... on MediaMetadata { mimeType thumbnail content } }",
        "fragment customImage on customImage { __typename name alt _metadata { ...mediaMetaData } }",
        "fragment _image on _Image { __typename _metadata { ...mediaMetaData } }",
        "fragment customMedia on customMedia { __typename name fileType _metadata { ...mediaMetaData } }",
        "fragment _media on _Media { __typename _metadata { ...mediaMetaData } }",
        "fragment customVideo on customVideo { __typename name date _metadata { ...mediaMetaData } }",
        "fragment _video on _Video { __typename _metadata { ...mediaMetaData } }",
        "fragment mediaPage on mediaPage { __typename media { ...customImage ..._image ...customMedia ..._media ...customVideo ..._video } }",
      ]
    `);
  });

  test('When the contentType has only restrictedTypes (no allowedTypes) defined and its a BaseType (_image, _media, _video)', async () => {
    const result = await createFragment(specialPage.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment CallToAction on CallToAction { __typename label link }",
        "fragment SpecialHero on SpecialHero { __typename heading primaryCallToAction { ...CallToAction } callToAction { ...CallToAction } }",
        "fragment myButton on myButton { __typename label link }",
        "fragment Hero on Hero { __typename heading callToAction { ...CallToAction ...myButton } }",
        "fragment SuperHero on SuperHero { __typename heading embed_video callToAction { ...CallToAction } }",
        "fragment LandingPage on LandingPage { __typename hero { ...Hero ...SuperHero ...SpecialHero } body { html, json } }",
        "fragment ArticlePage on ArticlePage { __typename body { html, json } relatedArticle { url { type, default }} source { type, default } tags }",
        "fragment AboutPage on AboutPage { __typename hero { ...Hero } body { html, json } }",
        "fragment AboutContent on AboutContent { __typename heading embed_video callToAction { ...CallToAction ...myButton } }",
        "fragment fAQPage on fAQPage { __typename hero { ...myButton ...Hero ...SuperHero } body { html, json } }",
        "fragment mediaMetaData on IContentMetadata { displayName url { default } ... on MediaMetadata { mimeType thumbnail content } }",
        "fragment customImage on customImage { __typename name alt _metadata { ...mediaMetaData } }",
        "fragment _image on _Image { __typename _metadata { ...mediaMetaData } }",
        "fragment customMedia on customMedia { __typename name fileType _metadata { ...mediaMetaData } }",
        "fragment _media on _Media { __typename _metadata { ...mediaMetaData } }",
        "fragment customVideo on customVideo { __typename name date _metadata { ...mediaMetaData } }",
        "fragment _video on _Video { __typename _metadata { ...mediaMetaData } }",
        "fragment mediaPage on mediaPage { __typename media { ...customImage ..._image ...customMedia ..._media ...customVideo ..._video } }",
        "fragment blogPage on blogPage { __typename blog { ...ArticlePage ...customImage ..._image } }",
        "fragment mediaBlock on mediaBlock { __typename media { ...mediaPage } }",
        "fragment NewHero on NewHero { __typename heading summary background { url { type default }} theme }",
        "fragment NewHeroProperty on NewHeroProperty { __typename heading summary background { url { type default }} theme }",
        "fragment FeedBackPage on FeedBackPage { __typename p_contentArea { ...NewHero } p_block { ...NewHeroProperty } }",
        "fragment Paragraph on Paragraph { __typename title }",
        "fragment LocationPage on LocationPage { __typename location_area { ...CallToAction ...SpecialHero ...Hero ...SuperHero ...myButton ...AboutContent ...mediaBlock ...NewHero ...Paragraph } }",
        "fragment SelfPage on SelfPage { __typename p_contentArea { ...SelfPage } }",
        "fragment HomePage on HomePage { __typename p_contentArea { ...LandingPage ...ArticlePage ...AboutPage ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...specialPage ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage ...SelfPage ...CallToAction ...SpecialHero ...Hero ...SuperHero ...myButton ...AboutContent ...mediaBlock ...NewHero ...Paragraph ...customVideo ..._video ...customImage ..._image ...customMedia ..._media } }",
        "fragment ReviewPage on ReviewPage { __typename location_area { ...LandingPage ...ArticlePage ...AboutPage ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customImage ..._image ...customMedia ..._media ...customVideo ..._video ...specialPage ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage ...SelfPage } }",
        "fragment ContentPage on ContentPage { __typename p_contentArea { ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...myButton ...AboutPage ...AboutContent ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customImage ..._image ...customMedia ..._media ...customVideo ..._video ...specialPage ...mediaBlock ...NewHero ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage ...Paragraph ...SelfPage } }",
        "fragment contactUsPage on contactUsPage { __typename others { ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...AboutPage ...AboutContent ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customImage ..._image ...customMedia ..._media ...customVideo ..._video ...specialPage ...mediaBlock ...NewHero ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage ...Paragraph ...SelfPage } body { html, json } }",
        "fragment specialPage on specialPage { __typename media { ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...myButton ...AboutPage ...AboutContent ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customMedia ..._media ...customVideo ..._video ...specialPage ...mediaBlock ...NewHero ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage ...Paragraph ...SelfPage } }",
      ]
    `);
  });

  test('When the contentType has allowedTypes and has baseType as restricted (_image, _media, _video)', async () => {
    const result = await createFragment(mediaBlock.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment mediaMetaData on IContentMetadata { displayName url { default } ... on MediaMetadata { mimeType thumbnail content } }",
        "fragment customImage on customImage { __typename name alt _metadata { ...mediaMetaData } }",
        "fragment _image on _Image { __typename _metadata { ...mediaMetaData } }",
        "fragment customMedia on customMedia { __typename name fileType _metadata { ...mediaMetaData } }",
        "fragment _media on _Media { __typename _metadata { ...mediaMetaData } }",
        "fragment customVideo on customVideo { __typename name date _metadata { ...mediaMetaData } }",
        "fragment _video on _Video { __typename _metadata { ...mediaMetaData } }",
        "fragment mediaPage on mediaPage { __typename media { ...customImage ..._image ...customMedia ..._media ...customVideo ..._video } }",
        "fragment mediaBlock on mediaBlock { __typename media { ...mediaPage } }",
      ]
    `);
  });

  test('When the contentType has both contentArea and Block with the same contentType', async () => {
    const result = await createFragment(FeedBackPage.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment NewHero on NewHero { __typename heading summary background { url { type default }} theme }",
        "fragment NewHeroProperty on NewHeroProperty { __typename heading summary background { url { type default }} theme }",
        "fragment FeedBackPage on FeedBackPage { __typename p_contentArea { ...NewHero } p_block { ...NewHeroProperty } }",
      ]
    `);
  });

  test('When no allowedType is defined and a content type is included in its own content area', async () => {
    const result = await createFragment(ContentPage.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment CallToAction on CallToAction { __typename label link }",
        "fragment SpecialHero on SpecialHero { __typename heading primaryCallToAction { ...CallToAction } callToAction { ...CallToAction } }",
        "fragment myButton on myButton { __typename label link }",
        "fragment Hero on Hero { __typename heading callToAction { ...CallToAction ...myButton } }",
        "fragment SuperHero on SuperHero { __typename heading embed_video callToAction { ...CallToAction } }",
        "fragment LandingPage on LandingPage { __typename hero { ...Hero ...SuperHero ...SpecialHero } body { html, json } }",
        "fragment ArticlePage on ArticlePage { __typename body { html, json } relatedArticle { url { type, default }} source { type, default } tags }",
        "fragment AboutPage on AboutPage { __typename hero { ...Hero } body { html, json } }",
        "fragment AboutContent on AboutContent { __typename heading embed_video callToAction { ...CallToAction ...myButton } }",
        "fragment fAQPage on fAQPage { __typename hero { ...myButton ...Hero ...SuperHero } body { html, json } }",
        "fragment mediaMetaData on IContentMetadata { displayName url { default } ... on MediaMetadata { mimeType thumbnail content } }",
        "fragment customImage on customImage { __typename name alt _metadata { ...mediaMetaData } }",
        "fragment _image on _Image { __typename _metadata { ...mediaMetaData } }",
        "fragment customMedia on customMedia { __typename name fileType _metadata { ...mediaMetaData } }",
        "fragment _media on _Media { __typename _metadata { ...mediaMetaData } }",
        "fragment customVideo on customVideo { __typename name date _metadata { ...mediaMetaData } }",
        "fragment _video on _Video { __typename _metadata { ...mediaMetaData } }",
        "fragment mediaPage on mediaPage { __typename media { ...customImage ..._image ...customMedia ..._media ...customVideo ..._video } }",
        "fragment blogPage on blogPage { __typename blog { ...ArticlePage ...customImage ..._image } }",
        "fragment mediaBlock on mediaBlock { __typename media { ...mediaPage } }",
        "fragment NewHero on NewHero { __typename heading summary background { url { type default }} theme }",
        "fragment NewHeroProperty on NewHeroProperty { __typename heading summary background { url { type default }} theme }",
        "fragment FeedBackPage on FeedBackPage { __typename p_contentArea { ...NewHero } p_block { ...NewHeroProperty } }",
        "fragment Paragraph on Paragraph { __typename title }",
        "fragment LocationPage on LocationPage { __typename location_area { ...CallToAction ...SpecialHero ...Hero ...SuperHero ...myButton ...AboutContent ...mediaBlock ...NewHero ...Paragraph } }",
        "fragment SelfPage on SelfPage { __typename p_contentArea { ...SelfPage } }",
        "fragment HomePage on HomePage { __typename p_contentArea { ...LandingPage ...ArticlePage ...AboutPage ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...specialPage ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage ...SelfPage ...CallToAction ...SpecialHero ...Hero ...SuperHero ...myButton ...AboutContent ...mediaBlock ...NewHero ...Paragraph ...customVideo ..._video ...customImage ..._image ...customMedia ..._media } }",
        "fragment ReviewPage on ReviewPage { __typename location_area { ...LandingPage ...ArticlePage ...AboutPage ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customImage ..._image ...customMedia ..._media ...customVideo ..._video ...specialPage ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage ...SelfPage } }",
        "fragment specialPage on specialPage { __typename media { ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...myButton ...AboutPage ...AboutContent ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customMedia ..._media ...customVideo ..._video ...specialPage ...mediaBlock ...NewHero ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage ...Paragraph ...SelfPage } }",
        "fragment contactUsPage on contactUsPage { __typename others { ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...AboutPage ...AboutContent ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customImage ..._image ...customMedia ..._media ...customVideo ..._video ...specialPage ...mediaBlock ...NewHero ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage ...Paragraph ...SelfPage } body { html, json } }",
        "fragment ContentPage on ContentPage { __typename p_contentArea { ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...myButton ...AboutPage ...AboutContent ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customImage ..._image ...customMedia ..._media ...customVideo ..._video ...specialPage ...mediaBlock ...NewHero ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage ...Paragraph ...SelfPage } }",
      ]
    `);
  });

  test('When the contentType has both contentArea with main allowedTpes', async () => {
    const result = await createFragment(LocationPage.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment CallToAction on CallToAction { __typename label link }",
        "fragment SpecialHero on SpecialHero { __typename heading primaryCallToAction { ...CallToAction } callToAction { ...CallToAction } }",
        "fragment myButton on myButton { __typename label link }",
        "fragment Hero on Hero { __typename heading callToAction { ...CallToAction ...myButton } }",
        "fragment SuperHero on SuperHero { __typename heading embed_video callToAction { ...CallToAction } }",
        "fragment AboutContent on AboutContent { __typename heading embed_video callToAction { ...CallToAction ...myButton } }",
        "fragment mediaMetaData on IContentMetadata { displayName url { default } ... on MediaMetadata { mimeType thumbnail content } }",
        "fragment customImage on customImage { __typename name alt _metadata { ...mediaMetaData } }",
        "fragment _image on _Image { __typename _metadata { ...mediaMetaData } }",
        "fragment customMedia on customMedia { __typename name fileType _metadata { ...mediaMetaData } }",
        "fragment _media on _Media { __typename _metadata { ...mediaMetaData } }",
        "fragment customVideo on customVideo { __typename name date _metadata { ...mediaMetaData } }",
        "fragment _video on _Video { __typename _metadata { ...mediaMetaData } }",
        "fragment mediaPage on mediaPage { __typename media { ...customImage ..._image ...customMedia ..._media ...customVideo ..._video } }",
        "fragment mediaBlock on mediaBlock { __typename media { ...mediaPage } }",
        "fragment NewHero on NewHero { __typename heading summary background { url { type default }} theme }",
        "fragment Paragraph on Paragraph { __typename title }",
        "fragment LocationPage on LocationPage { __typename location_area { ...CallToAction ...SpecialHero ...Hero ...SuperHero ...myButton ...AboutContent ...mediaBlock ...NewHero ...Paragraph } }",
      ]
    `);
  });

  test('When the contentType has both contentArea with main restrictedTypes', async () => {
    const result = await createFragment(ReviewPage.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment CallToAction on CallToAction { __typename label link }",
        "fragment myButton on myButton { __typename label link }",
        "fragment Hero on Hero { __typename heading callToAction { ...CallToAction ...myButton } }",
        "fragment SuperHero on SuperHero { __typename heading embed_video callToAction { ...CallToAction } }",
        "fragment SpecialHero on SpecialHero { __typename heading primaryCallToAction { ...CallToAction } callToAction { ...CallToAction } }",
        "fragment LandingPage on LandingPage { __typename hero { ...Hero ...SuperHero ...SpecialHero } body { html, json } }",
        "fragment ArticlePage on ArticlePage { __typename body { html, json } relatedArticle { url { type, default }} source { type, default } tags }",
        "fragment AboutPage on AboutPage { __typename hero { ...Hero } body { html, json } }",
        "fragment AboutContent on AboutContent { __typename heading embed_video callToAction { ...CallToAction ...myButton } }",
        "fragment fAQPage on fAQPage { __typename hero { ...myButton ...Hero ...SuperHero } body { html, json } }",
        "fragment mediaMetaData on IContentMetadata { displayName url { default } ... on MediaMetadata { mimeType thumbnail content } }",
        "fragment customImage on customImage { __typename name alt _metadata { ...mediaMetaData } }",
        "fragment _image on _Image { __typename _metadata { ...mediaMetaData } }",
        "fragment customMedia on customMedia { __typename name fileType _metadata { ...mediaMetaData } }",
        "fragment _media on _Media { __typename _metadata { ...mediaMetaData } }",
        "fragment customVideo on customVideo { __typename name date _metadata { ...mediaMetaData } }",
        "fragment _video on _Video { __typename _metadata { ...mediaMetaData } }",
        "fragment mediaPage on mediaPage { __typename media { ...customImage ..._image ...customMedia ..._media ...customVideo ..._video } }",
        "fragment blogPage on blogPage { __typename blog { ...ArticlePage ...customImage ..._image } }",
        "fragment mediaBlock on mediaBlock { __typename media { ...mediaPage } }",
        "fragment NewHero on NewHero { __typename heading summary background { url { type default }} theme }",
        "fragment NewHeroProperty on NewHeroProperty { __typename heading summary background { url { type default }} theme }",
        "fragment FeedBackPage on FeedBackPage { __typename p_contentArea { ...NewHero } p_block { ...NewHeroProperty } }",
        "fragment Paragraph on Paragraph { __typename title }",
        "fragment LocationPage on LocationPage { __typename location_area { ...CallToAction ...SpecialHero ...Hero ...SuperHero ...myButton ...AboutContent ...mediaBlock ...NewHero ...Paragraph } }",
        "fragment SelfPage on SelfPage { __typename p_contentArea { ...SelfPage } }",
        "fragment HomePage on HomePage { __typename p_contentArea { ...LandingPage ...ArticlePage ...AboutPage ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...specialPage ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage ...SelfPage ...CallToAction ...SpecialHero ...Hero ...SuperHero ...myButton ...AboutContent ...mediaBlock ...NewHero ...Paragraph ...customVideo ..._video ...customImage ..._image ...customMedia ..._media } }",
        "fragment ContentPage on ContentPage { __typename p_contentArea { ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...myButton ...AboutPage ...AboutContent ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customImage ..._image ...customMedia ..._media ...customVideo ..._video ...specialPage ...mediaBlock ...NewHero ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage ...Paragraph ...SelfPage } }",
        "fragment specialPage on specialPage { __typename media { ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...myButton ...AboutPage ...AboutContent ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customMedia ..._media ...customVideo ..._video ...specialPage ...mediaBlock ...NewHero ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage ...Paragraph ...SelfPage } }",
        "fragment contactUsPage on contactUsPage { __typename others { ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...AboutPage ...AboutContent ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customImage ..._image ...customMedia ..._media ...customVideo ..._video ...specialPage ...mediaBlock ...NewHero ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage ...Paragraph ...SelfPage } body { html, json } }",
        "fragment ReviewPage on ReviewPage { __typename location_area { ...LandingPage ...ArticlePage ...AboutPage ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customImage ..._image ...customMedia ..._media ...customVideo ..._video ...specialPage ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage ...SelfPage } }",
      ]
    `);
  });

  test('works for HomePage content type', async () => {
    const result = await createFragment(HomePage.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment CallToAction on CallToAction { __typename label link }",
        "fragment myButton on myButton { __typename label link }",
        "fragment Hero on Hero { __typename heading callToAction { ...CallToAction ...myButton } }",
        "fragment SuperHero on SuperHero { __typename heading embed_video callToAction { ...CallToAction } }",
        "fragment SpecialHero on SpecialHero { __typename heading primaryCallToAction { ...CallToAction } callToAction { ...CallToAction } }",
        "fragment LandingPage on LandingPage { __typename hero { ...Hero ...SuperHero ...SpecialHero } body { html, json } }",
        "fragment ArticlePage on ArticlePage { __typename body { html, json } relatedArticle { url { type, default }} source { type, default } tags }",
        "fragment AboutPage on AboutPage { __typename hero { ...Hero } body { html, json } }",
        "fragment AboutContent on AboutContent { __typename heading embed_video callToAction { ...CallToAction ...myButton } }",
        "fragment fAQPage on fAQPage { __typename hero { ...myButton ...Hero ...SuperHero } body { html, json } }",
        "fragment mediaMetaData on IContentMetadata { displayName url { default } ... on MediaMetadata { mimeType thumbnail content } }",
        "fragment customImage on customImage { __typename name alt _metadata { ...mediaMetaData } }",
        "fragment _image on _Image { __typename _metadata { ...mediaMetaData } }",
        "fragment customMedia on customMedia { __typename name fileType _metadata { ...mediaMetaData } }",
        "fragment _media on _Media { __typename _metadata { ...mediaMetaData } }",
        "fragment customVideo on customVideo { __typename name date _metadata { ...mediaMetaData } }",
        "fragment _video on _Video { __typename _metadata { ...mediaMetaData } }",
        "fragment mediaPage on mediaPage { __typename media { ...customImage ..._image ...customMedia ..._media ...customVideo ..._video } }",
        "fragment blogPage on blogPage { __typename blog { ...ArticlePage ...customImage ..._image } }",
        "fragment mediaBlock on mediaBlock { __typename media { ...mediaPage } }",
        "fragment NewHero on NewHero { __typename heading summary background { url { type default }} theme }",
        "fragment NewHeroProperty on NewHeroProperty { __typename heading summary background { url { type default }} theme }",
        "fragment FeedBackPage on FeedBackPage { __typename p_contentArea { ...NewHero } p_block { ...NewHeroProperty } }",
        "fragment Paragraph on Paragraph { __typename title }",
        "fragment LocationPage on LocationPage { __typename location_area { ...CallToAction ...SpecialHero ...Hero ...SuperHero ...myButton ...AboutContent ...mediaBlock ...NewHero ...Paragraph } }",
        "fragment SelfPage on SelfPage { __typename p_contentArea { ...SelfPage } }",
        "fragment ReviewPage on ReviewPage { __typename location_area { ...LandingPage ...ArticlePage ...AboutPage ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customImage ..._image ...customMedia ..._media ...customVideo ..._video ...specialPage ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage ...SelfPage } }",
        "fragment ContentPage on ContentPage { __typename p_contentArea { ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...myButton ...AboutPage ...AboutContent ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customImage ..._image ...customMedia ..._media ...customVideo ..._video ...specialPage ...mediaBlock ...NewHero ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage ...Paragraph ...SelfPage } }",
        "fragment specialPage on specialPage { __typename media { ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...myButton ...AboutPage ...AboutContent ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customMedia ..._media ...customVideo ..._video ...specialPage ...mediaBlock ...NewHero ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage ...Paragraph ...SelfPage } }",
        "fragment contactUsPage on contactUsPage { __typename others { ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...AboutPage ...AboutContent ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customImage ..._image ...customMedia ..._media ...customVideo ..._video ...specialPage ...mediaBlock ...NewHero ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage ...Paragraph ...SelfPage } body { html, json } }",
        "fragment HomePage on HomePage { __typename p_contentArea { ...LandingPage ...ArticlePage ...AboutPage ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...specialPage ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage ...SelfPage ...CallToAction ...SpecialHero ...Hero ...SuperHero ...myButton ...AboutContent ...mediaBlock ...NewHero ...Paragraph ...customVideo ..._video ...customImage ..._image ...customMedia ..._media } }",
      ]
    `);
  });

  test('When self reference (_self) is used', async () => {
    const result = await createFragment(SelfPage.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment SelfPage on SelfPage { __typename p_contentArea { ...SelfPage } }",
      ]
    `);
  });

  test('should handle content type with some properties having indexType:disabled', async () => {
    const result = await createFragment(Paragraph.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment Paragraph on Paragraph { __typename title }",
      ]
    `);
  });

  test('should return empty fragments for content type with only indexType:disabled properties', async () => {
    const result = await createFragment(Card.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment Card on Card { __typename }",
      ]
    `);
  });
});

describe('createQuery', () => {
  test('simple content types', async () => {
    const result = await createSingleContentQuery(callToAction.key);
    expect(result).toMatchInlineSnapshot(`
      "
      fragment CallToAction on CallToAction { __typename label link }
      query GetContent($where: _ContentWhereInput, $variation: VariationInput) {
        _Content(where: $where, variation: $variation) {
          item {
            __typename
            ...CallToAction
            _metadata {
              variation
            }
          }
        }
      }
        "
    `);
  });

  test('complex content types', async () => {
    const result = await createSingleContentQuery(articlePage.key);
    expect(result).toMatchInlineSnapshot(`
      "
      fragment ArticlePage on ArticlePage { __typename body { html, json } relatedArticle { url { type, default }} source { type, default } tags }
      query GetContent($where: _ContentWhereInput, $variation: VariationInput) {
        _Content(where: $where, variation: $variation) {
          item {
            __typename
            ...ArticlePage
            _metadata {
              variation
            }
          }
        }
      }
        "
    `);
  });

  test('nested content types (one level)', async () => {
    const result = await createSingleContentQuery(heroBlock.key);
    expect(result).toMatchInlineSnapshot(`
      "
      fragment CallToAction on CallToAction { __typename label link }
      fragment myButton on myButton { __typename label link }
      fragment Hero on Hero { __typename heading callToAction { ...CallToAction ...myButton } }
      query GetContent($where: _ContentWhereInput, $variation: VariationInput) {
        _Content(where: $where, variation: $variation) {
          item {
            __typename
            ...Hero
            _metadata {
              variation
            }
          }
        }
      }
        "
    `);
  });

  test('nested content types (several levels)', async () => {
    const result = await createSingleContentQuery(landingPage.key);
    expect(result).toMatchInlineSnapshot(`
      "
      fragment CallToAction on CallToAction { __typename label link }
      fragment myButton on myButton { __typename label link }
      fragment Hero on Hero { __typename heading callToAction { ...CallToAction ...myButton } }
      fragment SuperHero on SuperHero { __typename heading embed_video callToAction { ...CallToAction } }
      fragment SpecialHero on SpecialHero { __typename heading primaryCallToAction { ...CallToAction } callToAction { ...CallToAction } }
      fragment LandingPage on LandingPage { __typename hero { ...Hero ...SuperHero ...SpecialHero } body { html, json } }
      query GetContent($where: _ContentWhereInput, $variation: VariationInput) {
        _Content(where: $where, variation: $variation) {
          item {
            __typename
            ...LandingPage
            _metadata {
              variation
            }
          }
        }
      }
        "
    `);
  });
});
