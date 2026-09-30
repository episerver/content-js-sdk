import { ComponentRegistry } from '@optimizely/cms-sdk/core';

import Article from '../components/svelte/Article.svelte';
import Banner from '../components/svelte/Banner.svelte';
import BlankExperience from '../components/svelte/BlankExperience.svelte';
import BlankSection from '../components/svelte/BlankSection.svelte';
import BlogCard from '../components/svelte/BlogCard.svelte';
import BlogExperience from '../components/svelte/BlogExperience.svelte';
import CallToAction from '../components/svelte/CallToAction.svelte';
import MonthlySpecial from '../components/svelte/MonthlySpecial.svelte';
import SmallFeature from '../components/svelte/SmallFeature.svelte';
import SmallFeatureGrid from '../components/svelte/SmallFeatureGrid.svelte';
import Tile from '../components/svelte/Tile.svelte';
import SquareTile from '../components/svelte/SquareTile.svelte';

// Kept apart from the React registry in `optimizely.ts`, which is global and shared by the React routes.
export const svelteRegistry = new ComponentRegistry({
  Article,
  Banner,
  BlankExperience,
  BlankSection,
  BlogCard,
  BlogExperience,
  CallToAction,
  MonthlySpecial,
  SmallFeature,
  SmallFeatureGrid,
  Tile: {
    default: Tile,
    tags: {
      Square: SquareTile,
    },
  },
});
