interface ImportMetaEnv {
  readonly OPTIMIZELY_CMS_URL: string;
  readonly OPTIMIZELY_GRAPH_GATEWAY?: string;
  readonly OPTIMIZELY_GRAPH_SINGLE_KEY?: string;
  readonly OPTIMIZELY_CMS_CLIENT_ID?: string;
  readonly OPTIMIZELY_CMS_CLIENT_SECRET?: string;
  readonly APPLICATION_HOST?: string;
  readonly OPTIMIZELY_CMS_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
