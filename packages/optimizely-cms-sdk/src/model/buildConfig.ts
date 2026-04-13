export type PropertyGroupType = {
  key: string;
  displayName: string;
  sortOrder?: number;
};


const applicationTypes = ['website', 'inProcessWebsite'] as const;
const hostTypes = ['default', 'primary', 'preview', 'edit', 'media'] as const;

export type HostType = (typeof hostTypes)[number];
export type ApplicationType = (typeof applicationTypes)[number];

export type ApplicationHostType = {
  type?: HostType;
  locale?: string;
  authority: string;
  preferredUrlScheme?: object;
};

export type ApplicationsType = {
  key?: string;
  type: ApplicationType;
  isDefault?: boolean;
  displayName: string;
  entryPoint: string;
  usePreviewTokens?: boolean;
  hosts?: ApplicationHostType[];
  useApplicationSpecificAssets?: boolean;
  previewUrlFormats?: Record<string, string>;
};

export type BuildConfig = {
  components: string[];
  propertyGroups: Array<PropertyGroupType>;
  applications: Array<ApplicationsType>;
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
