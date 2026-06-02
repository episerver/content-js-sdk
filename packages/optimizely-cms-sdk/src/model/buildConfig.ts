export type PropertyGroupType = {
  key: string;
  displayName: string;
  sortOrder?: number;
};

const urlSchemes = ['http', 'https'] as const;
const applicationTypes = ['website', 'inProcessWebsite'] as const;
const hostTypes = ['default', 'primary', 'preview', 'edit', 'media'] as const;

export type UrlScheme = (typeof urlSchemes)[number];
export type HostType = (typeof hostTypes)[number];
export type ApplicationType = (typeof applicationTypes)[number];

export type ApplicationHostType = {
  type?: HostType;
  locale?: string;
  authority: string;
  preferredUrlScheme?: UrlScheme;
};

export type ApplicationsType = {
  key?: string;
  type: ApplicationType;
  isDefault?: boolean;
  displayName: string;
  entryPoint?: string;
  usePreviewTokens?: boolean;
  hosts?: ApplicationHostType[];
  useApplicationSpecificAssets?: boolean;
  previewUrlFormats?: Record<string, string>;
};

export type ContentType = {
  key: string;
  displayName: string;
  contentType: string;
};

export type BuildConfig = {
  components: string[];
  propertyGroups: Array<PropertyGroupType>;
  applications?: Array<ApplicationsType>;
  content?: Array<ContentType>;
};

// Built-in/default property groups that all users get
export type BuiltInPropertyGroups =
  | 'Content'
  | 'Scheduling'
  | 'Settings'
  | 'Shortcut'
  | 'Categories'
  | 'DynamicBlocks';

// Global registry for custom property group keys - can be augmented per project
export interface PropertyGroupRegistry {
  // Developers can add custom property groups here via module augmentation
}

// Type that combines built-in groups, registered custom groups
export type PropertyGroupKey =
  | BuiltInPropertyGroups
  | keyof PropertyGroupRegistry
  | (string & {});
