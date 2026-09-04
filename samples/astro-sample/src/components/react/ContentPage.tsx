import { OptimizelyComponent, withAppContext } from '@optimizely/cms-sdk/react/server';

interface ContentPageProps {
  content: any;
}

function ContentPageComponent({ content }: ContentPageProps) {
  return <OptimizelyComponent content={content} />;
}

export default withAppContext(ContentPageComponent);
