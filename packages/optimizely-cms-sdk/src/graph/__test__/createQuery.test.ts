import { beforeAll, describe, expect, test } from 'vitest';
import { createFragment, getContentQuery } from '../createQuery.js';
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
} from './fixtures.js';

beforeAll(() => {
  initContentTypeRegistry(allContentTypes);
});

describe('createFragment()', () => {
  test('works for simple properties', async () => {
    const result = await createFragment(callToAction.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment CallToAction on CallToAction { label link }",
      ]
    `);
  });

  test('works for components inside components', async () => {
    const result = await createFragment(heroBlock.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment CallToAction on CallToAction { label link }",
        "fragment myButton on myButton { label link }",
        "fragment Hero on Hero { heading callToAction { __typename ...CallToAction ...myButton } }",
      ]
    `);
  });

  test('works for components inside components (several levels) : landingPage', async () => {
    const result = await createFragment(landingPage.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment CallToAction on CallToAction { label link }",
        "fragment myButton on myButton { label link }",
        "fragment Hero on Hero { heading callToAction { __typename ...CallToAction ...myButton } }",
        "fragment SuperHero on SuperHero { heading embed_video callToAction { __typename ...CallToAction } }",
        "fragment SpecialHero on SpecialHero { heading primaryCallToAction { __typename ...CallToAction } callToAction { __typename ...CallToAction } }",
        "fragment LandingPage on LandingPage { hero { __typename ...Hero ...SuperHero ...SpecialHero } body { html, json } }",
      ]
    `);
  });

  test('works when the same reference is repeated', async () => {
    const result = await createFragment(superHeroBlock.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment CallToAction on CallToAction { label link }",
        "fragment SuperHero on SuperHero { heading embed_video callToAction { __typename ...CallToAction } }",
      ]
    `);
  });

  test('When contentType has both allowedTypes and restrictedTypes', async () => {
    const result = await createFragment(aboutPage.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment CallToAction on CallToAction { label link }",
        "fragment myButton on myButton { label link }",
        "fragment Hero on Hero { heading callToAction { __typename ...CallToAction ...myButton } }",
        "fragment AboutPage on AboutPage { hero { __typename ...Hero } body { html, json } }",
      ]
    `);
  });

  test('When the contentType has only allowedTypes defined', async () => {
    const result = await createFragment(fAQPage.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment myButton on myButton { label link }",
        "fragment CallToAction on CallToAction { label link }",
        "fragment Hero on Hero { heading callToAction { __typename ...CallToAction ...myButton } }",
        "fragment SuperHero on SuperHero { heading embed_video callToAction { __typename ...CallToAction } }",
        "fragment fAQPage on fAQPage { hero { __typename ...myButton ...Hero ...SuperHero } body { html, json } }",
      ]
    `);
  });

  test('When the contentType has only restrictedTypes (no allowedTypes) defined', async () => {
    const result = await createFragment(contactUsPage.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment CallToAction on CallToAction { label link }",
        "fragment SpecialHero on SpecialHero { heading primaryCallToAction { __typename ...CallToAction } callToAction { __typename ...CallToAction } }",
        "fragment myButton on myButton { label link }",
        "fragment Hero on Hero { heading callToAction { __typename ...CallToAction ...myButton } }",
        "fragment SuperHero on SuperHero { heading embed_video callToAction { __typename ...CallToAction } }",
        "fragment LandingPage on LandingPage { hero { __typename ...Hero ...SuperHero ...SpecialHero } body { html, json } }",
        "fragment ArticlePage on ArticlePage { body { html, json } relatedArticle { url { type, default }} source { type, default } tags }",
        "fragment AboutPage on AboutPage { hero { __typename ...Hero } body { html, json } }",
        "fragment AboutContent on AboutContent { heading embed_video callToAction { __typename ...CallToAction ...myButton } }",
        "fragment fAQPage on fAQPage { hero { __typename ...myButton ...Hero ...SuperHero } body { html, json } }",
        "fragment mediaMetaData on IContentMetadata { displayName url { default } ... on MediaMetadata { mimeType thumbnail content } }",
        "fragment customImage on customImage { name alt _metadata { ...mediaMetaData } }",
        "fragment _image on _Image { _metadata { ...mediaMetaData } }",
        "fragment customMedia on customMedia { name fileType _metadata { ...mediaMetaData } }",
        "fragment _media on _Media { _metadata { ...mediaMetaData } }",
        "fragment customVideo on customVideo { name date _metadata { ...mediaMetaData } }",
        "fragment _video on _Video { _metadata { ...mediaMetaData } }",
        "fragment mediaPage on mediaPage { media { __typename ...customImage ..._image ...customMedia ..._media ...customVideo ..._video } }",
        "fragment blogPage on blogPage { blog { __typename ...ArticlePage ...customImage ..._image } }",
        "fragment mediaBlock on mediaBlock { media { __typename ...mediaPage } }",
        "fragment NewHero on NewHero { heading summary background { url { type default }} theme }",
        "fragment NewHeroProperty on NewHeroProperty { heading summary background { url { type default }} theme }",
        "fragment FeedBackPage on FeedBackPage { p_contentArea { __typename ...NewHero } p_block { ...NewHeroProperty } }",
        "fragment LocationPage on LocationPage { location_area { __typename ...CallToAction ...SpecialHero ...Hero ...SuperHero ...myButton ...AboutContent ...mediaBlock ...NewHero } }",
        "fragment HomePage on HomePage { p_contentArea { __typename ...LandingPage ...ArticlePage ...AboutPage ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...specialPage ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage ...CallToAction ...SpecialHero ...Hero ...SuperHero ...myButton ...AboutContent ...mediaBlock ...NewHero ...customVideo ..._video ...customImage ..._image ...customMedia ..._media } }",
        "fragment ReviewPage on ReviewPage { location_area { __typename ...LandingPage ...ArticlePage ...AboutPage ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customImage ..._image ...customMedia ..._media ...customVideo ..._video ...specialPage ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage } }",
        "fragment ContentPage on ContentPage { p_contentArea { __typename ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...myButton ...AboutPage ...AboutContent ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customImage ..._image ...customMedia ..._media ...customVideo ..._video ...specialPage ...mediaBlock ...NewHero ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage } }",
        "fragment specialPage on specialPage { media { __typename ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...myButton ...AboutPage ...AboutContent ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customMedia ..._media ...customVideo ..._video ...specialPage ...mediaBlock ...NewHero ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage } }",
        "fragment contactUsPage on contactUsPage { others { __typename ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...AboutPage ...AboutContent ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customImage ..._image ...customMedia ..._media ...customVideo ..._video ...specialPage ...mediaBlock ...NewHero ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage } body { html, json } }",
      ]
    `);
  });

  test('When the contentType has allowedTypes defined with special type', async () => {
    const result = await createFragment(blogPage.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment ArticlePage on ArticlePage { body { html, json } relatedArticle { url { type, default }} source { type, default } tags }",
        "fragment mediaMetaData on IContentMetadata { displayName url { default } ... on MediaMetadata { mimeType thumbnail content } }",
        "fragment customImage on customImage { name alt _metadata { ...mediaMetaData } }",
        "fragment _image on _Image { _metadata { ...mediaMetaData } }",
        "fragment blogPage on blogPage { blog { __typename ...ArticlePage ...customImage ..._image } }",
      ]
    `);
  });

  test('When the contentType has special allowedTypes defined (_image, _media, _video)', async () => {
    const result = await createFragment(mediaPage.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment mediaMetaData on IContentMetadata { displayName url { default } ... on MediaMetadata { mimeType thumbnail content } }",
        "fragment customImage on customImage { name alt _metadata { ...mediaMetaData } }",
        "fragment _image on _Image { _metadata { ...mediaMetaData } }",
        "fragment customMedia on customMedia { name fileType _metadata { ...mediaMetaData } }",
        "fragment _media on _Media { _metadata { ...mediaMetaData } }",
        "fragment customVideo on customVideo { name date _metadata { ...mediaMetaData } }",
        "fragment _video on _Video { _metadata { ...mediaMetaData } }",
        "fragment mediaPage on mediaPage { media { __typename ...customImage ..._image ...customMedia ..._media ...customVideo ..._video } }",
      ]
    `);
  });

  test('When the contentType has only restrictedTypes (no allowedTypes) defined and its a BaseType (_image, _media, _video)', async () => {
    const result = await createFragment(specialPage.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment CallToAction on CallToAction { label link }",
        "fragment SpecialHero on SpecialHero { heading primaryCallToAction { __typename ...CallToAction } callToAction { __typename ...CallToAction } }",
        "fragment myButton on myButton { label link }",
        "fragment Hero on Hero { heading callToAction { __typename ...CallToAction ...myButton } }",
        "fragment SuperHero on SuperHero { heading embed_video callToAction { __typename ...CallToAction } }",
        "fragment LandingPage on LandingPage { hero { __typename ...Hero ...SuperHero ...SpecialHero } body { html, json } }",
        "fragment ArticlePage on ArticlePage { body { html, json } relatedArticle { url { type, default }} source { type, default } tags }",
        "fragment AboutPage on AboutPage { hero { __typename ...Hero } body { html, json } }",
        "fragment AboutContent on AboutContent { heading embed_video callToAction { __typename ...CallToAction ...myButton } }",
        "fragment fAQPage on fAQPage { hero { __typename ...myButton ...Hero ...SuperHero } body { html, json } }",
        "fragment mediaMetaData on IContentMetadata { displayName url { default } ... on MediaMetadata { mimeType thumbnail content } }",
        "fragment customImage on customImage { name alt _metadata { ...mediaMetaData } }",
        "fragment _image on _Image { _metadata { ...mediaMetaData } }",
        "fragment customMedia on customMedia { name fileType _metadata { ...mediaMetaData } }",
        "fragment _media on _Media { _metadata { ...mediaMetaData } }",
        "fragment customVideo on customVideo { name date _metadata { ...mediaMetaData } }",
        "fragment _video on _Video { _metadata { ...mediaMetaData } }",
        "fragment mediaPage on mediaPage { media { __typename ...customImage ..._image ...customMedia ..._media ...customVideo ..._video } }",
        "fragment blogPage on blogPage { blog { __typename ...ArticlePage ...customImage ..._image } }",
        "fragment mediaBlock on mediaBlock { media { __typename ...mediaPage } }",
        "fragment NewHero on NewHero { heading summary background { url { type default }} theme }",
        "fragment NewHeroProperty on NewHeroProperty { heading summary background { url { type default }} theme }",
        "fragment FeedBackPage on FeedBackPage { p_contentArea { __typename ...NewHero } p_block { ...NewHeroProperty } }",
        "fragment LocationPage on LocationPage { location_area { __typename ...CallToAction ...SpecialHero ...Hero ...SuperHero ...myButton ...AboutContent ...mediaBlock ...NewHero } }",
        "fragment HomePage on HomePage { p_contentArea { __typename ...LandingPage ...ArticlePage ...AboutPage ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...specialPage ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage ...CallToAction ...SpecialHero ...Hero ...SuperHero ...myButton ...AboutContent ...mediaBlock ...NewHero ...customVideo ..._video ...customImage ..._image ...customMedia ..._media } }",
        "fragment ReviewPage on ReviewPage { location_area { __typename ...LandingPage ...ArticlePage ...AboutPage ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customImage ..._image ...customMedia ..._media ...customVideo ..._video ...specialPage ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage } }",
        "fragment ContentPage on ContentPage { p_contentArea { __typename ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...myButton ...AboutPage ...AboutContent ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customImage ..._image ...customMedia ..._media ...customVideo ..._video ...specialPage ...mediaBlock ...NewHero ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage } }",
        "fragment contactUsPage on contactUsPage { others { __typename ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...AboutPage ...AboutContent ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customImage ..._image ...customMedia ..._media ...customVideo ..._video ...specialPage ...mediaBlock ...NewHero ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage } body { html, json } }",
        "fragment specialPage on specialPage { media { __typename ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...myButton ...AboutPage ...AboutContent ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customMedia ..._media ...customVideo ..._video ...specialPage ...mediaBlock ...NewHero ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage } }",
      ]
    `);
  });

  test('When the contentType has allowedTypes and has baseType as restricted (_image, _media, _video)', async () => {
    const result = await createFragment(mediaBlock.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment mediaMetaData on IContentMetadata { displayName url { default } ... on MediaMetadata { mimeType thumbnail content } }",
        "fragment customImage on customImage { name alt _metadata { ...mediaMetaData } }",
        "fragment _image on _Image { _metadata { ...mediaMetaData } }",
        "fragment customMedia on customMedia { name fileType _metadata { ...mediaMetaData } }",
        "fragment _media on _Media { _metadata { ...mediaMetaData } }",
        "fragment customVideo on customVideo { name date _metadata { ...mediaMetaData } }",
        "fragment _video on _Video { _metadata { ...mediaMetaData } }",
        "fragment mediaPage on mediaPage { media { __typename ...customImage ..._image ...customMedia ..._media ...customVideo ..._video } }",
        "fragment mediaBlock on mediaBlock { media { __typename ...mediaPage } }",
      ]
    `);
  });

  test('When the contentType has both contentArea and Block with the same contentType', async () => {
    const result = await createFragment(FeedBackPage.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment NewHero on NewHero { heading summary background { url { type default }} theme }",
        "fragment NewHeroProperty on NewHeroProperty { heading summary background { url { type default }} theme }",
        "fragment FeedBackPage on FeedBackPage { p_contentArea { __typename ...NewHero } p_block { ...NewHeroProperty } }",
      ]
    `);
  });

  test('When no allowedType is defined and a content type is included in its own content area', async () => {
    const result = await createFragment(ContentPage.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment CallToAction on CallToAction { label link }",
        "fragment SpecialHero on SpecialHero { heading primaryCallToAction { __typename ...CallToAction } callToAction { __typename ...CallToAction } }",
        "fragment myButton on myButton { label link }",
        "fragment Hero on Hero { heading callToAction { __typename ...CallToAction ...myButton } }",
        "fragment SuperHero on SuperHero { heading embed_video callToAction { __typename ...CallToAction } }",
        "fragment LandingPage on LandingPage { hero { __typename ...Hero ...SuperHero ...SpecialHero } body { html, json } }",
        "fragment ArticlePage on ArticlePage { body { html, json } relatedArticle { url { type, default }} source { type, default } tags }",
        "fragment AboutPage on AboutPage { hero { __typename ...Hero } body { html, json } }",
        "fragment AboutContent on AboutContent { heading embed_video callToAction { __typename ...CallToAction ...myButton } }",
        "fragment fAQPage on fAQPage { hero { __typename ...myButton ...Hero ...SuperHero } body { html, json } }",
        "fragment mediaMetaData on IContentMetadata { displayName url { default } ... on MediaMetadata { mimeType thumbnail content } }",
        "fragment customImage on customImage { name alt _metadata { ...mediaMetaData } }",
        "fragment _image on _Image { _metadata { ...mediaMetaData } }",
        "fragment customMedia on customMedia { name fileType _metadata { ...mediaMetaData } }",
        "fragment _media on _Media { _metadata { ...mediaMetaData } }",
        "fragment customVideo on customVideo { name date _metadata { ...mediaMetaData } }",
        "fragment _video on _Video { _metadata { ...mediaMetaData } }",
        "fragment mediaPage on mediaPage { media { __typename ...customImage ..._image ...customMedia ..._media ...customVideo ..._video } }",
        "fragment blogPage on blogPage { blog { __typename ...ArticlePage ...customImage ..._image } }",
        "fragment mediaBlock on mediaBlock { media { __typename ...mediaPage } }",
        "fragment NewHero on NewHero { heading summary background { url { type default }} theme }",
        "fragment NewHeroProperty on NewHeroProperty { heading summary background { url { type default }} theme }",
        "fragment FeedBackPage on FeedBackPage { p_contentArea { __typename ...NewHero } p_block { ...NewHeroProperty } }",
        "fragment LocationPage on LocationPage { location_area { __typename ...CallToAction ...SpecialHero ...Hero ...SuperHero ...myButton ...AboutContent ...mediaBlock ...NewHero } }",
        "fragment HomePage on HomePage { p_contentArea { __typename ...LandingPage ...ArticlePage ...AboutPage ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...specialPage ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage ...CallToAction ...SpecialHero ...Hero ...SuperHero ...myButton ...AboutContent ...mediaBlock ...NewHero ...customVideo ..._video ...customImage ..._image ...customMedia ..._media } }",
        "fragment ReviewPage on ReviewPage { location_area { __typename ...LandingPage ...ArticlePage ...AboutPage ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customImage ..._image ...customMedia ..._media ...customVideo ..._video ...specialPage ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage } }",
        "fragment specialPage on specialPage { media { __typename ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...myButton ...AboutPage ...AboutContent ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customMedia ..._media ...customVideo ..._video ...specialPage ...mediaBlock ...NewHero ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage } }",
        "fragment contactUsPage on contactUsPage { others { __typename ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...AboutPage ...AboutContent ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customImage ..._image ...customMedia ..._media ...customVideo ..._video ...specialPage ...mediaBlock ...NewHero ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage } body { html, json } }",
        "fragment ContentPage on ContentPage { p_contentArea { __typename ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...myButton ...AboutPage ...AboutContent ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customImage ..._image ...customMedia ..._media ...customVideo ..._video ...specialPage ...mediaBlock ...NewHero ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage } }",
      ]
    `);
  });

  test('When the contentType has both contentArea with main allowedTpes', async () => {
    const result = await createFragment(LocationPage.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment CallToAction on CallToAction { label link }",
        "fragment SpecialHero on SpecialHero { heading primaryCallToAction { __typename ...CallToAction } callToAction { __typename ...CallToAction } }",
        "fragment myButton on myButton { label link }",
        "fragment Hero on Hero { heading callToAction { __typename ...CallToAction ...myButton } }",
        "fragment SuperHero on SuperHero { heading embed_video callToAction { __typename ...CallToAction } }",
        "fragment AboutContent on AboutContent { heading embed_video callToAction { __typename ...CallToAction ...myButton } }",
        "fragment mediaMetaData on IContentMetadata { displayName url { default } ... on MediaMetadata { mimeType thumbnail content } }",
        "fragment customImage on customImage { name alt _metadata { ...mediaMetaData } }",
        "fragment _image on _Image { _metadata { ...mediaMetaData } }",
        "fragment customMedia on customMedia { name fileType _metadata { ...mediaMetaData } }",
        "fragment _media on _Media { _metadata { ...mediaMetaData } }",
        "fragment customVideo on customVideo { name date _metadata { ...mediaMetaData } }",
        "fragment _video on _Video { _metadata { ...mediaMetaData } }",
        "fragment mediaPage on mediaPage { media { __typename ...customImage ..._image ...customMedia ..._media ...customVideo ..._video } }",
        "fragment mediaBlock on mediaBlock { media { __typename ...mediaPage } }",
        "fragment NewHero on NewHero { heading summary background { url { type default }} theme }",
        "fragment LocationPage on LocationPage { location_area { __typename ...CallToAction ...SpecialHero ...Hero ...SuperHero ...myButton ...AboutContent ...mediaBlock ...NewHero } }",
      ]
    `);
  });

  test('When the contentType has both contentArea with main restrictedTypes', async () => {
    const result = await createFragment(ReviewPage.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment CallToAction on CallToAction { label link }",
        "fragment myButton on myButton { label link }",
        "fragment Hero on Hero { heading callToAction { __typename ...CallToAction ...myButton } }",
        "fragment SuperHero on SuperHero { heading embed_video callToAction { __typename ...CallToAction } }",
        "fragment SpecialHero on SpecialHero { heading primaryCallToAction { __typename ...CallToAction } callToAction { __typename ...CallToAction } }",
        "fragment LandingPage on LandingPage { hero { __typename ...Hero ...SuperHero ...SpecialHero } body { html, json } }",
        "fragment ArticlePage on ArticlePage { body { html, json } relatedArticle { url { type, default }} source { type, default } tags }",
        "fragment AboutPage on AboutPage { hero { __typename ...Hero } body { html, json } }",
        "fragment AboutContent on AboutContent { heading embed_video callToAction { __typename ...CallToAction ...myButton } }",
        "fragment fAQPage on fAQPage { hero { __typename ...myButton ...Hero ...SuperHero } body { html, json } }",
        "fragment mediaMetaData on IContentMetadata { displayName url { default } ... on MediaMetadata { mimeType thumbnail content } }",
        "fragment customImage on customImage { name alt _metadata { ...mediaMetaData } }",
        "fragment _image on _Image { _metadata { ...mediaMetaData } }",
        "fragment customMedia on customMedia { name fileType _metadata { ...mediaMetaData } }",
        "fragment _media on _Media { _metadata { ...mediaMetaData } }",
        "fragment customVideo on customVideo { name date _metadata { ...mediaMetaData } }",
        "fragment _video on _Video { _metadata { ...mediaMetaData } }",
        "fragment mediaPage on mediaPage { media { __typename ...customImage ..._image ...customMedia ..._media ...customVideo ..._video } }",
        "fragment blogPage on blogPage { blog { __typename ...ArticlePage ...customImage ..._image } }",
        "fragment mediaBlock on mediaBlock { media { __typename ...mediaPage } }",
        "fragment NewHero on NewHero { heading summary background { url { type default }} theme }",
        "fragment NewHeroProperty on NewHeroProperty { heading summary background { url { type default }} theme }",
        "fragment FeedBackPage on FeedBackPage { p_contentArea { __typename ...NewHero } p_block { ...NewHeroProperty } }",
        "fragment LocationPage on LocationPage { location_area { __typename ...CallToAction ...SpecialHero ...Hero ...SuperHero ...myButton ...AboutContent ...mediaBlock ...NewHero } }",
        "fragment HomePage on HomePage { p_contentArea { __typename ...LandingPage ...ArticlePage ...AboutPage ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...specialPage ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage ...CallToAction ...SpecialHero ...Hero ...SuperHero ...myButton ...AboutContent ...mediaBlock ...NewHero ...customVideo ..._video ...customImage ..._image ...customMedia ..._media } }",
        "fragment ContentPage on ContentPage { p_contentArea { __typename ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...myButton ...AboutPage ...AboutContent ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customImage ..._image ...customMedia ..._media ...customVideo ..._video ...specialPage ...mediaBlock ...NewHero ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage } }",
        "fragment specialPage on specialPage { media { __typename ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...myButton ...AboutPage ...AboutContent ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customMedia ..._media ...customVideo ..._video ...specialPage ...mediaBlock ...NewHero ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage } }",
        "fragment contactUsPage on contactUsPage { others { __typename ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...AboutPage ...AboutContent ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customImage ..._image ...customMedia ..._media ...customVideo ..._video ...specialPage ...mediaBlock ...NewHero ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage } body { html, json } }",
        "fragment ReviewPage on ReviewPage { location_area { __typename ...LandingPage ...ArticlePage ...AboutPage ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customImage ..._image ...customMedia ..._media ...customVideo ..._video ...specialPage ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage } }",
      ]
    `);
  });

  test('works for HomePage content type', async () => {
    const result = await createFragment(HomePage.key);
    expect(result).toMatchInlineSnapshot(`
      [
        "fragment CallToAction on CallToAction { label link }",
        "fragment myButton on myButton { label link }",
        "fragment Hero on Hero { heading callToAction { __typename ...CallToAction ...myButton } }",
        "fragment SuperHero on SuperHero { heading embed_video callToAction { __typename ...CallToAction } }",
        "fragment SpecialHero on SpecialHero { heading primaryCallToAction { __typename ...CallToAction } callToAction { __typename ...CallToAction } }",
        "fragment LandingPage on LandingPage { hero { __typename ...Hero ...SuperHero ...SpecialHero } body { html, json } }",
        "fragment ArticlePage on ArticlePage { body { html, json } relatedArticle { url { type, default }} source { type, default } tags }",
        "fragment AboutPage on AboutPage { hero { __typename ...Hero } body { html, json } }",
        "fragment AboutContent on AboutContent { heading embed_video callToAction { __typename ...CallToAction ...myButton } }",
        "fragment fAQPage on fAQPage { hero { __typename ...myButton ...Hero ...SuperHero } body { html, json } }",
        "fragment mediaMetaData on IContentMetadata { displayName url { default } ... on MediaMetadata { mimeType thumbnail content } }",
        "fragment customImage on customImage { name alt _metadata { ...mediaMetaData } }",
        "fragment _image on _Image { _metadata { ...mediaMetaData } }",
        "fragment customMedia on customMedia { name fileType _metadata { ...mediaMetaData } }",
        "fragment _media on _Media { _metadata { ...mediaMetaData } }",
        "fragment customVideo on customVideo { name date _metadata { ...mediaMetaData } }",
        "fragment _video on _Video { _metadata { ...mediaMetaData } }",
        "fragment mediaPage on mediaPage { media { __typename ...customImage ..._image ...customMedia ..._media ...customVideo ..._video } }",
        "fragment blogPage on blogPage { blog { __typename ...ArticlePage ...customImage ..._image } }",
        "fragment mediaBlock on mediaBlock { media { __typename ...mediaPage } }",
        "fragment NewHero on NewHero { heading summary background { url { type default }} theme }",
        "fragment NewHeroProperty on NewHeroProperty { heading summary background { url { type default }} theme }",
        "fragment FeedBackPage on FeedBackPage { p_contentArea { __typename ...NewHero } p_block { ...NewHeroProperty } }",
        "fragment LocationPage on LocationPage { location_area { __typename ...CallToAction ...SpecialHero ...Hero ...SuperHero ...myButton ...AboutContent ...mediaBlock ...NewHero } }",
        "fragment ReviewPage on ReviewPage { location_area { __typename ...LandingPage ...ArticlePage ...AboutPage ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customImage ..._image ...customMedia ..._media ...customVideo ..._video ...specialPage ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage } }",
        "fragment ContentPage on ContentPage { p_contentArea { __typename ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...myButton ...AboutPage ...AboutContent ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customImage ..._image ...customMedia ..._media ...customVideo ..._video ...specialPage ...mediaBlock ...NewHero ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage } }",
        "fragment specialPage on specialPage { media { __typename ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...myButton ...AboutPage ...AboutContent ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customMedia ..._media ...customVideo ..._video ...specialPage ...mediaBlock ...NewHero ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage } }",
        "fragment contactUsPage on contactUsPage { others { __typename ...CallToAction ...SpecialHero ...Hero ...SuperHero ...LandingPage ...ArticlePage ...AboutPage ...AboutContent ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...customImage ..._image ...customMedia ..._media ...customVideo ..._video ...specialPage ...mediaBlock ...NewHero ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage } body { html, json } }",
        "fragment HomePage on HomePage { p_contentArea { __typename ...LandingPage ...ArticlePage ...AboutPage ...contactUsPage ...fAQPage ...mediaPage ...blogPage ...specialPage ...FeedBackPage ...ContentPage ...LocationPage ...ReviewPage ...HomePage ...CallToAction ...SpecialHero ...Hero ...SuperHero ...myButton ...AboutContent ...mediaBlock ...NewHero ...customVideo ..._video ...customImage ..._image ...customMedia ..._media } }",
      ]
    `);
  });
});

describe('createQuery', () => {
  test('simple content types', async () => {
    const result = await getContentQuery(callToAction.key);
    expect(result).toMatchInlineSnapshot(`
      "
      fragment CallToAction on CallToAction { label link }
      query FetchContent($filter: _ContentWhereInput) {
        _Content(where: $filter) {
          item {
            __typename
            ...CallToAction
          }
        }
      }
        "
    `);
  });

  test('complex content types', async () => {
    const result = await getContentQuery(articlePage.key);
    expect(result).toMatchInlineSnapshot(`
      "
      fragment ArticlePage on ArticlePage { body { html, json } relatedArticle { url { type, default }} source { type, default } tags }
      query FetchContent($filter: _ContentWhereInput) {
        _Content(where: $filter) {
          item {
            __typename
            ...ArticlePage
          }
        }
      }
        "
    `);
  });

  test('nested content types (one level)', async () => {
    const result = await getContentQuery(heroBlock.key);
    expect(result).toMatchInlineSnapshot(`
      "
      fragment CallToAction on CallToAction { label link }
      fragment myButton on myButton { label link }
      fragment Hero on Hero { heading callToAction { __typename ...CallToAction ...myButton } }
      query FetchContent($filter: _ContentWhereInput) {
        _Content(where: $filter) {
          item {
            __typename
            ...Hero
          }
        }
      }
        "
    `);
  });

  test('nested content types (several levels)', async () => {
    const result = await getContentQuery(landingPage.key);
    expect(result).toMatchInlineSnapshot(`
      "
      fragment CallToAction on CallToAction { label link }
      fragment myButton on myButton { label link }
      fragment Hero on Hero { heading callToAction { __typename ...CallToAction ...myButton } }
      fragment SuperHero on SuperHero { heading embed_video callToAction { __typename ...CallToAction } }
      fragment SpecialHero on SpecialHero { heading primaryCallToAction { __typename ...CallToAction } callToAction { __typename ...CallToAction } }
      fragment LandingPage on LandingPage { hero { __typename ...Hero ...SuperHero ...SpecialHero } body { html, json } }
      query FetchContent($filter: _ContentWhereInput) {
        _Content(where: $filter) {
          item {
            __typename
            ...LandingPage
          }
        }
      }
        "
    `);
  });
});
