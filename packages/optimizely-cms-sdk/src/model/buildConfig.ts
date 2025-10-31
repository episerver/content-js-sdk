export type PropertyGroupType = {
  key: string;
  displayName: string;
  sortOrder?: number;
};

export type BuildConfig = {
  components: string[];
  propertyGroups: Array<PropertyGroupType>;
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
