export interface paths {
  '/blueprints': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List blueprints
     * @description List blueprints using the provided parameters.
     */
    get: operations['Blueprints_List'];
    put?: never;
    /**
     * Create blueprint
     * @description Create a new blueprint.
     */
    post: operations['Blueprints_Create'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/blueprints/{key}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get blueprint
     * @description Get the blueprint with the provided key.
     */
    get: operations['Blueprints_Get'];
    put?: never;
    post?: never;
    /**
     * Delete blueprint
     * @description Deletes the blueprint with the provided key.
     */
    delete: operations['Blueprints_Delete'];
    options?: never;
    head?: never;
    /**
     * Patch blueprint
     * @description Patch an existing blueprint.
     */
    patch: operations['Blueprints_Patch'];
    trace?: never;
  };
  '/content': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Create content
     * @description Create a new content item.
     */
    post: operations['Content_Create'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/content/{key}:copy': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Copy content
     * @description Create a copy of the content item with the provided key.
     */
    post: operations['Content_Copy'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/content/{key}:undelete': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Restore content
     * @description Restore the deleted content item with the provided key. If a content item with the provided key is not deleted an error is returned.
     */
    post: operations['Content_Undelete'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/content/{key}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get content node
     * @description Get content node with the provided key.
     */
    get: operations['Content_GetNode'];
    put?: never;
    post?: never;
    /**
     * Delete content
     * @description Deletes the content item with the provided key. If a content item with the provided key does not exist an error is returned.
     */
    delete: operations['Content_Delete'];
    options?: never;
    head?: never;
    /**
     * Patch content
     * @description Patch an existing content item. If a content item with the provided key does not exist an error is returned.
     */
    patch: operations['Content_PatchNode'];
    trace?: never;
  };
  '/content/{key}/assets': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List assets
     * @description List the assets that belongs to a content instance.
     */
    get: operations['Content_ListAssets'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/content/{key}/items': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List content in container
     * @description List the content items located in a specific container.
     */
    get: operations['Content_ListItems'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/content/{key}/locales/{locale}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List locale versions
     * @description List versions of the content with the provided key and locale.
     */
    get: operations['Content_ListLocaleVersions'];
    put?: never;
    post?: never;
    /**
     * Delete locale
     * @description Deletes a branch of the content with the provided key and locale. Returns the published or latest content item in the locale that was deleted. If a content item with the provided key does not exist an error is returned.
     */
    delete: operations['Content_DeleteLocale'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/content/{key}/path': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get content path
     * @description Get the content path with the provided key.
     */
    get: operations['Content_GetPath'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/content/{key}/versions': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List versions
     * @description List versions of the content item with the provided key and the provided options.
     */
    get: operations['Content_ListVersions'];
    put?: never;
    /**
     * Create version
     * @description Create a new version of a content item.
     */
    post: operations['Content_CreateVersion'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/content/{key}/versions/{version}:approve': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Approve the active step of an approval for a content version that is in review. For multi-step approvals, the version remains in review until all steps are approved. */
    post: operations['Content_Approve'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/content/{key}/versions/{version}:draft': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Change content version into draft status. */
    post: operations['Content_Draft'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/content/{key}/versions/{version}:publish': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Publish content version */
    post: operations['Content_Publish'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/content/{key}/versions/{version}:ready': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Make content ready to publish, if approvals are required the version will automatically be moved to in review. */
    post: operations['Content_Ready'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/content/{key}/versions/{version}:reject': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Reject a content version that is in review. The version transitions to rejected status regardless of remaining approval steps. */
    post: operations['Content_Reject'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/content/{key}/versions/{version}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get version
     * @description Get the content item with the provided key and version.
     */
    get: operations['Content_GetVersion'];
    put?: never;
    post?: never;
    /**
     * Delete version
     * @description Deletes the content item with the provided key and version and returns the deleted item. If a content item with the provided key does not exist an error is returned.
     */
    delete: operations['Content_DeleteVersion'];
    options?: never;
    head?: never;
    /**
     * Patch version
     * @description Patch an existing content item and returns the updated content item. If a content item with the provided key does not exist an error is returned.
     */
    patch: operations['Content_PatchVersion'];
    trace?: never;
  };
  '/content/{key}/versions/{version}/media': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Download content media file.
     * @description Download the media file for a specific content item version.
     */
    get: operations['Content_GetMedia'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/content/versions': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Query versions
     * @description List content versions based on the provided query options.
     */
    get: operations['Content_ListAllVersions'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/contentsources': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List content sources
     * @description List content sources using the provided options.
     */
    get: operations['ContentSources_List'];
    put?: never;
    /**
     * Create contentsource
     * @description Create a new contentsource.
     */
    post: operations['ContentSources_Create'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/contentsources/{key}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get contentsource
     * @description Get the contentsource with the provided key.
     */
    get: operations['ContentSources_Get'];
    put?: never;
    post?: never;
    /**
     * Delete contentsource
     * @description Deletes the contentsource with the provided key.
     */
    delete: operations['ContentSources_Delete'];
    options?: never;
    head?: never;
    /**
     * Patch contentsource
     * @description Patch an existing contentsource.
     */
    patch: operations['ContentSources_Patch'];
    trace?: never;
  };
  '/contenttypebindings': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List content type bindings
     * @description List type bindings using the provided options.
     */
    get: operations['ContentTypeBindings_List'];
    put?: never;
    /**
     * Create contenttypebinding
     * @description Create a new contenttypebinding.
     */
    post: operations['ContentTypeBindings_Create'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/contenttypebindings/{key}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get contenttypebinding
     * @description Get the contenttypebinding with the provided key.
     */
    get: operations['ContentTypeBindings_Get'];
    put?: never;
    post?: never;
    /**
     * Delete contenttypebinding
     * @description Deletes the contenttypebinding with the provided key.
     */
    delete: operations['ContentTypeBindings_Delete'];
    options?: never;
    head?: never;
    /**
     * Patch contenttypebinding
     * @description Patch an existing contenttypebinding.
     */
    patch: operations['ContentTypeBindings_Patch'];
    trace?: never;
  };
  '/contenttypes': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List content types
     * @description List content types using the provided parameters.
     */
    get: operations['ContentTypes_List'];
    put?: never;
    /**
     * Create content type
     * @description Create a new content type.
     */
    post: operations['ContentTypes_Create'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/contenttypes/{key}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get content type
     * @description Get the content type with the provided key.
     */
    get: operations['ContentTypes_Get'];
    put?: never;
    post?: never;
    /**
     * Delete content type
     * @description Deletes the content type with the provided key.
     */
    delete: operations['ContentTypes_Delete'];
    options?: never;
    head?: never;
    /**
     * Patch content type
     * @description Patch an existing content type.
     */
    patch: operations['ContentTypes_Patch'];
    trace?: never;
  };
  '/displaytemplates': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List display templates
     * @description List display templates using the provided parameters.
     */
    get: operations['DisplayTemplates_List'];
    put?: never;
    /**
     * Create display template
     * @description Create a new display template.
     */
    post: operations['DisplayTemplates_Create'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/displaytemplates/{key}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get display template
     * @description Get the display template with the provided key.
     */
    get: operations['DisplayTemplates_Get'];
    put?: never;
    post?: never;
    /**
     * Delete display template
     * @description Deletes the display template with the provided key.
     */
    delete: operations['DisplayTemplates_Delete'];
    options?: never;
    head?: never;
    /**
     * Patch display template
     * @description Patch an existing display template.
     */
    patch: operations['DisplayTemplates_Patch'];
    trace?: never;
  };
  '/locales': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List locales
     * @description List all locales (language branches) available in the CMS.
     */
    get: operations['Locales_List'];
    put?: never;
    /**
     * Create locale
     * @description Create a new locale.
     */
    post: operations['Locales_Create'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/locales/{key}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get locale
     * @description Get the locale with the provided key.
     */
    get: operations['Locales_Get'];
    put?: never;
    post?: never;
    /**
     * Delete locale
     * @description Deletes the locale with the provided key.
     */
    delete: operations['Locales_Delete'];
    options?: never;
    head?: never;
    /**
     * Patch locale
     * @description Patch an existing locale.
     */
    patch: operations['Locales_Patch'];
    trace?: never;
  };
  '/manifest': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Export manifest
     * @description Export a CMS content manifest.
     */
    get: operations['Manifest_Export'];
    put?: never;
    /**
     * Import manifest
     * @description Import a CMS content manifest.
     */
    post: operations['Manifest_Import'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/propertyformats': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List property formats
     * @description List all property formats using the provided options.
     */
    get: operations['PropertyFormats_List'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/propertyformats/{key}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get property format
     * @description Get the property format with the provided key.
     */
    get: operations['PropertyFormats_Get'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/propertygroups': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * List property groups
     * @description List property groups using the provided options.
     */
    get: operations['PropertyGroups_List'];
    put?: never;
    /**
     * Create property group
     * @description Create a new property group.
     */
    post: operations['PropertyGroups_Create'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/propertygroups/{key}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get property group
     * @description Get the property group with the provided key.
     */
    get: operations['PropertyGroups_Get'];
    put?: never;
    post?: never;
    /**
     * Delete property group
     * @description Deletes the property group with the provided key.
     */
    delete: operations['PropertyGroups_Delete'];
    options?: never;
    head?: never;
    /**
     * Patch property group
     * @description Patch an existing property group.
     */
    patch: operations['PropertyGroups_Patch'];
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    /** @description Options for approving or rejecting a content version. */
    ApprovalDecisionOptions: {
      /** @description An optional comment to include with the approval decision. May be required depending on the approval definition configuration. */
      comment?: string | null;
      /** @description Indicates if the approval should be forced, bypassing the normal approval flow. Requires 'admin' access rights. */
      force?: boolean;
    };
    /** @description Describes the items of a content type property of type 'array'. */
    ArrayItem: {
      /**
       * @description The fundamental data type for the items in the array (e.g., string, integer, content reference).
       * @enum {string}
       */
      type:
        | 'string'
        | 'url'
        | 'boolean'
        | 'integer'
        | 'float'
        | 'dateTime'
        | 'contentReference'
        | 'content'
        | 'link'
        | 'richText'
        | 'json'
        | 'component';
      /** @description The property format that defines specialized handling and validation for this array item. */
      format?: string;
      /** @description The content type that items in the array may contain, when the 'type' is set to 'component'. */
      contentType?: string;
      /** @description The minimum value that properties of this type should be able to contain. Value type must match the type of the array item. */
      minimum?: ((number | null) | (number | null) | (string | null) | (string | null)) | null;
      /** @description The maximum value that array items of this type should be able to contain. Value type must match the type of the array item. */
      maximum?: ((number | null) | (number | null) | (string | null) | (string | null)) | null;
      /**
       * Format: int32
       * @description The minimum string length that array items of this type should be able to contain.
       */
      minLength?: number | null;
      /**
       * Format: int32
       * @description The maximum string length that array items of this type should be able to contain.
       */
      maxLength?: number | null;
      /**
       * Format: regex
       * @description Regular expression pattern that limits what strings that array items of this type should be able to contain.
       */
      pattern?: string;
      /** @description A predefined list of allowed values for array items of this type. The enumeration values must match the property's data type. Allowed for string, integer, float and date-time property types. */
      enum?: components['schemas']['EnumerationValue'][] | null;
      /** @description Defines content and base types that array items of this type may contain. */
      allowedTypes?: string[];
      /** @description Defines content and base types that array items of this type may not contain. */
      restrictedTypes?: string[];
      /** @description Defines editor specific settings for this item. The settings are specific to the item and editor type. */
      editorSettings?: {
        [key: string]: unknown;
      } | null;
    };
    /** @description Represents a blueprint of a content item. */
    Blueprint: {
      /** @description The unique identifier (key) of the resource. */
      key?: string;
      /** @description The display name of this blueprint. */
      displayName: string;
      /** @description The content type of this blueprint. */
      readonly contentType: string;
      /**
       * Format: date-time
       * @description A timestamp indicating when this resource was first created.
       */
      readonly created?: string;
      /** @description The name of the user or application that created this resource. */
      readonly createdBy?: string;
      /**
       * Format: date-time
       * @description Indicates the last time this resource was modified.
       */
      readonly lastModified?: string;
      /** @description The name of the user or application that last modified this resource. */
      readonly lastModifiedBy?: string;
      content: components['schemas']['BlueprintData'];
    };
    /** @description Represents the data part of a Blueprint. */
    BlueprintData: components['schemas']['ContentData'] & {
      composition?: components['schemas']['CompositionNode'];
    };
    /** @description Represents a single page of items in a paged collection, including paging metadata such as the current page index, page size, and an estimated total item count. */
    BlueprintPage: {
      /** @description The items in this paged collection. */
      items?: components['schemas']['Blueprint'][];
      /**
       * Format: int32
       * @description The zero-based index of the current page.
       */
      readonly pageIndex?: number;
      /**
       * Format: int32
       * @description The number of items in each page. Not necessarily the same as the number of items in this page.
       */
      readonly pageSize?: number;
      /**
       * Format: int32
       * @description The estimated total number of items in the collection. May be omitted if the total count is unknown.
       */
      readonly totalCount?: number | null;
    };
    /** @description Defines display settings for a CompositionNode."/> */
    CompositionDisplaySettings: {
      /** @description The display template that these settings apply to. */
      displayTemplate: string;
      /** @description The display settings of this CompositionNode. */
      settings?: {
        [key: string]: string;
      } | null;
    };
    /** @description Specifies a node in a content composition. */
    CompositionNode: {
      /** @description Specifies an identifier of this CompositionNode. */
      id?: string;
      /** @description The display name of this ContentType. */
      displayName?: string;
      /** @description The node type of this CompositionNode. */
      nodeType: string;
      /** @description The node layout type of this CompositionNode */
      layoutType?: string;
      displaySettings?: components['schemas']['CompositionDisplaySettings'];
      /** @description Represents a content component. */
      component?: components['schemas']['ContentData'] & {
        /** @description An optional display option for the content component. */
        displayOption?: string;
        /** @description An optional group for the personalizable component. */
        segmentationGroup?: string;
        /** @description Specifies the settings for the content component. */
        segments?: string[] | null;
        /** @description The display name of the content component. If 'reference' is set, the name is automatically set to the name of the referenced content. */
        displayName?: string;
        /**
         * Format: uri
         * @description A reference to the content of this component. Cannot be assigned together with 'contentType' or 'properties'.
         */
        reference?: string | null;
        /** @description The key of the content type that this is an embedded instance of. */
        contentType?: string;
      };
      /** @description The child nodes for this CompositionNode. */
      nodes?: components['schemas']['CompositionNode'][] | null;
    };
    /** @description Associates a content item with another source content item, establishing a relationship defined by a content type binding. Used for linking managed content to external or reference content. */
    ContentBinding: {
      /** @description The binding definition key that controls how the source content item is linked and accessed. */
      contentTypeBinding?: string;
      /**
       * Format: uri
       * @description The reference to the source content item that is being bound. This cannot be empty.
       */
      source: string;
    };
    /** @description Represents a content component. */
    ContentComponent: components['schemas']['ContentData'] & {
      /** @description An optional display option for the content component. */
      displayOption?: string;
      /** @description An optional group for the personalizable component. */
      segmentationGroup?: string;
      /** @description Specifies the settings for the content component. */
      segments?: string[] | null;
      /** @description The display name of the content component. If 'reference' is set, the name is automatically set to the name of the referenced content. */
      displayName?: string;
      /**
       * Format: uri
       * @description A reference to the content of this component. Cannot be assigned together with 'contentType' or 'properties'.
       */
      reference?: string | null;
      /** @description The key of the content type that this is an embedded instance of. */
      contentType?: string;
    };
    /** @description Base structure for content data. Contains properties defined by the content type and optional bindings to source content. Property values must conform to the types defined in the associated ContentType definition. */
    ContentData: {
      binding?: components['schemas']['ContentBinding'];
      /** @description Properties as they are defined by corresponding component or content type. */
      properties?: {
        [key: string]: components['schemas']['PropertyData'];
      };
    };
    /** @description Metadata about a content item in the content hierarchy, including ownership, localization, and audit information. This represents the structural information without the actual property values. */
    ContentNode: {
      /** @description The unique identifier (key) of the resource. */
      key?: string;
      /** @description The content item that contains this item in the hierarchy. */
      container?: string;
      /** @description The content item that owns this item. Content that is owned by another content is also known as an asset. Cannot be combined with container. */
      owner?: string;
      /** @description The content type that defines the structure and available properties for this item. */
      readonly contentType?: string;
      /** @description The locale for which this content was originally created. This locale will include properties that are shared across all locales. */
      readonly primaryLocale?: string;
      /** @description The complete list of locales for which this content has been created for. */
      locales?: string[];
      /**
       * Format: date-time
       * @description The date and time when this content was last modified.
       */
      readonly lastModified?: string;
      /** @description The username of the user that last modified this content. */
      readonly lastModifiedBy?: string;
      /**
       * Format: date-time
       * @description The date and time when this content was first created.
       */
      readonly created?: string;
      /** @description The username of the user who created this content. */
      readonly createdBy?: string;
      /**
       * Format: date-time
       * @description If populated, the date and time when this content was deleted.
       */
      readonly deleted?: string | null;
      /** @description The username of the user who deleted this content. Only populated if the content is deleted. */
      readonly deletedBy?: string;
    };
    /** @description Represents a single page of items in a paged collection, including paging metadata such as the current page index, page size, and an estimated total item count. */
    ContentNodePage: {
      /** @description The items in this paged collection. */
      items?: components['schemas']['ContentNode'][];
      /**
       * Format: int32
       * @description The zero-based index of the current page.
       */
      readonly pageIndex?: number;
      /**
       * Format: int32
       * @description The number of items in each page. Not necessarily the same as the number of items in this page.
       */
      readonly pageSize?: number;
      /**
       * Format: int32
       * @description The estimated total number of items in the collection. May be omitted if the total count is unknown.
       */
      readonly totalCount?: number | null;
    };
    /** @description Describes a content source used within CMS. */
    ContentSource: {
      /** @description The unique identifier (key) of the resource. */
      key?: string;
      /** @description Specifies the type of source. For example 'graph' for a GraphQL content source. */
      type: string;
      /** @description The key of the source that this ContentSource relates to. */
      sourceKey: string;
      /** @description Specifies the source type of this source. */
      sourceType: string;
      /** @description The display name of this ContentSource. */
      displayName: string;
      /**
       * Format: date-time
       * @description A timestamp indicating when this resource was first created.
       */
      readonly created?: string;
      /** @description The name of the user or application that created this resource. */
      readonly createdBy?: string;
      /**
       * Format: date-time
       * @description Indicates the last time this resource was modified.
       */
      readonly lastModified?: string;
      /** @description The name of the user or application that last modified this resource. */
      readonly lastModifiedBy?: string;
      /**
       * @description Represents the base of the corresponding content type.
       * @enum {string}
       */
      baseType:
        | '_page'
        | '_component'
        | '_media'
        | '_image'
        | '_video'
        | '_folder'
        | '_experience'
        | '_section'
        | '_element';
      propertyMappings: components['schemas']['PropertyMappings'];
    };
    /** @description Represents a single page of items in a paged collection, including paging metadata such as the current page index, page size, and an estimated total item count. */
    ContentSourcePage: {
      /** @description The items in this paged collection. */
      items?: components['schemas']['ContentSource'][];
      /**
       * Format: int32
       * @description The zero-based index of the current page.
       */
      readonly pageIndex?: number;
      /**
       * Format: int32
       * @description The number of items in each page. Not necessarily the same as the number of items in this page.
       */
      readonly pageSize?: number;
      /**
       * Format: int32
       * @description The estimated total number of items in the collection. May be omitted if the total count is unknown.
       */
      readonly totalCount?: number | null;
    };
    /** @description A writable implementation of an ContentType. */
    ContentType: {
      /** @description The unique identifier (key) of the resource. */
      key?: string;
      /** @description The display name of this ContentType. */
      displayName: string;
      /** @description A description of this ContentType. */
      description?: string;
      /** @description The base type of this ContentType. Ignored for contracts; required for all other content types. */
      baseType?: string | null;
      /** @description Specifies if the ContentType is a contract type. */
      isContract?: boolean;
      /** @description A string that is used to indicate the source of this ContentType. */
      readonly source?: string;
      /**
       * Format: int32
       * @description A value that is used to when sorting ContentType instances.
       */
      sortOrder?: number;
      /** @description Provides a set of content types that can be created in containers of this type */
      mayContainTypes?: string[];
      /** @description Provides a set of media file extensions that this content type can handle. */
      mediaFileExtensions?: string[];
      /** @description Provides a set of composition behaviors specifying how this content type can be used within compositions. */
      compositionBehaviors?: ('sectionEnabled' | 'elementEnabled' | 'formsElementEnabled')[];
      /** @description Provides a set of contract content types that this content type is bound to. */
      contracts?: string[];
      /**
       * Format: date-time
       * @description A timestamp indicating when this resource was first created.
       */
      readonly created?: string;
      /** @description The name of the user or application that created this resource. */
      readonly createdBy?: string;
      /**
       * Format: date-time
       * @description Indicates the last time this resource was modified.
       */
      readonly lastModified?: string;
      /** @description The name of the user or application that last modified this resource. */
      readonly lastModifiedBy?: string;
      /** @description Dictionary with all custom properties of this ContentType. */
      properties?: {
        [key: string]: components['schemas']['ContentTypeProperty'];
      };
      /** @description The access rights assigned to this content type that defines who can create content of this type. If no access rights are assigned, everyone will be able to create content of this type. An empty array means that no new content of this type can be created. */
      accessRights?: components['schemas']['SecurityIdentity'][] | null;
    };
    /** @description Defines the binding between two content types. */
    ContentTypeBinding: {
      /** @description The unique identifier (key) of the resource. */
      key?: string;
      /** @description Specifies the key of the content type that this binding is from. */
      from: string;
      /** @description Specifies the key of the content type that this binding is to. */
      to: string;
      /**
       * Format: date-time
       * @description A timestamp indicating when this resource was first created.
       */
      readonly created?: string;
      /** @description The name of the user or application that created this resource. */
      readonly createdBy?: string;
      /**
       * Format: date-time
       * @description Indicates the last time this resource was modified.
       */
      readonly lastModified?: string;
      /** @description The name of the user or application that last modified this resource. */
      readonly lastModifiedBy?: string;
      /** @description Object map with all property mappings for this content type binding. */
      propertyMappings?: {
        [key: string]: components['schemas']['PropertyMapping'];
      };
    };
    /** @description Represents a single page of items in a paged collection, including paging metadata such as the current page index, page size, and an estimated total item count. */
    ContentTypeBindingPage: {
      /** @description The items in this paged collection. */
      items?: components['schemas']['ContentTypeBinding'][];
      /**
       * Format: int32
       * @description The zero-based index of the current page.
       */
      readonly pageIndex?: number;
      /**
       * Format: int32
       * @description The number of items in each page. Not necessarily the same as the number of items in this page.
       */
      readonly pageSize?: number;
      /**
       * Format: int32
       * @description The estimated total number of items in the collection. May be omitted if the total count is unknown.
       */
      readonly totalCount?: number | null;
    };
    /** @description Represents a single page of items in a paged collection, including paging metadata such as the current page index, page size, and an estimated total item count. */
    ContentTypePage: {
      /** @description The items in this paged collection. */
      items?: components['schemas']['ContentType'][];
      /**
       * Format: int32
       * @description The zero-based index of the current page.
       */
      readonly pageIndex?: number;
      /**
       * Format: int32
       * @description The number of items in each page. Not necessarily the same as the number of items in this page.
       */
      readonly pageSize?: number;
      /**
       * Format: int32
       * @description The estimated total number of items in the collection. May be omitted if the total count is unknown.
       */
      readonly totalCount?: number | null;
    };
    /** @description Defines a single property within a content type, including its data type, validation rules, and editorial metadata. */
    ContentTypeProperty: {
      /**
       * @description The fundamental data type of this property (e.g., string, integer, content reference).
       * @enum {string}
       */
      type:
        | 'string'
        | 'url'
        | 'boolean'
        | 'integer'
        | 'float'
        | 'dateTime'
        | 'contentReference'
        | 'content'
        | 'link'
        | 'richText'
        | 'json'
        | 'array'
        | 'component';
      /** @description The property format that defines specialized handling and validation for this property. */
      format?: string;
      /** @description The content type key that this property contains when the type is 'component'. */
      contentType?: string;
      /** @description The user-friendly name for this property, displayed in editorial interfaces. */
      displayName?: string;
      /** @description A description explaining the purpose and usage of this property for content editors. */
      description?: string;
      /** @description Whether the property value is translated separately for each locale or shared across all locales. */
      isLocalized?: boolean;
      /** @description Whether content items must always provide a value for this property before publication. */
      isRequired?: boolean;
      /** @description The property group this field belongs to for organizational purposes in the editor. Leave empty to allow automatic grouping. */
      group?: string;
      /**
       * Format: int32
       * @description The display order of this property within its group (lower numbers appear first).
       */
      sortOrder?: number;
      /**
       * @description Indicates how this property will be indexed in the search engine. If not explicitly set, the property will be indexed using the default indexing setting of the search engine.
       * @enum {string}
       */
      indexingType?: 'disabled' | 'queryable' | 'searchable';
      /**
       * @description Indicates how this property is displayed in the editing interface. If not explicitly set, the property will be available for editing.
       * @enum {string}
       */
      displayMode?: 'available' | 'hidden';
      /** @description The lowest value (inclusive) allowed for numeric or date properties. Type must match the property's data type. */
      minimum?: ((number | null) | (number | null) | (string | null) | (string | null)) | null;
      /** @description The highest value (inclusive) allowed for numeric or date properties. Type must match the property's data type. */
      maximum?: ((number | null) | (number | null) | (string | null) | (string | null)) | null;
      /** @description A predefined list of allowed values for this property. The enumeration values must match the property's data type. Allowed for string, integer, float and date-time property types. */
      enum?: components['schemas']['EnumerationValue'][] | null;
      /**
       * Format: int32
       * @description The minimum character length for string-type properties.
       */
      minLength?: number | null;
      /**
       * Format: int32
       * @description The maximum character length for string-type properties.
       */
      maxLength?: number | null;
      /**
       * Format: regex
       * @description Regular expression pattern that limits what value that a string type property must match.
       */
      pattern?: string;
      /**
       * Format: int32
       * @description The minimum number of items allowed in array-type properties.
       */
      minItems?: number | null;
      /**
       * Format: int32
       * @description The maximum number of items allowed in array-type properties.
       */
      maxItems?: number | null;
      /** @description Content types and base types that this property is permitted to contain. Used by properties of content or content reference type. */
      allowedTypes?: string[];
      /** @description Content types and base types that items in this property are forbidden from containing. Used by properties of content or content reference type. */
      restrictedTypes?: string[];
      /** @description Defines editor specific settings for this property. Editor settings are specific to the item and editor type. */
      editorSettings?: {
        [key: string]: unknown;
      } | null;
      items?: components['schemas']['ArrayItem'];
    };
    /** @description Represents a version of a content item. */
    ContentVersion: components['schemas']['ContentData'] & {
      /** @description The key that identifies this content version. */
      key?: string;
      /** @description The locale of this content version. */
      locale?: string;
      /** @description The version identifier of this instance. */
      version?: string;
      /** @description The variation of this content version, if any. Variations are used to represent different states or forms of the same content item. A variation has its own publishing lifecycle. A variation cannot be published before the default version of same locale has been published. */
      variation?: string;
      /** @description The content type of this content item. */
      contentType?: string;
      /** @description The display name of this content version. */
      displayName: string;
      /**
       * Format: date-time
       * @description Indicates a time when this content was published or should be published.
       */
      published?: string | null;
      /**
       * Format: date-time
       * @description Indicates a time when this content expired or should expire.
       */
      expired?: string | null;
      /**
       * @description The status of this content version.
       * @enum {string}
       */
      status?: 'draft' | 'ready' | 'published' | 'previous' | 'scheduled' | 'rejected' | 'inReview';
      /**
       * Format: date-time
       * @description The timestamp when a scheduled version will be published. Only present when status is 'scheduled'.
       */
      delayPublishUntil?: string | null;
      /** @description A string that represents the segment that should be used when routing or generate routes to the current content instance. */
      routeSegment?: string;
      /** @description A simple route (shortcut URL) used to access pages and experiences. */
      simpleRoute?: string;
      /** Format: date-time */
      lastModified?: string;
      lastModifiedBy?: string;
      composition?: components['schemas']['CompositionNode'];
      media?: components['schemas']['MediaData'];
    };
    /** @description Represents a single page of items in a paged collection, including paging metadata such as the current page index, page size, and an estimated total item count. */
    ContentVersionPage: {
      /** @description The items in this paged collection. */
      items?: components['schemas']['ContentVersion'][];
      /**
       * Format: int32
       * @description The zero-based index of the current page.
       */
      readonly pageIndex?: number;
      /**
       * Format: int32
       * @description The number of items in each page. Not necessarily the same as the number of items in this page.
       */
      readonly pageSize?: number;
      /**
       * Format: int32
       * @description The estimated total number of items in the collection. May be omitted if the total count is unknown.
       */
      readonly totalCount?: number | null;
    };
    /** @description Options for copying content. */
    CopyContentOptions: {
      /** @description Indicates if deleted content could be used as source. */
      allowDeleted?: boolean;
      /** @description Optional key of the container where the copied content should be placed. */
      container?: string | null;
      /** @description Optional key of the owner where the copied content should be placed. */
      owner?: string | null;
    };
    /** @description Describes a setting for a display template. */
    DisplaySetting: {
      /** @description The display name of this display setting. */
      displayName: string;
      /** @description The suggested editor for this display setting. */
      editor?: string;
      /**
       * Format: int32
       * @description The sort order of this display setting within the template.
       */
      sortOrder?: number;
      /** @description The available choices for this display setting. */
      choices?: {
        [key: string]: components['schemas']['DisplaySettingChoice'];
      };
    };
    /** @description Describes a setting for a display template. */
    DisplaySettingChoice: {
      /** @description The display name of this display setting choice. */
      displayName: string;
      /**
       * Format: int32
       * @description The sort order of this choice within the setting.
       */
      sortOrder?: number;
    };
    /** @description Describes a display template that can be assigned to content. */
    DisplayTemplate: {
      /** @description The unique identifier (key) of the resource. */
      key?: string;
      /** @description The display name of this display template. */
      displayName: string;
      /** @description The optional node type this display template is valid for. */
      nodeType?: string;
      /** @description The optional base type this display template is valid for. */
      baseType?: string | null;
      /** @description The optional key of the content type this display template is valid for. */
      contentType?: string;
      /** @description If this is the default display template for the associated base type, node type or content type. */
      isDefault?: boolean;
      /**
       * Format: date-time
       * @description A timestamp indicating when this display template was first created.
       */
      readonly created?: string;
      /** @description The username of the user that created this display template. */
      readonly createdBy?: string;
      /**
       * Format: date-time
       * @description A timestamp indicating when this display template was last modified.
       */
      readonly lastModified?: string;
      /** @description The username of the user that last modified this display template. */
      readonly lastModifiedBy?: string;
      /** @description The available settings for this display template. */
      settings?: {
        [key: string]: components['schemas']['DisplaySetting'];
      };
    };
    /** @description Represents a single page of items in a paged collection, including paging metadata such as the current page index, page size, and an estimated total item count. */
    DisplayTemplatePage: {
      /** @description The items in this paged collection. */
      items?: components['schemas']['DisplayTemplate'][];
      /**
       * Format: int32
       * @description The zero-based index of the current page.
       */
      readonly pageIndex?: number;
      /**
       * Format: int32
       * @description The number of items in each page. Not necessarily the same as the number of items in this page.
       */
      readonly pageSize?: number;
      /**
       * Format: int32
       * @description The estimated total number of items in the collection. May be omitted if the total count is unknown.
       */
      readonly totalCount?: number | null;
    };
    /** @description Describes one value in an enumeration of possible values. */
    EnumerationValue: {
      /** @description The defined enumeration value. Value type must match the property type. */
      value: (number | null) | (number | null) | (string | null) | (string | null);
      /** @description The display name of the enumeration value. */
      displayName: string;
    };
    /** @description Represents a HTML hyperlink with URL, display text, and optional rendering properties. */
    Link: {
      /**
       * Format: uri
       * @description The URL that the link points to.
       */
      url?: string | null;
      /** @description Specifies how the URL should be displayed in the browsing context (e.g., '_blank' for new window, '_self' for current window). */
      target?: string;
      /** @description The title text or tooltip displayed when hovering over the link. */
      title?: string;
      /** @description The visible text or label displayed to users for this link. */
      text?: string;
      /** @description Additional attributes associated with the link. */
      attributes?: {
        [key: string]: string;
      };
    };
    /** @description Represents a locale that can be used for content. */
    Locale: {
      /** @description The unique identifier (key) of the resource. This is the IETF BCP-47 language tag (e.g., "en", "en-US", "sv-SE"). */
      key: string;
      /** @description The display name of this locale. */
      displayName: string;
      /** @description Indicates whether this locale is enabled and can be used to create content. */
      isEnabled?: boolean;
      /** @description A string that represents the segment that should be used when routing or generate routes to the current locale */
      routeSegment: string;
      /**
       * Format: int32
       * @description A value that is used when sorting locales.
       */
      sortOrder?: number;
      /** @description The access rights assigned to this locale that defines who can create content in this locale. If no access rights are assigned, everyone will be able to create content in this locale. An empty array means that no user will be allowed to create or change content in this locale. */
      accessRights?: components['schemas']['SecurityIdentity'][] | null;
      /**
       * Format: date-time
       * @description A timestamp indicating when this locale was first created.
       */
      readonly created?: string;
      /** @description The username of the user that created this locale. */
      readonly createdBy?: string;
      /** Format: date-time */
      readonly lastModified?: string;
      /** @description The username of the user that last modified this locale. */
      readonly lastModifiedBy?: string;
    };
    /** @description Represents a single page of items in a paged collection, including paging metadata such as the current page index, page size, and an estimated total item count. */
    LocalePage: {
      /** @description The items in this paged collection. */
      items?: components['schemas']['Locale'][];
      /**
       * Format: int32
       * @description The zero-based index of the current page.
       */
      readonly pageIndex?: number;
      /**
       * Format: int32
       * @description The number of items in each page. Not necessarily the same as the number of items in this page.
       */
      readonly pageSize?: number;
      /**
       * Format: int32
       * @description The estimated total number of items in the collection. May be omitted if the total count is unknown.
       */
      readonly totalCount?: number | null;
    };
    /** @description Manifest that describes CMS definitions. */
    Manifest: {
      /** @description List of locales that are part of this manifest. */
      locales?: components['schemas']['Locale'][] | null;
      /** @description List of content type property groups that are part of this manifest. */
      propertyGroups?: components['schemas']['PropertyGroup'][] | null;
      /** @description List of content types that are part of this manifest. */
      contentTypes?: components['schemas']['ContentType'][] | null;
      /** @description List of display templates that are part of this manifest. */
      displayTemplates?: components['schemas']['DisplayTemplate'][] | null;
      /**
       * Format: date-time
       * @description A timestamp indicating the last time an item included in this manifest was modified.
       */
      lastModified?: string;
    };
    /** @description Describes a message from a manifest importing operation. */
    ManifestImportMessage: {
      /** @description The section where the message originated from. */
      section?: string;
      /** @description The message describing an outcome or error. */
      message?: string;
      /** @description The identifier of the resource that was the reason for this message to be created. */
      resource?: string | null;
    };
    /** @description The result of a manifest import operation. */
    ManifestImportResult: {
      /** @description List of messages describing the outcome from the manifest import. */
      readonly outcomes?: components['schemas']['ManifestImportMessage'][];
      /** @description List of error messages from the manifest import. */
      readonly errors?: components['schemas']['ManifestImportMessage'][];
    };
    /** @description Represents media data attached to a content item. */
    MediaData: {
      /** @description The key referencing the media. */
      key?: string;
    };
    /** @description Represents a new content and the initial data required to create it. */
    NewContent: {
      /** @description The key that identifies the content item to be created. If not provided, a new key will be generated. */
      key?: string;
      /** @description The content type for the content item to be created. */
      contentType: string;
      /** @description The key that identifies the container content where this content item should be created. */
      container?: string;
      /** @description The key that identifies the owner for the content item to be created. Content that is owned by another content is also known as an asset. */
      owner?: string;
      initialVersion: components['schemas']['ContentVersion'];
    };
    /** @description Represents the result of creating a new content item. */
    NewContentNode: components['schemas']['ContentNode'] & {
      initialVersion?: components['schemas']['ContentVersion'];
    };
    ProblemDetails: {
      /**
       * Format: uri
       * @description A URI reference that identifies the problem type.
       */
      type?: string | null;
      /** @description A short, human-readable summary of the problem type. */
      title?: string | null;
      /**
       * Format: int32
       * @description The HTTP status code generated by the origin server for this occurrence of the problem.
       */
      status?: number | null;
      /** @description A human-readable explanation specific to this occurrence of the problem. */
      detail?: string | null;
      /**
       * Format: uri
       * @description A URI reference that identifies the specific occurrence of the problem. It may or may not yield further information if dereferenced.
       */
      instance?: string | null;
      /** @description Error code that identifies the problem type. */
      code?: string | null;
      /** @description An array of error details with more detailed information about the problem. */
      errors?:
        | {
            /** @description A granular explanation of one specific error related to a field, header or query parameter. */
            detail?: string;
            /**
             * @description A string that may provide a hint to which field that was the source of the error.
             * @example properties.header.displayName
             */
            field?: string | null;
          }[]
        | null;
    } & {
      [key: string]: unknown;
    };
    /** @description A single property value for a content item. The value's type and format are determined by the property definition in the content type schema. */
    PropertyData: {
      /** @description The property value, which can be a string, number, boolean, object, array, or null depending on the property type defined in the content type. */
      value?: unknown;
    };
    /** @description Represent the definition of semantic property formats for content items. */
    PropertyFormat: {
      /** @description The unique identifier (key) of the resource. */
      key?: string;
      /**
       * @description The underlying data type used for this PropertyFormat.
       * @enum {string}
       */
      dataType?:
        | 'string'
        | 'url'
        | 'boolean'
        | 'integer'
        | 'float'
        | 'dateTime'
        | 'contentReference'
        | 'content'
        | 'link'
        | 'richText'
        | 'json'
        | 'array'
        | 'component';
      /**
       * @description The underlying item type used for this PropertyFormat.
       * @enum {string}
       */
      readonly itemType?:
        | 'string'
        | 'url'
        | 'boolean'
        | 'integer'
        | 'float'
        | 'dateTime'
        | 'contentReference'
        | 'content'
        | 'link'
        | 'richText'
        | 'json'
        | 'array'
        | 'component';
      /** @description The display name of this PropertyFormat. */
      displayName?: string;
      /** @description Indicates if this property format has been deleted. */
      readonly isDeleted?: boolean;
      /**
       * Format: date-time
       * @description A timestamp indicating when this display template was first created.
       */
      readonly created?: string;
      /** @description The username of the user that created this display template. */
      readonly createdBy?: string;
      /**
       * Format: date-time
       * @description A timestamp indicating when this display template was last modified.
       */
      readonly lastModified?: string;
      /** @description The username of the user that last modified this display template. */
      readonly lastModifiedBy?: string;
    };
    /** @description Represents a single page of items in a paged collection, including paging metadata such as the current page index, page size, and an estimated total item count. */
    PropertyFormatPage: {
      /** @description The items in this paged collection. */
      items?: components['schemas']['PropertyFormat'][];
      /**
       * Format: int32
       * @description The zero-based index of the current page.
       */
      readonly pageIndex?: number;
      /**
       * Format: int32
       * @description The number of items in each page. Not necessarily the same as the number of items in this page.
       */
      readonly pageSize?: number;
      /**
       * Format: int32
       * @description The estimated total number of items in the collection. May be omitted if the total count is unknown.
       */
      readonly totalCount?: number | null;
    };
    /** @description Describes a property group of a ContentType in the CMS. */
    PropertyGroup: {
      /** @description The unique identifier (key) of the resource. */
      key: string;
      /** @description The display name of this PropertyGroup. */
      displayName: string;
      /** @description A string that is used to indicate the source of this PropertyGroup. */
      readonly source?: string;
      /**
       * Format: int32
       * @description An value that is used to when sorting PropertyGroup instances.
       */
      sortOrder?: number;
      /**
       * Format: date-time
       * @description A timestamp indicating when this property group was first created.
       */
      readonly created?: string;
      /** @description The username of the user that created this property group. */
      readonly createdBy?: string;
      /** Format: date-time */
      readonly lastModified?: string;
      /** @description The username of the user that last modified this property group. */
      readonly lastModifiedBy?: string;
    };
    /** @description Represents a single page of items in a paged collection, including paging metadata such as the current page index, page size, and an estimated total item count. */
    PropertyGroupPage: {
      /** @description The items in this paged collection. */
      items?: components['schemas']['PropertyGroup'][];
      /**
       * Format: int32
       * @description The zero-based index of the current page.
       */
      readonly pageIndex?: number;
      /**
       * Format: int32
       * @description The number of items in each page. Not necessarily the same as the number of items in this page.
       */
      readonly pageSize?: number;
      /**
       * Format: int32
       * @description The estimated total number of items in the collection. May be omitted if the total count is unknown.
       */
      readonly totalCount?: number | null;
    };
    /** @description Specifies the binding for a property. */
    PropertyMapping: {
      /** @description Specifies the path to the property on the corresponding content type to bind from. */
      from: string;
      /** @description Optional binding key that can be used to specify that an already existing binding should be used to map content properties. */
      binding?: string;
    };
    /** @description Represents a mapping between a property in an external source and its corresponding property in the CMS. Used to define how external properties are mapped to CMS property identifiers and names. */
    PropertyMappings: {
      /** @description The key to use for the item in the source. Required if the SourceType is not of type '_Item'. */
      key?: string;
      /** @description The key to use for the item in cms. Required if the SourceType is not of type '_Item'. */
      displayName?: string;
      /** @description Specifies the format of the source identifier key. */
      keyFormat?: string | null;
    };
    /** @description Options for publishing a content version. */
    PublishContentOptions: {
      /**
       * Format: date-time
       * @description Gets or sets the date and time at which the content should be published, sets the version into 'scheduled' state if a future date is specified.
       */
      delayUntil?: string | null;
      /** @description Indicates if validations such as approvals and required properties should be bypassed, requires 'admin' access rights. */
      force?: boolean;
    };
    /** @description Options for transitioning a content version to ready status. */
    ReadyContentOptions: {
      /** @description An optional comment to include when starting the approval process. May be required depending on the approval definition configuration. */
      comment?: string | null;
    };
    /** @description Identifies a user, role or application that can be assigned access associated with a resource. */
    SecurityIdentity: {
      /** @description The unique name of the user, role or application that this identifier references. */
      name: string;
      /**
       * @description The type of the security entity that this identifier references. Will default to 'role' if not specified.
       * @enum {string}
       */
      type?: 'user' | 'role' | 'application';
    };
  };
  responses: {
    /** @description Bad Request */
    BadRequest: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/problem+json': components['schemas']['ProblemDetails'];
      };
    };
    /** @description Unauthorized */
    Unauthorized: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/problem+json': components['schemas']['ProblemDetails'];
      };
    };
    /** @description Forbidden */
    Forbidden: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/problem+json': components['schemas']['ProblemDetails'];
      };
    };
    /** @description Not Found */
    NotFound: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/problem+json': components['schemas']['ProblemDetails'];
      };
    };
    /** @description Conflict */
    Conflict: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/problem+json': components['schemas']['ProblemDetails'];
      };
    };
    /** @description Too Many Requests */
    TooManyRequests: {
      headers: {
        /** @description Indicates how long the client should wait before making a new request. */
        'Retry-After'?: number;
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['ProblemDetails'];
      };
    };
    /** @description Internal Server Error */
    InternalServerError: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/problem+json': components['schemas']['ProblemDetails'];
      };
    };
    /** @description Precondition Failed */
    PreconditionFailed: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/problem+json': components['schemas']['ProblemDetails'];
      };
    };
  };
  parameters: {
    /**
     * @description Indicates which content validation rules should be bypassed. Use with caution as this may allow creation of invalid content that could cause issues in production. Accepts '*' to bypass all validation rules, or a comma-separated list of specific validations to skip: 'data' (skip data validation such as required fields), 'references' (skip reference validation such as checking if referenced content exists). Examples: '*', 'data', 'data,references'
     * @example data,references
     */
    SkipValidation: ('*' | 'data' | 'references')[];
    /**
     * @description Indicates which content source validation rules should be bypassed. Provide a comma-separated list of rule identifiers (for example, 'references' to skip reference validation, such as checking whether a referenced content type exists or is a valid type). If this header is omitted or empty, all validation rules are applied.
     * @example references
     */
    SkipContentSourceValidation: 'references'[];
  };
  requestBodies: never;
  headers: never;
  pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
  Blueprints_List: {
    parameters: {
      query?: {
        /** @description Zero based index of the page that should be retrieved. */
        pageIndex?: number;
        /** @description The maximum items per page that should be retrieved. */
        pageSize?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['BlueprintPage'];
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Blueprints_Create: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** @description The blueprint that should be created. */
    requestBody: {
      content: {
        'application/json': components['schemas']['Blueprint'];
      };
    };
    responses: {
      /** @description Created */
      201: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          /** @description Indicates the URL of the newly-created resource. */
          Location?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Blueprint'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Blueprints_Get: {
    parameters: {
      query?: never;
      header?: {
        /** @description If provided and the value matches the RFC7232 ETag of the current resource a 304 NotModified response will be returned. Weak ETags will always be ignored. */
        'If-None-Match'?: string;
        /** @description If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided. */
        'If-Modified-Since'?: string;
      };
      path: {
        /** @description The key of the blueprint to retrieve. */
        key: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Blueprint'];
        };
      };
      /** @description Not Modified */
      304: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Blueprints_Delete: {
    parameters: {
      query?: never;
      header?: {
        /** @description If provided, the DELETE request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
        'If-Match'?: string;
        /** @description If provided, the DELETE request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
        'If-Unmodified-Since'?: string;
      };
      path: {
        /** @description The key of the blueprint to delete. */
        key: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Blueprint'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      412: components['responses']['PreconditionFailed'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Blueprints_Patch: {
    parameters: {
      query?: never;
      header?: {
        /** @description If provided, the PATCH request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
        'If-Match'?: string;
        /** @description If provided, the PATCH request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
        'If-Unmodified-Since'?: string;
      };
      path: {
        /** @description The key of the blueprint to patch. */
        key: string;
      };
      cookie?: never;
    };
    /** @description The values of the blueprint that should be patched formatted according to RFC7396. */
    requestBody: {
      content: {
        'application/merge-patch+json': components['schemas']['Blueprint'];
      };
    };
    responses: {
      /** @description OK */
      200: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Blueprint'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      412: components['responses']['PreconditionFailed'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Content_Create: {
    parameters: {
      query?: never;
      header?: {
        /**
         * @description Indicates which content validation rules should be bypassed. Use with caution as this may allow creation of invalid content that could cause issues in production. Accepts '*' to bypass all validation rules, or a comma-separated list of specific validations to skip: 'data' (skip data validation such as required fields), 'references' (skip reference validation such as checking if referenced content exists). Examples: '*', 'data', 'data,references'
         * @example data,references
         */
        'cms-skip-validation'?: components['parameters']['SkipValidation'];
      };
      path?: never;
      cookie?: never;
    };
    /** @description The content item that should be created. */
    requestBody: {
      content: {
        'application/json': components['schemas']['NewContent'];
        'multipart/form-data': {
          content: components['schemas']['NewContent'];
          /**
           * Format: binary
           * @description The media file to upload.
           */
          file: string;
        };
      };
    };
    responses: {
      /** @description Created */
      201: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          /** @description Indicates the URL of the newly-created resource. */
          Location?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['NewContentNode'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Content_Copy: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description The key of the content item to copy. */
        key: string;
      };
      cookie?: never;
    };
    /** @description Optional instructions for how to copy content. */
    requestBody?: {
      content: {
        'application/json': components['schemas']['CopyContentOptions'];
      };
    };
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentNode'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Content_Undelete: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description The key of the content item to undelete. */
        key: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentNode'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Content_GetNode: {
    parameters: {
      query?: never;
      header?: {
        /** @description Indicates that metadata for a deleted content may be returned. */
        'cms-allow-deleted'?: boolean;
        /** @description If provided and the value matches the RFC7232 ETag of the current resource a 304 NotModified response will be returned. Weak ETags will always be ignored. */
        'If-None-Match'?: string;
        /** @description If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided. */
        'If-Modified-Since'?: string;
      };
      path: {
        /** @description The key of the content to retrieve the node for. */
        key: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentNode'];
        };
      };
      /** @description Not Modified */
      304: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Content_Delete: {
    parameters: {
      query?: never;
      header?: {
        /** @description Indicates that the content item should be permanently deleted immediately or if it should be soft deleted first. */
        'cms-permanent-delete'?: boolean;
        /** @description If provided, the DELETE request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
        'If-Match'?: string;
        /** @description If provided, the DELETE request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
        'If-Unmodified-Since'?: string;
      };
      path: {
        /** @description The key of the content item to delete. */
        key: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentNode'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      412: components['responses']['PreconditionFailed'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Content_PatchNode: {
    parameters: {
      query?: never;
      header?: {
        /** @description If provided, the PATCH request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
        'If-Match'?: string;
        /** @description If provided, the PATCH request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
        'If-Unmodified-Since'?: string;
      };
      path: {
        /** @description The key of the content item to patch. */
        key: string;
      };
      cookie?: never;
    };
    /** @description The values of the content item that should be patched. */
    requestBody: {
      content: {
        'application/merge-patch+json': components['schemas']['ContentNode'];
      };
    };
    responses: {
      /** @description OK */
      200: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentNode'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      412: components['responses']['PreconditionFailed'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Content_ListAssets: {
    parameters: {
      query?: {
        /** @description Indicates which content types or base types to include in the list. */
        contentTypes?: string[];
        /** @description Zero based index of the page that should be retrieved. */
        pageIndex?: number;
        /** @description The maximum items per page that should be retrieved. */
        pageSize?: number;
      };
      header?: never;
      path: {
        /** @description The key of the content to retrieve assets for. */
        key: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentNodePage'];
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Content_ListItems: {
    parameters: {
      query?: {
        /** @description Indicates which content types or base types to include in the list. */
        contentTypes?: string[];
        /** @description Zero based index of the page that should be retrieved. */
        pageIndex?: number;
        /** @description The maximum items per page that should be retrieved. */
        pageSize?: number;
      };
      header?: never;
      path: {
        /** @description The key of the content to retrieve items for. */
        key: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentNodePage'];
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Content_ListLocaleVersions: {
    parameters: {
      query?: {
        /** @description Zero based index of the page that should be retrieved. */
        pageIndex?: number;
        /** @description The maximum items per page that should be retrieved. */
        pageSize?: number;
      };
      header?: never;
      path: {
        /** @description The key of the content item for which versions should be listed. */
        key: string;
        /** @description The locale of the content item for which versions should be listed. */
        locale: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentVersionPage'];
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Content_DeleteLocale: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description The key of the content item that should be deleted. */
        key: string;
        /** @description The locale that should be deleted for the content item. */
        locale: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentVersion'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Content_GetPath: {
    parameters: {
      query?: {
        /** @description Zero based index of the page that should be retrieved. */
        pageIndex?: number;
        /** @description The maximum items per page that should be retrieved. */
        pageSize?: number;
      };
      header?: never;
      path: {
        /** @description The key of the content path to retrieve. */
        key: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentNodePage'];
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Content_ListVersions: {
    parameters: {
      query?: {
        /** @description Optional list of locales that should be included. Locale must be a valid IETF BCP-47 language tag. Use 'NEUTRAL' to include locale-neutral content. */
        locales?: string[];
        /** @description Optional list of status values that versions must have one of to be included. */
        statuses?: ('draft' | 'ready' | 'published' | 'previous' | 'scheduled' | 'rejected' | 'inReview')[];
        /** @description Zero based index of the page that should be retrieved. */
        pageIndex?: number;
        /** @description The maximum items per page that should be retrieved. */
        pageSize?: number;
      };
      header?: never;
      path: {
        /** @description The key of the content item for which versions should be listed. */
        key: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentVersionPage'];
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Content_CreateVersion: {
    parameters: {
      query?: never;
      header?: {
        /**
         * @description Indicates which content validation rules should be bypassed. Use with caution as this may allow creation of invalid content that could cause issues in production. Accepts '*' to bypass all validation rules, or a comma-separated list of specific validations to skip: 'data' (skip data validation such as required fields), 'references' (skip reference validation such as checking if referenced content exists). Examples: '*', 'data', 'data,references'
         * @example data,references
         */
        'cms-skip-validation'?: components['parameters']['SkipValidation'];
      };
      path: {
        /** @description The key of the content item for which a new content version should be created. */
        key: string;
      };
      cookie?: never;
    };
    /** @description The content version that should be created. */
    requestBody: {
      content: {
        'application/json': components['schemas']['ContentVersion'];
        'multipart/form-data': {
          content: components['schemas']['ContentVersion'];
          /**
           * Format: binary
           * @description The media file to upload.
           */
          file: string;
        };
      };
    };
    responses: {
      /** @description Created */
      201: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          /** @description Indicates the URL of the newly-created resource. */
          Location?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentVersion'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Content_Approve: {
    parameters: {
      query?: never;
      header?: {
        /** @description If provided, the POST request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
        'If-Match'?: string;
        /** @description If provided, the POST request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
        'If-Unmodified-Since'?: string;
      };
      path: {
        /** @description The key of the content item. */
        key: string;
        /** @description The version of the content item. */
        version: string;
      };
      cookie?: never;
    };
    /** @description Options for the approval decision. Use 'force' to bypass the normal approval flow (requires admin access). */
    requestBody?: {
      content: {
        'application/json': components['schemas']['ApprovalDecisionOptions'];
      };
    };
    responses: {
      /** @description OK */
      200: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentVersion'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      412: components['responses']['PreconditionFailed'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Content_Draft: {
    parameters: {
      query?: never;
      header?: {
        /** @description If provided, the POST request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
        'If-Match'?: string;
        /** @description If provided, the POST request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
        'If-Unmodified-Since'?: string;
      };
      path: {
        /** @description The key of the content item. */
        key: string;
        /** @description The version of the content item. */
        version: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentVersion'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      412: components['responses']['PreconditionFailed'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Content_Publish: {
    parameters: {
      query?: never;
      header?: {
        /** @description If provided, the POST request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
        'If-Match'?: string;
        /** @description If provided, the POST request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
        'If-Unmodified-Since'?: string;
      };
      path: {
        /** @description The key of the content item to publish. */
        key: string;
        /** @description The version of the content item to publish. */
        version: string;
      };
      cookie?: never;
    };
    /** @description Optional instructions for how to publish content. */
    requestBody?: {
      content: {
        'application/json': components['schemas']['PublishContentOptions'];
      };
    };
    responses: {
      /** @description OK */
      200: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentVersion'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      412: components['responses']['PreconditionFailed'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Content_Ready: {
    parameters: {
      query?: never;
      header?: {
        /** @description If provided, the POST request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
        'If-Match'?: string;
        /** @description If provided, the POST request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
        'If-Unmodified-Since'?: string;
      };
      path: {
        /** @description The key of the content item. */
        key: string;
        /** @description The version of the content item. */
        version: string;
      };
      cookie?: never;
    };
    /** @description Optional instructions such as a comment for the approval. */
    requestBody?: {
      content: {
        'application/json': components['schemas']['ReadyContentOptions'];
      };
    };
    responses: {
      /** @description OK */
      200: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentVersion'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      412: components['responses']['PreconditionFailed'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Content_Reject: {
    parameters: {
      query?: never;
      header?: {
        /** @description If provided, the POST request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
        'If-Match'?: string;
        /** @description If provided, the POST request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
        'If-Unmodified-Since'?: string;
      };
      path: {
        /** @description The key of the content item. */
        key: string;
        /** @description The version of the content item. */
        version: string;
      };
      cookie?: never;
    };
    /** @description Options for the rejection decision. Use 'force' to bypass the normal approval flow (requires admin access). */
    requestBody?: {
      content: {
        'application/json': components['schemas']['ApprovalDecisionOptions'];
      };
    };
    responses: {
      /** @description OK */
      200: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentVersion'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      412: components['responses']['PreconditionFailed'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Content_GetVersion: {
    parameters: {
      query?: never;
      header?: {
        /** @description If provided and the value matches the RFC7232 ETag of the current resource a 304 NotModified response will be returned. Weak ETags will always be ignored. */
        'If-None-Match'?: string;
        /** @description If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided. */
        'If-Modified-Since'?: string;
      };
      path: {
        key: string;
        version: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentVersion'];
        };
      };
      /** @description Not Modified */
      304: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Content_DeleteVersion: {
    parameters: {
      query?: never;
      header?: {
        /** @description If provided, the DELETE request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
        'If-Match'?: string;
        /** @description If provided, the DELETE request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
        'If-Unmodified-Since'?: string;
      };
      path: {
        /** @description The key of the content item that should be deleted. */
        key: string;
        /** @description The version of the content item that should be deleted. */
        version: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentVersion'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      412: components['responses']['PreconditionFailed'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Content_PatchVersion: {
    parameters: {
      query?: never;
      header?: {
        /**
         * @description Indicates which content validation rules should be bypassed. Use with caution as this may allow creation of invalid content that could cause issues in production. Accepts '*' to bypass all validation rules, or a comma-separated list of specific validations to skip: 'data' (skip data validation such as required fields), 'references' (skip reference validation such as checking if referenced content exists). Examples: '*', 'data', 'data,references'
         * @example data,references
         */
        'cms-skip-validation'?: components['parameters']['SkipValidation'];
        /** @description If provided, the PATCH request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
        'If-Match'?: string;
        /** @description If provided, the PATCH request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
        'If-Unmodified-Since'?: string;
      };
      path: {
        /** @description The key of the content item that should be patched. */
        key: string;
        /** @description The version of the content item that should be patched. */
        version: string;
      };
      cookie?: never;
    };
    /** @description The content information that should be patched. */
    requestBody: {
      content: {
        'application/merge-patch+json': components['schemas']['ContentVersion'];
      };
    };
    responses: {
      /** @description OK */
      200: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentVersion'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      412: components['responses']['PreconditionFailed'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Content_GetMedia: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description The key of the content item. */
        key: string;
        /** @description The version of the content item. */
        version: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Content_ListAllVersions: {
    parameters: {
      query?: {
        /** @description Optional list of locales that should be included. Locale must be a valid IETF BCP-47 language tag. Use 'NEUTRAL' to include locale-neutral content. */
        locales?: string[];
        /** @description Optional list of status values that versions must have one of to be included. */
        statuses?: ('draft' | 'ready' | 'published' | 'previous' | 'scheduled' | 'rejected' | 'inReview')[];
        /** @description Zero based index of the page that should be retrieved. */
        pageIndex?: number;
        /** @description The maximum items per page that should be retrieved. */
        pageSize?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentVersionPage'];
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  ContentSources_List: {
    parameters: {
      query?: {
        /** @description Zero based index of the page that should be retrieved. */
        pageIndex?: number;
        /** @description The maximum items per page that should be retrieved. */
        pageSize?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentSourcePage'];
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  ContentSources_Create: {
    parameters: {
      query?: never;
      header?: {
        /**
         * @description Indicates which content source validation rules should be bypassed. Provide a comma-separated list of rule identifiers (for example, 'references' to skip reference validation, such as checking whether a referenced content type exists or is a valid type). If this header is omitted or empty, all validation rules are applied.
         * @example references
         */
        'cms-skip-content-source-validation'?: components['parameters']['SkipContentSourceValidation'];
      };
      path?: never;
      cookie?: never;
    };
    /** @description The contentsource that should be created. */
    requestBody: {
      content: {
        'application/json': components['schemas']['ContentSource'];
      };
    };
    responses: {
      /** @description Created */
      201: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          /** @description Indicates the URL of the newly-created resource. */
          Location?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentSource'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  ContentSources_Get: {
    parameters: {
      query?: never;
      header?: {
        /** @description If provided and the value matches the RFC7232 ETag of the current resource a 304 NotModified response will be returned. Weak ETags will always be ignored. */
        'If-None-Match'?: string;
        /** @description If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided. */
        'If-Modified-Since'?: string;
      };
      path: {
        /** @description The key of the contentsource to retrieve. */
        key: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentSource'];
        };
      };
      /** @description Not Modified */
      304: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  ContentSources_Delete: {
    parameters: {
      query?: never;
      header?: {
        /** @description If provided, the DELETE request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
        'If-Match'?: string;
        /** @description If provided, the DELETE request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
        'If-Unmodified-Since'?: string;
      };
      path: {
        /** @description The key of the contentsource to delete. */
        key: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentSource'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      412: components['responses']['PreconditionFailed'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  ContentSources_Patch: {
    parameters: {
      query?: never;
      header?: {
        /**
         * @description Indicates which content source validation rules should be bypassed. Provide a comma-separated list of rule identifiers (for example, 'references' to skip reference validation, such as checking whether a referenced content type exists or is a valid type). If this header is omitted or empty, all validation rules are applied.
         * @example references
         */
        'cms-skip-content-source-validation'?: components['parameters']['SkipContentSourceValidation'];
        /** @description If provided, the PATCH request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
        'If-Match'?: string;
        /** @description If provided, the PATCH request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
        'If-Unmodified-Since'?: string;
      };
      path: {
        /** @description The key of the contentsource to patch. */
        key: string;
      };
      cookie?: never;
    };
    /** @description The values of the contentsource that should be patched formatted according to RFC7396. */
    requestBody: {
      content: {
        'application/merge-patch+json': components['schemas']['ContentSource'];
      };
    };
    responses: {
      /** @description OK */
      200: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentSource'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      412: components['responses']['PreconditionFailed'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  ContentTypeBindings_List: {
    parameters: {
      query?: {
        /** @description Zero based index of the page that should be retrieved. */
        pageIndex?: number;
        /** @description The maximum items per page that should be retrieved. */
        pageSize?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentTypeBindingPage'];
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  ContentTypeBindings_Create: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** @description The contenttypebinding that should be created. */
    requestBody: {
      content: {
        'application/json': components['schemas']['ContentTypeBinding'];
      };
    };
    responses: {
      /** @description Created */
      201: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          /** @description Indicates the URL of the newly-created resource. */
          Location?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentTypeBinding'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  ContentTypeBindings_Get: {
    parameters: {
      query?: never;
      header?: {
        /** @description If provided and the value matches the RFC7232 ETag of the current resource a 304 NotModified response will be returned. Weak ETags will always be ignored. */
        'If-None-Match'?: string;
        /** @description If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided. */
        'If-Modified-Since'?: string;
      };
      path: {
        /** @description The key of the contenttypebinding to retrieve. */
        key: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentTypeBinding'];
        };
      };
      /** @description Not Modified */
      304: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  ContentTypeBindings_Delete: {
    parameters: {
      query?: never;
      header?: {
        /** @description If provided, the DELETE request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
        'If-Match'?: string;
        /** @description If provided, the DELETE request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
        'If-Unmodified-Since'?: string;
      };
      path: {
        /** @description The key of the contenttypebinding to delete. */
        key: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentTypeBinding'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      412: components['responses']['PreconditionFailed'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  ContentTypeBindings_Patch: {
    parameters: {
      query?: never;
      header?: {
        /** @description If provided, the PATCH request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
        'If-Match'?: string;
        /** @description If provided, the PATCH request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
        'If-Unmodified-Since'?: string;
      };
      path: {
        /** @description The key of the contenttypebinding to patch. */
        key: string;
      };
      cookie?: never;
    };
    /** @description The values of the contenttypebinding that should be patched formatted according to RFC7396. */
    requestBody: {
      content: {
        'application/merge-patch+json': components['schemas']['ContentTypeBinding'];
      };
    };
    responses: {
      /** @description OK */
      200: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentTypeBinding'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      412: components['responses']['PreconditionFailed'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  ContentTypes_List: {
    parameters: {
      query?: {
        /** @description Only include types that are available for creation under the provided container type */
        forContainerType?: string;
        /** @description Indicates which sources should be included when listing content types. Use 'DEFAULT' to include content types without a specific source. */
        sources?: string[];
        /** @description Zero based index of the page that should be retrieved. */
        pageIndex?: number;
        /** @description The maximum items per page that should be retrieved. */
        pageSize?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentTypePage'];
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  ContentTypes_Create: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** @description The content type that should be created. */
    requestBody: {
      content: {
        'application/json': components['schemas']['ContentType'];
      };
    };
    responses: {
      /** @description Created */
      201: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          /** @description Indicates the URL of the newly-created resource. */
          Location?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentType'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  ContentTypes_Get: {
    parameters: {
      query?: never;
      header?: {
        /** @description If provided and the value matches the RFC7232 ETag of the current resource a 304 NotModified response will be returned. Weak ETags will always be ignored. */
        'If-None-Match'?: string;
        /** @description If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided. */
        'If-Modified-Since'?: string;
      };
      path: {
        /** @description The key of the content type to retrieve. */
        key: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentType'];
        };
      };
      /** @description Not Modified */
      304: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  ContentTypes_Delete: {
    parameters: {
      query?: never;
      header?: {
        /** @description If provided, the DELETE request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
        'If-Match'?: string;
        /** @description If provided, the DELETE request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
        'If-Unmodified-Since'?: string;
      };
      path: {
        /** @description The key of the content type to delete. */
        key: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentType'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      412: components['responses']['PreconditionFailed'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  ContentTypes_Patch: {
    parameters: {
      query?: never;
      header?: {
        /** @description Patch the content type even though the changes might result in data loss. */
        'cms-ignore-data-loss-warnings'?: boolean;
        /** @description If provided, the PATCH request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
        'If-Match'?: string;
        /** @description If provided, the PATCH request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
        'If-Unmodified-Since'?: string;
      };
      path: {
        /** @description The key of the content type to patch. */
        key: string;
      };
      cookie?: never;
    };
    /** @description The values of the content type that should be patched formatted according to RFC7396. */
    requestBody: {
      content: {
        'application/merge-patch+json': components['schemas']['ContentType'];
      };
    };
    responses: {
      /** @description OK */
      200: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ContentType'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      412: components['responses']['PreconditionFailed'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  DisplayTemplates_List: {
    parameters: {
      query?: {
        /** @description Zero based index of the page that should be retrieved. */
        pageIndex?: number;
        /** @description The maximum items per page that should be retrieved. */
        pageSize?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['DisplayTemplatePage'];
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  DisplayTemplates_Create: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** @description The display template that should be created. */
    requestBody: {
      content: {
        'application/json': components['schemas']['DisplayTemplate'];
      };
    };
    responses: {
      /** @description Created */
      201: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          /** @description Indicates the URL of the newly-created resource. */
          Location?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['DisplayTemplate'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  DisplayTemplates_Get: {
    parameters: {
      query?: never;
      header?: {
        /** @description If provided and the value matches the RFC7232 ETag of the current resource a 304 NotModified response will be returned. Weak ETags will always be ignored. */
        'If-None-Match'?: string;
        /** @description If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided. */
        'If-Modified-Since'?: string;
      };
      path: {
        /** @description The key of the display template to retrieve. */
        key: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['DisplayTemplate'];
        };
      };
      /** @description Not Modified */
      304: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  DisplayTemplates_Delete: {
    parameters: {
      query?: never;
      header?: {
        /** @description If provided, the DELETE request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
        'If-Match'?: string;
        /** @description If provided, the DELETE request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
        'If-Unmodified-Since'?: string;
      };
      path: {
        /** @description The key of the display template to delete. */
        key: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['DisplayTemplate'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      412: components['responses']['PreconditionFailed'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  DisplayTemplates_Patch: {
    parameters: {
      query?: never;
      header?: {
        /** @description If provided, the PATCH request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
        'If-Match'?: string;
        /** @description If provided, the PATCH request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
        'If-Unmodified-Since'?: string;
      };
      path: {
        /** @description The key of the display template to patch. */
        key: string;
      };
      cookie?: never;
    };
    /** @description The values of the display template that should be patched formatted according to RFC7396. */
    requestBody: {
      content: {
        'application/merge-patch+json': components['schemas']['DisplayTemplate'];
      };
    };
    responses: {
      /** @description OK */
      200: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['DisplayTemplate'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      412: components['responses']['PreconditionFailed'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Locales_List: {
    parameters: {
      query?: {
        /** @description Zero based index of the page that should be retrieved. */
        pageIndex?: number;
        /** @description The maximum items per page that should be retrieved. */
        pageSize?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['LocalePage'];
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Locales_Create: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** @description The locale that should be created. */
    requestBody: {
      content: {
        'application/json': components['schemas']['Locale'];
      };
    };
    responses: {
      /** @description Created */
      201: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          /** @description Indicates the URL of the newly-created resource. */
          Location?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Locale'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Locales_Get: {
    parameters: {
      query?: never;
      header?: {
        /** @description If provided and the value matches the RFC7232 ETag of the current resource a 304 NotModified response will be returned. Weak ETags will always be ignored. */
        'If-None-Match'?: string;
        /** @description If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided. */
        'If-Modified-Since'?: string;
      };
      path: {
        /** @description The key of the locale to retrieve. */
        key: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Locale'];
        };
      };
      /** @description Not Modified */
      304: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Locales_Delete: {
    parameters: {
      query?: never;
      header?: {
        /** @description If provided, the DELETE request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
        'If-Match'?: string;
        /** @description If provided, the DELETE request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
        'If-Unmodified-Since'?: string;
      };
      path: {
        /** @description The key of the locale to delete. */
        key: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Locale'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      412: components['responses']['PreconditionFailed'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Locales_Patch: {
    parameters: {
      query?: never;
      header?: {
        /** @description If provided, the PATCH request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
        'If-Match'?: string;
        /** @description If provided, the PATCH request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
        'If-Unmodified-Since'?: string;
      };
      path: {
        /** @description The key of the locale to patch. */
        key: string;
      };
      cookie?: never;
    };
    /** @description The values of the locale that should be patched formatted according to RFC7396. */
    requestBody: {
      content: {
        'application/merge-patch+json': components['schemas']['Locale'];
      };
    };
    responses: {
      /** @description OK */
      200: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Locale'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      412: components['responses']['PreconditionFailed'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Manifest_Export: {
    parameters: {
      query?: {
        /** @description The sections that should be included in the manifest export. If not provided, all sections will be included. */
        sections?: ('locales' | 'contentTypes' | 'propertyGroups' | 'displayTemplates')[];
        /** @description Indicates if read-only resources should be included in the manifest export. */
        includeReadOnly?: boolean;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Manifest'];
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  Manifest_Import: {
    parameters: {
      query?: never;
      header?: {
        /** @description Indicates if manifest resources should be updated even though the changes might result in data loss. */
        'cms-ignore-data-loss-warnings'?: boolean;
      };
      path?: never;
      cookie?: never;
    };
    /** @description The manifest that should be imported. */
    requestBody: {
      content: {
        'application/json': components['schemas']['Manifest'];
      };
    };
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ManifestImportResult'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  PropertyFormats_List: {
    parameters: {
      query?: {
        /** @description Zero based index of the page that should be retrieved. */
        pageIndex?: number;
        /** @description The maximum items per page that should be retrieved. */
        pageSize?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PropertyFormatPage'];
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  PropertyFormats_Get: {
    parameters: {
      query?: {
        /** @description Indicates that a deleted property format may be returned. */
        allowDeleted?: boolean;
      };
      header?: {
        /** @description If provided and the value matches the RFC7232 ETag of the current resource a 304 NotModified response will be returned. Weak ETags will always be ignored. */
        'If-None-Match'?: string;
        /** @description If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided. */
        'If-Modified-Since'?: string;
      };
      path: {
        /** @description The key of the property format to retrieve. */
        key: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PropertyFormat'];
        };
      };
      /** @description Not Modified */
      304: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  PropertyGroups_List: {
    parameters: {
      query?: {
        /** @description Indicates which property groups sources should be listed. Use 'DEFAULT' to include groups without a specific source. */
        sources?: string[];
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PropertyGroupPage'];
        };
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  PropertyGroups_Create: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** @description The property group that should be created. */
    requestBody: {
      content: {
        'application/json': components['schemas']['PropertyGroup'];
      };
    };
    responses: {
      /** @description Created */
      201: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          /** @description Indicates the URL of the newly-created resource. */
          Location?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PropertyGroup'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  PropertyGroups_Get: {
    parameters: {
      query?: never;
      header?: {
        /** @description If provided and the value matches the RFC7232 ETag of the current resource a 304 NotModified response will be returned. Weak ETags will always be ignored. */
        'If-None-Match'?: string;
        /** @description If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided. */
        'If-Modified-Since'?: string;
      };
      path: {
        /** @description The key of the property group to retrieve. */
        key: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PropertyGroup'];
        };
      };
      /** @description Not Modified */
      304: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content?: never;
      };
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  PropertyGroups_Delete: {
    parameters: {
      query?: never;
      header?: {
        /** @description If provided, the DELETE request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
        'If-Match'?: string;
        /** @description If provided, the DELETE request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
        'If-Unmodified-Since'?: string;
      };
      path: {
        /** @description The key of the property group to delete. */
        key: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description OK */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PropertyGroup'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      412: components['responses']['PreconditionFailed'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
  PropertyGroups_Patch: {
    parameters: {
      query?: never;
      header?: {
        /** @description If provided, the PATCH request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
        'If-Match'?: string;
        /** @description If provided, the PATCH request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
        'If-Unmodified-Since'?: string;
      };
      path: {
        /** @description The key of the property group to patch. */
        key: string;
      };
      cookie?: never;
    };
    /** @description The values of the property group that should be patched formatted according to RFC7396. */
    requestBody: {
      content: {
        'application/merge-patch+json': components['schemas']['PropertyGroup'];
      };
    };
    responses: {
      /** @description OK */
      200: {
        headers: {
          /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
          ETag?: string;
          /** @description The date and time at which the resource was last modified. */
          'Last-Modified'?: string;
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PropertyGroup'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      412: components['responses']['PreconditionFailed'];
      429: components['responses']['TooManyRequests'];
      500: components['responses']['InternalServerError'];
    };
  };
}

