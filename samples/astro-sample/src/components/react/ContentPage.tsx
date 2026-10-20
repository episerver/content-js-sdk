import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';

interface ContentPageProps {
  content: any;
}

// Astro cannot tell which renderer owns the SDK's async OptimizelyComponent once Svelte is also installed.
export default function ContentPage({ content }: ContentPageProps) {
  return <OptimizelyComponent content={content} />;
}
