export type PropertyGroupType = {
  key: string;
  displayName: string;
  sortOrder?: number;
};

export enum ApplicationHostType {
  Default = 0,
  Primary = 1,
  Preview = 2,
  RedirectPermanent = 3,
  RedirectTemporary = 4,
  Edit = 5,
  Media = 6,
}

export enum ApplicationHostScheme {
  Http = 'http',
  Https = 'https',
}

export interface ApplicationHost {
  authority: string;
  type: ApplicationHostType;
  locale: string | null;
  useSecureConnection: boolean;
  url: string;
  scheme: ApplicationHostScheme;
}

export enum ApplicationType {
  inProcessWebsite = 1,
  website = 2,
}

export type Application = {
  key: string;
  displayName: string;
  type: ApplicationType;
  entryPoint: string;
  isDefault?: boolean;
  hosts?: ApplicationHost[];
  usePreviewTokens?: boolean;
  previewUrlFormats?: string[];
  useApplicationSpecificAssets?: boolean;
};

export type BuildConfig = {
  components: string[];
  propertyGroups: Array<PropertyGroupType>;
  applications?: Array<Application>;
};

// Built-in/default property groups that all users get
export type BuiltInPropertyGroups =
  | 'Information'
  | 'Scheduling'
  | 'Advanced'
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
