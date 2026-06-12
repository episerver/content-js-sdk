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

type BaseApplicationType = {
  key?: string;
  isDefault?: boolean;
  displayName: string;
  /**
   * Format: uri
   * @description A reference to the entry point (start page) content for this application.
   */
  entryPoint?: string;
  /** @description The hosts assigned to this application. */
  hosts?: ApplicationHostType[];
  /** @description Whether this application uses a dedicated assets folder. */
  useApplicationSpecificAssets?: boolean;
};

type WebsiteApplicationType = BaseApplicationType & {
  type: 'website';
  /** @description Whether to use preview tokens for this application. Only applicable when the type is 'website'. */
  usePreviewTokens?: boolean;
  /** @description A dictionary of preview URL formats keyed by content type base or content type key. Only applicable when the type is 'website'. */
  previewUrlFormats?: {
    [key: string]: string;
  };
};

type InProcessWebsiteApplicationType = BaseApplicationType & {
  type: 'inProcessWebsite';
};

export type ApplicationsType = WebsiteApplicationType | InProcessWebsiteApplicationType;

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
