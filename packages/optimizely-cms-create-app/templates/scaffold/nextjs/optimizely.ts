import { config, initContentTypeRegistry, initDisplayTemplateRegistry } from '@optimizely/cms-sdk';
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY || '',
  graphUrl: process.env.OPTIMIZELY_GRAPH_GATEWAY,
});

initContentTypeRegistry([
  // Add your content types here, e.g.:
  // ArticleContentType,
]);

initReactComponentRegistry({
  resolver: {
    // Map content types to React components here, e.g.:
    // Article,
  },
});

initDisplayTemplateRegistry([]);
