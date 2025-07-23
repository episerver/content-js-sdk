export type MetadataResponse = {
  key?: string;
  locale?: string;
  fallbackForLocale?: string;
  version?: string;
  displayName?: string;
  url?: {
    type?: string;
    default?: string;
    hierarchical?: string;
    internal?: string;
    graph?: string;
    base?: string;
  };
  types?: (string | null)[];
  published?: string;
  status?: string;
  changeset?: string;
  created?: string;
  lastModified?: string;
  sortOrder?: number;
  variation?: string;
};

export const metadataQueryBody = `_metadata { key locale fallbackForLocale version displayName url {type default hierarchical internal graph} types published status changeset created lastModified sortOrder variation }`;
