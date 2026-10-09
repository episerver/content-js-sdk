export interface paths {
    "/applications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * List applications
         * @description List all applications available in the CMS.
         */
        get: operations["Applications_List"];
        put?: never;
        /**
         * Create application
         * @description Create a new application.
         */
        post: operations["Applications_Create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/applications/{key}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get application
         * @description Get the application with the provided key.
         */
        get: operations["Applications_Get"];
        put?: never;
        post?: never;
        /**
         * Delete application
         * @description Deletes the application with the provided key.
         */
        delete: operations["Applications_Delete"];
        options?: never;
        head?: never;
        /**
         * Patch application
         * @description Patch an existing application.
         */
        patch: operations["Applications_Patch"];
        trace?: never;
    };
    "/blueprints": {
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
        get: operations["Blueprints_List"];
        put?: never;
        /**
         * Create blueprint
         * @description Create a new blueprint.
         */
        post: operations["Blueprints_Create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/blueprints/{key}": {
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
        get: operations["Blueprints_Get"];
        put?: never;
        post?: never;
        /**
         * Delete blueprint
         * @description Deletes the blueprint with the provided key.
         */
        delete: operations["Blueprints_Delete"];
        options?: never;
        head?: never;
        /**
         * Patch blueprint
         * @description Patch an existing blueprint.
         */
        patch: operations["Blueprints_Patch"];
        trace?: never;
    };
    "/content": {
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
        post: operations["Content_Create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/{key}:copy": {
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
        post: operations["Content_Copy"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/{key}:undelete": {
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
        post: operations["Content_Undelete"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/{key}": {
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
        get: operations["Content_GetNode"];
        put?: never;
        post?: never;
        /**
         * Delete content
         * @description Deletes the content item with the provided key. If a content item with the provided key does not exist an error is returned.
         */
        delete: operations["Content_Delete"];
        options?: never;
        head?: never;
        /**
         * Patch content
         * @description Patch an existing content item. If a content item with the provided key does not exist an error is returned.
         */
        patch: operations["Content_PatchNode"];
        trace?: never;
    };
    "/content/{key}/assets": {
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
        get: operations["Content_ListAssets"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/{key}/items": {
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
        get: operations["Content_ListItems"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/{key}/locales/{locale}": {
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
        get: operations["Content_ListLocaleVersions"];
        put?: never;
        post?: never;
        /**
         * Delete locale
         * @description Deletes a branch of the content with the provided key and locale. Returns the published or latest content item in the locale that was deleted. If a content item with the provided key does not exist an error is returned.
         */
        delete: operations["Content_DeleteLocale"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/{key}/path": {
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
        get: operations["Content_GetPath"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/{key}/versions": {
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
        get: operations["Content_ListVersions"];
        put?: never;
        /**
         * Create version
         * @description Create a new version of a content item.
         */
        post: operations["Content_CreateVersion"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/{key}/versions/{version}:approve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Approve the active step of an approval for a content version that is in review. For multi-step approvals, the version remains in review until all steps are approved. */
        post: operations["Content_Approve"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/{key}/versions/{version}:draft": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Change content version into draft status. */
        post: operations["Content_Draft"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/{key}/versions/{version}:publish": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Publish content version */
        post: operations["Content_Publish"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/{key}/versions/{version}:ready": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Make content ready to publish, if approvals are required the version will automatically be moved to in review. */
        post: operations["Content_Ready"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/{key}/versions/{version}:reject": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Reject a content version that is in review. The version transitions to rejected status regardless of remaining approval steps. */
        post: operations["Content_Reject"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/{key}/versions/{version}": {
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
        get: operations["Content_GetVersion"];
        put?: never;
        post?: never;
        /**
         * Delete version
         * @description Deletes the content item with the provided key and version and returns the deleted item. If a content item with the provided key does not exist an error is returned.
         */
        delete: operations["Content_DeleteVersion"];
        options?: never;
        head?: never;
        /**
         * Patch version
         * @description Patch an existing content item and returns the updated content item. If a content item with the provided key does not exist an error is returned.
         */
        patch: operations["Content_PatchVersion"];
        trace?: never;
    };
    "/content/{key}/versions/{version}/media": {
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
        get: operations["Content_GetMedia"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/{key}/versions/{version}/previews": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get preview URLs for a content item version.
         * @description Generate preview URLs for the content item with fresh authentication tokens.
         */
        get: operations["Content_GetPreviews"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/content/versions": {
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
        get: operations["Content_ListAllVersions"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/contentsources": {
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
        get: operations["ContentSources_List"];
        put?: never;
        /**
         * Create contentsource
         * @description Create a new contentsource.
         */
        post: operations["ContentSources_Create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/contentsources/{key}": {
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
        get: operations["ContentSources_Get"];
        put?: never;
        post?: never;
        /**
         * Delete contentsource
         * @description Deletes the contentsource with the provided key.
         */
        delete: operations["ContentSources_Delete"];
        options?: never;
        head?: never;
        /**
         * Patch contentsource
         * @description Patch an existing contentsource.
         */
        patch: operations["ContentSources_Patch"];
        trace?: never;
    };
    "/contenttypebindings": {
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
        get: operations["ContentTypeBindings_List"];
        put?: never;
        /**
         * Create contenttypebinding
         * @description Create a new contenttypebinding.
         */
        post: operations["ContentTypeBindings_Create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/contenttypebindings/{key}": {
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
        get: operations["ContentTypeBindings_Get"];
        put?: never;
        post?: never;
        /**
         * Delete contenttypebinding
         * @description Deletes the contenttypebinding with the provided key.
         */
        delete: operations["ContentTypeBindings_Delete"];
        options?: never;
        head?: never;
        /**
         * Patch contenttypebinding
         * @description Patch an existing contenttypebinding.
         */
        patch: operations["ContentTypeBindings_Patch"];
        trace?: never;
    };
    "/contenttypes": {
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
        get: operations["ContentTypes_List"];
        put?: never;
        /**
         * Create content type
         * @description Create a new content type.
         */
        post: operations["ContentTypes_Create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/contenttypes/{key}": {
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
        get: operations["ContentTypes_Get"];
        put?: never;
        post?: never;
        /**
         * Delete content type
         * @description Deletes the content type with the provided key.
         */
        delete: operations["ContentTypes_Delete"];
        options?: never;
        head?: never;
        /**
         * Patch content type
         * @description Patch an existing content type.
         */
        patch: operations["ContentTypes_Patch"];
        trace?: never;
    };
    "/displaytemplates": {
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
        get: operations["DisplayTemplates_List"];
        put?: never;
        /**
         * Create display template
         * @description Create a new display template.
         */
        post: operations["DisplayTemplates_Create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/displaytemplates/{key}": {
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
        get: operations["DisplayTemplates_Get"];
        put?: never;
        post?: never;
        /**
         * Delete display template
         * @description Deletes the display template with the provided key.
         */
        delete: operations["DisplayTemplates_Delete"];
        options?: never;
        head?: never;
        /**
         * Patch display template
         * @description Patch an existing display template.
         */
        patch: operations["DisplayTemplates_Patch"];
        trace?: never;
    };
    "/locales": {
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
        get: operations["Locales_List"];
        put?: never;
        /**
         * Create locale
         * @description Create a new locale.
         */
        post: operations["Locales_Create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/locales/{key}": {
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
        get: operations["Locales_Get"];
        put?: never;
        post?: never;
        /**
         * Delete locale
         * @description Deletes the locale with the provided key.
         */
        delete: operations["Locales_Delete"];
        options?: never;
        head?: never;
        /**
         * Patch locale
         * @description Patch an existing locale.
         */
        patch: operations["Locales_Patch"];
        trace?: never;
    };
    "/manifest": {
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
        get: operations["Manifest_Export"];
        put?: never;
        /**
         * Import manifest
         * @description Import a CMS content manifest.
         */
        post: operations["Manifest_Import"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/propertyformats": {
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
        get: operations["PropertyFormats_List"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/propertyformats/{key}": {
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
        get: operations["PropertyFormats_Get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/propertygroups": {
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
        get: operations["PropertyGroups_List"];
        put?: never;
        /**
         * Create property group
         * @description Create a new property group.
         */
        post: operations["PropertyGroups_Create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/propertygroups/{key}": {
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
        get: operations["PropertyGroups_Get"];
        put?: never;
        post?: never;
        /**
         * Delete property group
         * @description Deletes the property group with the provided key.
         */
        delete: operations["PropertyGroups_Delete"];
        options?: never;
        head?: never;
        /**
         * Patch property group
         * @description Patch an existing property group.
         */
        patch: operations["PropertyGroups_Patch"];
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** @description A CMS application (website or remote website). */
        Application: {
            /** @description The unique identifier (key) of the resource. */
            key?: string;
            /** @description The display name of this application. */
            displayName: string;
            /**
             * @description The type of this application.
             * @example website
             * @example inProcessWebsite
             */
            type: string;
            /** @description A string that is used to indicate the source of this application. */
            readonly source?: string;
            /**
             * Format: uri
             * @description A reference to the entry point (start page) content for this application.
             */
            entryPoint: string;
            /** @description Whether this is the default application. */
            isDefault?: boolean;
            /** @description Whether this application uses a dedicated assets folder. */
            useApplicationSpecificAssets?: boolean;
            /**
             * Format: uri
             * @description Returns the root for application-specific assets, if 'useApplicationSpecificAssets' is true.
             */
            readonly assetsRoot?: null | string;
            /** @description The hosts assigned to this application. */
            hosts?: components["schemas"]["ApplicationHost"][];
            /** @description Whether to use preview tokens for this application. Only applicable when the type is 'website'. */
            usePreviewTokens?: boolean;
            /** @description A dictionary of preview URL formats keyed by content type base or content type key. Only applicable when the type is 'website'. */
            previewUrlFormats?: {
                [key: string]: string;
            };
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
        };
        /** @description A host entry for an application. */
        ApplicationHost: {
            /** @description The DNS host name or IP address and optional port of this host. */
            authority: string;
            /**
             * @description The type of this host.
             * @example default
             * @example primary
             * @example preview
             * @example redirectPermanent
             * @example redirectTemporary
             * @example edit
             * @example media
             */
            type?: string;
            /** @description The locale associated with this host. */
            locale?: string;
            /**
             * @description The preferred URL scheme to be used when accessing this host. Will be used by the CMS when generating links to this host.
             * @example http
             * @example https
             */
            preferredUrlScheme?: string;
        };
        /** @description A host entry for an application. */
        ApplicationHostPatch: {
            /** @description The DNS host name or IP address and optional port of this host. */
            authority?: null | string;
            /**
             * @description The type of this host.
             * @example default
             * @example primary
             * @example preview
             * @example redirectPermanent
             * @example redirectTemporary
             * @example edit
             * @example media
             */
            type?: null | string;
            /** @description The locale associated with this host. */
            locale?: null | string;
            /**
             * @description The preferred URL scheme to be used when accessing this host. Will be used by the CMS when generating links to this host.
             * @example http
             * @example https
             */
            preferredUrlScheme?: null | string;
        };
        /** @description A single page of items in a paged collection, including paging metadata such as the current page index, page size, and an estimated total item count. */
        ApplicationPage: {
            /** @description The items in this paged collection. */
            readonly items?: components["schemas"]["Application"][];
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
            readonly totalCount?: null | number;
        };
        /** @description A CMS application (website or remote website). */
        ApplicationPatch: {
            /** @description The display name of this application. */
            displayName?: null | string;
            /**
             * Format: uri
             * @description A reference to the entry point (start page) content for this application.
             */
            entryPoint?: null | string;
            /** @description Whether this is the default application. */
            isDefault?: null | boolean;
            /** @description Whether this application uses a dedicated assets folder. */
            useApplicationSpecificAssets?: null | boolean;
            /** @description The hosts assigned to this application. */
            hosts?: null | components["schemas"]["ApplicationHostPatch"][];
            /** @description Whether to use preview tokens for this application. Only applicable when the type is 'website'. */
            usePreviewTokens?: null | boolean;
            /** @description A dictionary of preview URL formats keyed by content type base or content type key. Only applicable when the type is 'website'. */
            previewUrlFormats?: null | {
                [key: string]: string;
            };
        };
        /** @description Options for approving or rejecting a content version. */
        ApprovalDecisionOptions: {
            /** @description An optional comment to include with the approval decision. May be required depending on the approval definition configuration. */
            comment?: null | string;
            /** @description Indicates if the approval should be forced, bypassing the normal approval flow. Requires 'admin' access rights. */
            force?: boolean;
        };
        /** @description The item definition for a content type property of type 'array'. */
        ArrayItem: {
            /**
             * @description The fundamental data type for the items in the array (e.g., string, integer, content reference).
             * @example string
             * @example url
             * @example boolean
             * @example integer
             * @example float
             * @example dateTime
             * @example contentReference
             * @example content
             * @example link
             * @example richText
             * @example json
             * @example component
             * @example composition
             */
            type: string;
            /** @description The property format that defines specialized handling and validation for this array item. */
            format?: string;
            /** @description The content type that items in the array may contain, when the 'type' is set to 'component'. */
            contentType?: string;
            /** @description The minimum value that properties of this type should be able to contain. Value type must match the type of the array item. */
            minimum?: null | number | string;
            /** @description The maximum value that array items of this type should be able to contain. Value type must match the type of the array item. */
            maximum?: null | number | string;
            /**
             * Format: int32
             * @description The minimum string length that array items of this type should be able to contain.
             */
            minLength?: null | number;
            /**
             * Format: int32
             * @description The maximum string length that array items of this type should be able to contain.
             */
            maxLength?: null | number;
            /**
             * Format: regex
             * @description Regular expression pattern that limits what strings that array items of this type should be able to contain.
             */
            pattern?: string;
            /** @description A predefined list of allowed values for array items of this type. The enumeration values must match the property's data type. Allowed for string, integer, float and date-time property types. */
            enum?: null | components["schemas"]["EnumerationValue"][];
            /** @description Defines content and base types that array items of this type may contain. */
            allowedTypes?: string[];
            /** @description Defines content and base types that array items of this type may not contain. */
            restrictedTypes?: string[];
            /** @description Defines editor specific settings for this item. The settings are specific to the item and editor type. */
            editorSettings?: null | {
                [key: string]: unknown;
            };
        };
        /** @description A blueprint of a content item. */
        Blueprint: {
            /** @description The unique identifier (key) of the resource. */
            key?: string;
            /** @description The display name of this blueprint. */
            displayName: string;
            /** @description The content type of this blueprint. */
            contentType: string;
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
            /** @description The content structure of this blueprint. */
            content: components["schemas"]["BlueprintData"];
        };
        /** @description The data part of a blueprint. */
        BlueprintData: components["schemas"]["ContentData"] & {
            /** @description The composition structure of this blueprint, if any. Only relevant for blueprints of experiences and sections. */
            composition?: components["schemas"]["CompositionNode"];
        };
        /** @description The data part of a blueprint. */
        BlueprintDataPatch: components["schemas"]["ContentDataPatch"] & {
            composition?: components["schemas"]["CompositionNodePatch"];
        };
        /** @description A single page of items in a paged collection, including paging metadata such as the current page index, page size, and an estimated total item count. */
        BlueprintPage: {
            /** @description The items in this paged collection. */
            readonly items?: components["schemas"]["Blueprint"][];
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
            readonly totalCount?: null | number;
        };
        /** @description A blueprint of a content item. */
        BlueprintPatch: {
            /** @description The display name of this blueprint. */
            displayName?: null | string;
            content?: components["schemas"]["BlueprintDataPatch"];
        };
        /** @description Configures the built-in composition (the "canvas") of an experience or section content type. Only applicable to content types with base type `_experience` or `_section`. */
        CompositionConfiguration: {
            /** @description The layout type to use for the built-in composition (e.g. `outline` or `grid`). When empty, the default layout for the base type is used. */
            format?: string;
            /** @description Content types and base types that the built-in composition is permitted to contain. */
            allowedTypes?: string[];
            /** @description Content types and base types that the built-in composition is forbidden from containing. */
            restrictedTypes?: string[];
        };
        /** @description Configures the built-in composition (the "canvas") of an experience or section content type. Only applicable to content types with base type `_experience` or `_section`. */
        CompositionConfigurationPatch: {
            /** @description The layout type to use for the built-in composition (e.g. `outline` or `grid`). When empty, the default layout for the base type is used. */
            format?: null | string;
            /** @description Content types and base types that the built-in composition is permitted to contain. */
            allowedTypes?: null | string[];
            /** @description Content types and base types that the built-in composition is forbidden from containing. */
            restrictedTypes?: null | string[];
        };
        /** @description Display settings for a composition node. */
        CompositionDisplaySettings: {
            /** @description The display template that these settings apply to. */
            displayTemplate: string;
            /** @description The display settings of this composition node. */
            settings?: null | {
                [key: string]: string;
            };
        };
        /** @description Display settings for a composition node. */
        CompositionDisplaySettingsPatch: {
            /** @description The display template that these settings apply to. */
            displayTemplate?: null | string;
            /** @description The display settings of this composition node. */
            settings?: null | {
                [key: string]: string;
            };
        };
        /** @description A node in a content composition. */
        CompositionNode: {
            /** @description Specifies an identifier of this composition node. */
            id?: string;
            /** @description The display name of this composition node. */
            displayName?: string;
            /** @description The node type of this composition node. */
            nodeType: string;
            /** @description The node layout type of this composition node */
            layoutType?: string;
            /** @description Optional display settings for the composition node. */
            displaySettings?: components["schemas"]["CompositionDisplaySettings"];
            /** @description Specifies the associated content for this composition node, if any. */
            component?: components["schemas"]["ContentComponent"];
            /** @description The child nodes for this composition node. */
            nodes?: null | components["schemas"]["CompositionNode"][];
        };
        /** @description A node in a content composition. */
        CompositionNodePatch: {
            /** @description Specifies an identifier of this composition node. */
            id?: null | string;
            /** @description The display name of this composition node. */
            displayName?: null | string;
            /** @description The node type of this composition node. */
            nodeType?: null | string;
            /** @description The node layout type of this composition node */
            layoutType?: null | string;
            displaySettings?: components["schemas"]["CompositionDisplaySettingsPatch"];
            component?: components["schemas"]["ContentComponentPatch"];
            /** @description The child nodes for this composition node. */
            nodes?: null | components["schemas"]["CompositionNodePatch"][];
        };
        /** @description An association between a content item and a source content item, defined by a content type binding. Used for linking managed content with external or reference content. */
        ContentBinding: {
            /** @description The binding definition key that controls how the source content item is linked and accessed. */
            contentTypeBinding?: string;
            /**
             * Format: uri
             * @description The reference to the source content item that is being bound. This cannot be empty.
             */
            source: string;
        };
        /** @description An association between a content item and a source content item, defined by a content type binding. Used for linking managed content with external or reference content. */
        ContentBindingPatch: {
            /** @description The binding definition key that controls how the source content item is linked and accessed. */
            contentTypeBinding?: null | string;
            /**
             * Format: uri
             * @description The reference to the source content item that is being bound. This cannot be empty.
             */
            source?: null | string;
        };
        /** @description A content component. */
        ContentComponent: components["schemas"]["ContentData"] & {
            /**
             * Format: uri
             * @description A reference to the content of this component. Cannot be assigned together with 'contentType' or 'properties'.
             */
            reference?: null | string;
            /** @description The key of the content type that this is an embedded instance of. */
            contentType?: string;
        };
        /** @description A content component. */
        ContentComponentPatch: components["schemas"]["ContentDataPatch"] & {
            /**
             * Format: uri
             * @description A reference to the content of this component. Cannot be assigned together with 'contentType' or 'properties'.
             */
            reference?: null | string;
            /** @description The key of the content type that this is an embedded instance of. */
            contentType?: null | string;
        };
        /** @description Content property values conforming to the content type, with an optional binding to source content. */
        ContentData: {
            /** @description Optional binding to another content item. */
            binding?: components["schemas"]["ContentBinding"];
            /** @description Properties as they are defined by corresponding component or content type. */
            properties?: {
                [key: string]: components["schemas"]["PropertyData"];
            };
        };
        /** @description Content property values conforming to the content type, with an optional binding to source content. */
        ContentDataPatch: {
            binding?: components["schemas"]["ContentBindingPatch"];
            /** @description Properties as they are defined by corresponding component or content type. */
            properties?: null | {
                [key: string]: components["schemas"]["PropertyData"];
            };
        };
        /** @description Metadata about a content item in the content hierarchy — ownership, localization, and audit information — but not its property values. */
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
            readonly locales?: string[];
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
            readonly deleted?: null | string;
            /** @description The username of the user who deleted this content. Only populated if the content is deleted. */
            readonly deletedBy?: string;
        };
        /** @description A single page of items in a paged collection, including paging metadata such as the current page index, page size, and an estimated total item count. */
        ContentNodePage: {
            /** @description The items in this paged collection. */
            readonly items?: components["schemas"]["ContentNode"][];
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
            readonly totalCount?: null | number;
        };
        /** @description Metadata about a content item in the content hierarchy — ownership, localization, and audit information — but not its property values. */
        ContentNodePatch: {
            /** @description The content item that contains this item in the hierarchy. */
            container?: null | string;
            /** @description The content item that owns this item. Content that is owned by another content is also known as an asset. Cannot be combined with container. */
            owner?: null | string;
        };
        /** @description A content source used within the CMS. */
        ContentSource: {
            /** @description The unique identifier (key) of the resource. */
            key?: string;
            /** @description Specifies the type of source. For example 'graph' for a GraphQL content source. */
            type: string;
            /** @description The key of the source that this content source relates to. */
            sourceKey: string;
            /** @description Specifies the source type of this source. */
            sourceType: string;
            /** @description The display name of this content source. */
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
             * @example _page
             * @example _component
             * @example _media
             * @example _image
             * @example _video
             * @example _folder
             * @example _experience
             * @example _section
             * @example _element
             */
            baseType: string;
            /** @description Specifies which properties to include and the mappings for them. */
            propertyMappings: components["schemas"]["PropertyMappings"];
        };
        /** @description A single page of items in a paged collection, including paging metadata such as the current page index, page size, and an estimated total item count. */
        ContentSourcePage: {
            /** @description The items in this paged collection. */
            readonly items?: components["schemas"]["ContentSource"][];
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
            readonly totalCount?: null | number;
        };
        /** @description A content source used within the CMS. */
        ContentSourcePatch: {
            /** @description Specifies the type of source. For example 'graph' for a GraphQL content source. */
            type?: null | string;
            /** @description The key of the source that this content source relates to. */
            sourceKey?: null | string;
            /** @description Specifies the source type of this source. */
            sourceType?: null | string;
            /** @description The display name of this content source. */
            displayName?: null | string;
            /**
             * @description Represents the base of the corresponding content type.
             * @example _page
             * @example _component
             * @example _media
             * @example _image
             * @example _video
             * @example _folder
             * @example _experience
             * @example _section
             * @example _element
             */
            baseType?: null | string;
            propertyMappings?: components["schemas"]["PropertyMappingsPatch"];
        };
        /** @description A content type definition. */
        ContentType: {
            /** @description The unique identifier (key) of the resource. */
            key?: string;
            /** @description The display name of this content type. */
            displayName: string;
            /** @description A description of this content type. */
            description?: string;
            /**
             * @description The base type of this content type. Ignored for contracts; required for all other content types.
             * @example _page
             * @example _component
             * @example _media
             * @example _image
             * @example _video
             * @example _folder
             * @example _experience
             * @example _section
             * @example _element
             */
            baseType?: null | string;
            /** @description Specifies if the content type is a contract type. */
            isContract?: boolean;
            /** @description A string that indicates the source of this content type. Can be used to distinguish content types created by the system from types coming from model classes in the CMS solution. */
            readonly source?: string;
            /**
             * Format: int32
             * @description A value that is used when sorting content type instances.
             */
            sortOrder?: number;
            /** @description Provides a set of content types that can be created in containers of this type */
            mayContainTypes?: string[];
            /** @description Provides a set of media file extensions that this content type can handle. */
            mediaFileExtensions?: string[];
            /** @description Provides a set of composition behaviors specifying how this content type can be used within compositions. Currently this can only be assigned when baseType is 'component'. */
            compositionBehaviors?: string[];
            /** @description Configures the built-in composition (the "canvas") for experience and section content types. Only applicable when BaseType is `_experience` or `_section`. */
            composition?: components["schemas"]["CompositionConfiguration"];
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
            /** @description Dictionary with all custom properties of this content type. */
            properties?: {
                [key: string]: components["schemas"]["ContentTypeProperty"];
            };
            /** @description The access rights assigned to this content type that defines who can create content of this type. If no access rights are assigned, everyone will be able to create content of this type. An empty array means that no new content of this type can be created. */
            accessRights?: null | components["schemas"]["SecurityIdentity"][];
        };
        /** @description A binding between two content types. */
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
            /** @description Object map with all property mappings for this content type binding. The field name represents the path that the property should bind to. */
            propertyMappings?: {
                [key: string]: components["schemas"]["PropertyMapping"];
            };
        };
        /** @description A single page of items in a paged collection, including paging metadata such as the current page index, page size, and an estimated total item count. */
        ContentTypeBindingPage: {
            /** @description The items in this paged collection. */
            readonly items?: components["schemas"]["ContentTypeBinding"][];
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
            readonly totalCount?: null | number;
        };
        /** @description A binding between two content types. */
        ContentTypeBindingPatch: {
            /** @description Specifies the key of the content type that this binding is from. */
            from?: null | string;
            /** @description Specifies the key of the content type that this binding is to. */
            to?: null | string;
            /** @description Object map with all property mappings for this content type binding. The field name represents the path that the property should bind to. */
            propertyMappings?: null | {
                [key: string]: components["schemas"]["PropertyMapping"];
            };
        };
        /** @description A single page of items in a paged collection, including paging metadata such as the current page index, page size, and an estimated total item count. */
        ContentTypePage: {
            /** @description The items in this paged collection. */
            readonly items?: components["schemas"]["ContentType"][];
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
            readonly totalCount?: null | number;
        };
        /** @description A content type definition. */
        ContentTypePatch: {
            /** @description The display name of this content type. */
            displayName?: null | string;
            /** @description A description of this content type. */
            description?: null | string;
            /**
             * Format: int32
             * @description A value that is used when sorting content type instances.
             */
            sortOrder?: null | number;
            /** @description Provides a set of content types that can be created in containers of this type */
            mayContainTypes?: null | string[];
            /** @description Provides a set of media file extensions that this content type can handle. */
            mediaFileExtensions?: null | string[];
            /** @description Provides a set of composition behaviors specifying how this content type can be used within compositions. Currently this can only be assigned when baseType is 'component'. */
            compositionBehaviors?: null | string[];
            composition?: components["schemas"]["CompositionConfigurationPatch"];
            /** @description Provides a set of contract content types that this content type is bound to. */
            contracts?: null | string[];
            /** @description Dictionary with all custom properties of this content type. */
            properties?: null | {
                [key: string]: components["schemas"]["ContentTypeProperty"];
            };
            /** @description The access rights assigned to this content type that defines who can create content of this type. If no access rights are assigned, everyone will be able to create content of this type. An empty array means that no new content of this type can be created. */
            accessRights?: null | components["schemas"]["SecurityIdentityPatch"][];
        };
        /** @description A single property of a content type, including its data type, validation rules, and editorial metadata. */
        ContentTypeProperty: {
            /**
             * @description The fundamental data type of this property (e.g., string, integer, content reference).
             * @example string
             * @example url
             * @example boolean
             * @example integer
             * @example float
             * @example dateTime
             * @example contentReference
             * @example content
             * @example link
             * @example richText
             * @example json
             * @example array
             * @example component
             * @example composition
             */
            type: string;
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
             * @example disabled
             * @example queryable
             * @example searchable
             */
            indexingType?: string;
            /**
             * @description Indicates how this property is displayed in the editing interface. If not explicitly set, the property will be available for editing.
             * @example available
             * @example hidden
             */
            displayMode?: string;
            /** @description The lowest value (inclusive) allowed for numeric or date properties. Type must match the property's data type. */
            minimum?: null | number | string;
            /** @description The highest value (inclusive) allowed for numeric or date properties. Type must match the property's data type. */
            maximum?: null | number | string;
            /** @description A predefined list of allowed values for this property. The enumeration values must match the property's data type. Allowed for string, integer, float and date-time property types. */
            enum?: null | components["schemas"]["EnumerationValue"][];
            /**
             * Format: int32
             * @description The minimum character length for string-type properties.
             */
            minLength?: null | number;
            /**
             * Format: int32
             * @description The maximum character length for string-type properties.
             */
            maxLength?: null | number;
            /**
             * Format: regex
             * @description Regular expression pattern that limits what value that a string type property must match.
             */
            pattern?: string;
            /**
             * Format: int32
             * @description The minimum number of items allowed in array-type properties.
             */
            minItems?: null | number;
            /**
             * Format: int32
             * @description The maximum number of items allowed in array-type properties.
             */
            maxItems?: null | number;
            /** @description Content types and base types that this property is permitted to contain. Used by properties of content or content reference type. */
            allowedTypes?: string[];
            /** @description Content types and base types that items in this property are forbidden from containing. Used by properties of content or content reference type. */
            restrictedTypes?: string[];
            /** @description Defines editor specific settings for this property. Editor settings are specific to the item and editor type. */
            editorSettings?: null | {
                [key: string]: unknown;
            };
            /** @description Defines information and restrictions about the items in an array property. */
            items?: components["schemas"]["ArrayItem"];
        };
        /** @description A version of a content item. */
        ContentVersion: components["schemas"]["ContentData"] & {
            /** @description The key that identifies this content version. */
            key?: string;
            /** @description The locale of this content version. */
            locale?: string;
            /** @description The version identifier of this instance. */
            readonly version?: string;
            /** @description The variation of this content version, if any. Variations are used to represent different states or forms of the same content item. A variation has its own publishing lifecycle. A variation cannot be published before the default version of same locale has been published. */
            variation?: string;
            /** @description The content type of this content item. */
            readonly contentType?: string;
            /** @description The display name of this content version. */
            displayName: string;
            /**
             * Format: date-time
             * @description Indicates a time when this content was published or should be published.
             */
            published?: null | string;
            /**
             * Format: date-time
             * @description Indicates a time when this content expired or should expire.
             */
            expired?: null | string;
            /**
             * @description The status of this content version.
             * @example draft
             * @example ready
             * @example published
             * @example previous
             * @example scheduled
             * @example rejected
             * @example inReview
             */
            readonly status?: string;
            /**
             * Format: date-time
             * @description The timestamp when a scheduled version will be published. Only present when status is 'scheduled'.
             */
            readonly delayPublishUntil?: null | string;
            /** @description A string that represents the segment that should be used when routing or generating routes to the current content instance. This value will always be null when content is based on a non-routable content type. */
            routeSegment?: string;
            /** @description A simple route (shortcut URL) used to access pages and experiences. */
            simpleRoute?: string;
            /** Format: date-time */
            readonly lastModified?: string;
            readonly lastModifiedBy?: string;
            /** @description The composition structure of this content version, if any. Only relevant for experiences and sections. */
            composition?: components["schemas"]["CompositionNode"];
            /** @description Media data attached to this content version. */
            media?: components["schemas"]["MediaData"];
        };
        /** @description A single page of items in a paged collection, including paging metadata such as the current page index, page size, and an estimated total item count. */
        ContentVersionPage: {
            /** @description The items in this paged collection. */
            readonly items?: components["schemas"]["ContentVersion"][];
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
            readonly totalCount?: null | number;
        };
        /** @description A version of a content item. */
        ContentVersionPatch: components["schemas"]["ContentDataPatch"] & {
            /** @description The display name of this content version. */
            displayName?: null | string;
            /**
             * Format: date-time
             * @description Indicates a time when this content was published or should be published.
             */
            published?: null | string;
            /**
             * Format: date-time
             * @description Indicates a time when this content expired or should expire.
             */
            expired?: null | string;
            /** @description A string that represents the segment that should be used when routing or generating routes to the current content instance. This value will always be null when content is based on a non-routable content type. */
            routeSegment?: null | string;
            /** @description A simple route (shortcut URL) used to access pages and experiences. */
            simpleRoute?: null | string;
            composition?: components["schemas"]["CompositionNodePatch"];
            media?: components["schemas"]["MediaDataPatch"];
        };
        /** @description Options for copying content. */
        CopyContentOptions: {
            /** @description Optional key of the container where the copied content should be placed. */
            container?: null | string;
            /** @description Optional key of the owner where the copied content should be placed. */
            owner?: null | string;
        };
        /** @description A setting for a display template. */
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
                [key: string]: components["schemas"]["DisplaySettingChoice"];
            };
        };
        /** @description A selectable choice for a display setting. */
        DisplaySettingChoice: {
            /** @description The display name of this display setting choice. */
            displayName: string;
            /**
             * Format: int32
             * @description The sort order of this choice within the setting.
             */
            sortOrder?: number;
        };
        /** @description A display template that can be assigned to content. */
        DisplayTemplate: {
            /** @description The unique identifier (key) of the resource. */
            key?: string;
            /** @description The display name of this display template. */
            displayName: string;
            /** @description The optional node type this display template is valid for. */
            nodeType?: string;
            /**
             * @description The optional base type this display template is valid for.
             * @example _page
             * @example _component
             * @example _media
             * @example _image
             * @example _video
             * @example _folder
             * @example _experience
             * @example _section
             * @example _element
             */
            baseType?: null | string;
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
                [key: string]: components["schemas"]["DisplaySetting"];
            };
        };
        /** @description A single page of items in a paged collection, including paging metadata such as the current page index, page size, and an estimated total item count. */
        DisplayTemplatePage: {
            /** @description The items in this paged collection. */
            readonly items?: components["schemas"]["DisplayTemplate"][];
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
            readonly totalCount?: null | number;
        };
        /** @description A display template that can be assigned to content. */
        DisplayTemplatePatch: {
            /** @description The display name of this display template. */
            displayName?: null | string;
            /** @description The optional node type this display template is valid for. */
            nodeType?: null | string;
            /**
             * @description The optional base type this display template is valid for.
             * @example _page
             * @example _component
             * @example _media
             * @example _image
             * @example _video
             * @example _folder
             * @example _experience
             * @example _section
             * @example _element
             */
            baseType?: null | string;
            /** @description The optional key of the content type this display template is valid for. */
            contentType?: null | string;
            /** @description If this is the default display template for the associated base type, node type or content type. */
            isDefault?: null | boolean;
            /** @description The available settings for this display template. */
            settings?: null | {
                [key: string]: components["schemas"]["DisplaySetting"];
            };
        };
        /** @description A single value in an enumeration of possible values. */
        EnumerationValue: {
            /** @description The defined enumeration value. Value type must match the property type. */
            value: number | string | null;
            /** @description The display name of the enumeration value. */
            displayName: string;
        };
        /** @description An HTML hyperlink with URL, display text, and optional rendering properties. */
        Link: {
            /**
             * Format: uri
             * @description The URL that the link points to.
             */
            url?: null | string;
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
        /** @description A locale that can be used for content. */
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
            accessRights?: null | components["schemas"]["SecurityIdentity"][];
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
            /** @description A fallback locale that should be used if content is not available in the current locale. */
            fallback?: null | string;
        };
        /** @description A single page of items in a paged collection, including paging metadata such as the current page index, page size, and an estimated total item count. */
        LocalePage: {
            /** @description The items in this paged collection. */
            readonly items?: components["schemas"]["Locale"][];
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
            readonly totalCount?: null | number;
        };
        /** @description A locale that can be used for content. */
        LocalePatch: {
            /** @description The display name of this locale. */
            displayName?: null | string;
            /** @description Indicates whether this locale is enabled and can be used to create content. */
            isEnabled?: null | boolean;
            /** @description A string that represents the segment that should be used when routing or generate routes to the current locale */
            routeSegment?: null | string;
            /**
             * Format: int32
             * @description A value that is used when sorting locales.
             */
            sortOrder?: null | number;
            /** @description The access rights assigned to this locale that defines who can create content in this locale. If no access rights are assigned, everyone will be able to create content in this locale. An empty array means that no user will be allowed to create or change content in this locale. */
            accessRights?: null | components["schemas"]["SecurityIdentityPatch"][];
            /** @description A fallback locale that should be used if content is not available in the current locale. */
            fallback?: null | string;
        };
        /** @description A set of content model definitions (content types, property groups, display templates, and locales). */
        Manifest: {
            /** @description List of locales that are part of this manifest. */
            locales?: null | components["schemas"]["Locale"][];
            /** @description List of content type property groups that are part of this manifest. */
            propertyGroups?: null | components["schemas"]["PropertyGroup"][];
            /** @description List of content types that are part of this manifest. */
            contentTypes?: null | components["schemas"]["ContentType"][];
            /** @description List of display templates that are part of this manifest. */
            displayTemplates?: null | components["schemas"]["DisplayTemplate"][];
            /**
             * Format: date-time
             * @description A timestamp indicating the last time an item included in this manifest was modified.
             */
            lastModified?: string;
        };
        /** @description A message from a manifest import operation. */
        ManifestImportMessage: {
            /** @description The section where the message originated from. */
            section?: string;
            /** @description The message describing an outcome or error. */
            message?: string;
            /** @description The identifier of the resource that was the reason for this message to be created. */
            resource?: null | string;
        };
        /** @description The result of a manifest import operation. */
        ManifestImportResult: {
            /** @description List of messages describing the outcome from the manifest import. */
            readonly outcomes?: components["schemas"]["ManifestImportMessage"][];
            /** @description List of error messages from the manifest import. */
            readonly errors?: components["schemas"]["ManifestImportMessage"][];
        };
        /** @description Media data attached to a content item. */
        MediaData: {
            /** @description The key referencing the media. */
            key?: string;
        };
        /** @description Media data attached to a content item. */
        MediaDataPatch: Record<string, never>;
        /** @description New content and the initial data required to create it. */
        NewContent: {
            /** @description The key that identifies the content item to be created. If not provided, a new key will be generated. */
            key?: string;
            /** @description The content type for the content item to be created. */
            contentType: string;
            /** @description The key that identifies the container content where this content item should be created. */
            container?: string;
            /** @description The key that identifies the owner for the content item to be created. Content that is owned by another content is also known as an asset. */
            owner?: string;
            /** @description The key of a blueprint to use as a template for the new content item. When provided, the blueprint's composition and properties are used as defaults for the initial version. Explicit values in the request take precedence over blueprint defaults. */
            blueprint?: string;
            /** @description The initial version of the content that should be created. */
            initialVersion: components["schemas"]["ContentVersion"];
        };
        /** @description The result of creating a new content item. */
        NewContentNode: components["schemas"]["ContentNode"] & {
            /** @description The initial version of the content that was created. */
            initialVersion?: components["schemas"]["ContentVersion"];
        };
        /** @description A preview for a specific application. */
        Preview: {
            /** @description The application that this preview URL is associated with. */
            readonly application?: string;
            /** @description The preview URL (may be relative or absolute). */
            readonly url?: string;
        };
        /** @description A single page of items in a paged collection, including paging metadata such as the current page index, page size, and an estimated total item count. */
        PreviewPage: {
            /** @description The items in this paged collection. */
            readonly items?: components["schemas"]["Preview"][];
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
            readonly totalCount?: null | number;
        };
        ProblemDetails: {
            /**
             * Format: uri
             * @description A URI reference that identifies the problem type.
             */
            type?: null | string;
            /** @description A short, human-readable summary of the problem type. */
            title?: null | string;
            /**
             * Format: int32
             * @description The HTTP status code generated by the origin server for this occurrence of the problem.
             */
            status?: null | number;
            /** @description A human-readable explanation specific to this occurrence of the problem. */
            detail?: null | string;
            /**
             * Format: uri
             * @description A URI reference that identifies the specific occurrence of the problem. It may or may not yield further information if dereferenced.
             */
            instance?: null | string;
            /** @description Error code that identifies the problem type. */
            code?: null | string;
            /** @description An array of error details with more detailed information about the problem. */
            errors?: null | {
                /** @description A granular explanation of one specific error related to a field, header or query parameter. */
                detail?: string;
                /**
                 * @description A string that may provide a hint to which field that was the source of the error.
                 * @example properties.header.displayName
                 */
                field?: null | string;
            }[];
        } & {
            [key: string]: unknown;
        };
        /** @description A single property value of a content item. The value's type and format are determined by the property definition in the content type schema. */
        PropertyData: {
            /** @description The property value, which can be a string, number, boolean, object, array, or null depending on the property type defined in the content type. */
            value?: null & (string | boolean | number | components["schemas"]["Link"] | components["schemas"]["RichText"] | components["schemas"]["ContentComponent"] | Record<string, never> | (string | boolean | number | components["schemas"]["Link"] | components["schemas"]["RichText"] | components["schemas"]["ContentComponent"] | Record<string, never>)[]);
        };
        /** @description A semantic property format available to content type properties. */
        PropertyFormat: {
            /** @description The unique identifier (key) of the resource. */
            key?: string;
            /**
             * @description The underlying data type used for this property format.
             * @example string
             * @example url
             * @example boolean
             * @example integer
             * @example float
             * @example dateTime
             * @example contentReference
             * @example content
             * @example link
             * @example richText
             * @example json
             * @example array
             * @example component
             * @example composition
             */
            dataType?: string;
            /**
             * @description The underlying item type used for this property format. Specifies the item type when the dataType is 'array'.
             * @example string
             * @example url
             * @example boolean
             * @example integer
             * @example float
             * @example dateTime
             * @example contentReference
             * @example content
             * @example link
             * @example richText
             * @example json
             * @example array
             * @example component
             * @example composition
             */
            readonly itemType?: string;
            /** @description The display name of this property format. */
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
        /** @description A single page of items in a paged collection, including paging metadata such as the current page index, page size, and an estimated total item count. */
        PropertyFormatPage: {
            /** @description The items in this paged collection. */
            readonly items?: components["schemas"]["PropertyFormat"][];
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
            readonly totalCount?: null | number;
        };
        /** @description A property group of a content type. */
        PropertyGroup: {
            /** @description The unique identifier (key) of the resource. */
            key: string;
            /** @description The display name of this property group. */
            displayName: string;
            /** @description A string that indicates the source of this property group. Can be used to distinguish property groups created by the system from types coming from model classes deployed to the CMS server. */
            readonly source?: string;
            /**
             * Format: int32
             * @description A value that is used when sorting property group instances.
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
        /** @description A single page of items in a paged collection, including paging metadata such as the current page index, page size, and an estimated total item count. */
        PropertyGroupPage: {
            /** @description The items in this paged collection. */
            readonly items?: components["schemas"]["PropertyGroup"][];
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
            readonly totalCount?: null | number;
        };
        /** @description A property group of a content type. */
        PropertyGroupPatch: {
            /** @description The display name of this property group. */
            displayName?: null | string;
            /**
             * Format: int32
             * @description A value that is used when sorting property group instances.
             */
            sortOrder?: null | number;
        };
        /** @description The mapping of a single content type property to a source property. */
        PropertyMapping: {
            /** @description Specifies the path to the property on the corresponding content type to bind from. */
            from: string;
            /** @description Optional binding key that can be used to specify that an already existing binding should be used to map content properties. */
            binding?: string;
        };
        /** @description A mapping between a property in an external source and its corresponding property in the CMS. */
        PropertyMappings: {
            /** @description The key to use for the item in the source. Required if the SourceType is not of type '_Item'. */
            key?: string;
            /** @description The key to use for the item in cms. Required if the SourceType is not of type '_Item'. */
            displayName?: string;
            /**
             * @description Specifies the format of the source identifier key.
             * @example digits
             * @example digitsWithHyphens
             * @example digitsWithHyphensAndBraces
             * @example digitsWithHyphensAndParentheses
             * @example digitsWithThreeHyphens
             */
            keyFormat?: null | string;
        };
        /** @description A mapping between a property in an external source and its corresponding property in the CMS. */
        PropertyMappingsPatch: {
            /** @description The key to use for the item in cms. Required if the SourceType is not of type '_Item'. */
            displayName?: null | string;
            /**
             * @description Specifies the format of the source identifier key.
             * @example digits
             * @example digitsWithHyphens
             * @example digitsWithHyphensAndBraces
             * @example digitsWithHyphensAndParentheses
             * @example digitsWithThreeHyphens
             */
            keyFormat?: null | string;
        };
        /** @description Options for publishing a content version. */
        PublishContentOptions: {
            /**
             * Format: date-time
             * @description Gets or sets the date and time at which the content should be published, sets the version into 'scheduled' state if a future date is specified.
             */
            delayUntil?: null | string;
            /** @description Indicates if validations such as approvals and required properties should be bypassed, requires 'admin' access rights. */
            force?: boolean;
        };
        /** @description Options for transitioning a content version to ready status. */
        ReadyContentOptions: {
            /** @description An optional comment to include when starting the approval process. May be required depending on the approval definition configuration. */
            comment?: null | string;
        };
        /** @description Represents a rich text content value. */
        RichText: {
            /**
             * Format: html
             * @description A HTML representation of the rich text content. May be null to indicate no content.
             */
            html?: null | string;
        };
        /** @description A user, role, or application that can be granted access to a resource. */
        SecurityIdentity: {
            /** @description The unique name of the user, role or application that this identifier references. */
            name: string;
            /**
             * @description The type of the security entity that this identifier references. Will default to 'role' if not specified.
             * @example user
             * @example role
             * @example application
             */
            type?: string;
        };
        /** @description A user, role, or application that can be granted access to a resource. */
        SecurityIdentityPatch: {
            /** @description The unique name of the user, role or application that this identifier references. */
            name?: null | string;
            /**
             * @description The type of the security entity that this identifier references. Will default to 'role' if not specified.
             * @example user
             * @example role
             * @example application
             */
            type?: null | string;
        };
    };
    responses: {
        /** @description Bad Request */
        BadRequest: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": components["schemas"]["ProblemDetails"];
            };
        };
        /** @description Unauthorized */
        Unauthorized: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": components["schemas"]["ProblemDetails"];
            };
        };
        /** @description Forbidden */
        Forbidden: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": components["schemas"]["ProblemDetails"];
            };
        };
        /** @description Not Found */
        NotFound: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": components["schemas"]["ProblemDetails"];
            };
        };
        /** @description Conflict */
        Conflict: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": components["schemas"]["ProblemDetails"];
            };
        };
        /** @description Too Many Requests */
        TooManyRequests: {
            headers: {
                /** @description Indicates how long the client should wait before making a new request. */
                "Retry-After"?: number;
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["ProblemDetails"];
            };
        };
        /** @description Internal Server Error */
        InternalServerError: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": components["schemas"]["ProblemDetails"];
            };
        };
        /** @description Precondition Failed */
        PreconditionFailed: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/problem+json": components["schemas"]["ProblemDetails"];
            };
        };
    };
    parameters: {
        /**
         * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
         * @example [
         *       "return=representation"
         *     ]
         */
        Prefer: string[];
        /** @description Indicates which content validation rules should be bypassed. Supported values are '*' (skip all validations), 'data' (skip data validation), and 'references' (skip reference validation). Values can be combined, empty or duplicated values are ignored, and any unknown values result in a validation error. Use with caution as this may allow creation of invalid content that could cause issues in production. */
        SkipValidation: ("*" | "data" | "references")[];
        /** @description Indicates if the client accepts alternative response content in cases when the primary resource is unavailable. Empty and duplicated values are ignored. The order of values is ignored; When both are accepted, inherited resources take precedence over deleted resources. Unknown values are considered invalid. */
        AcceptResource: ("*" | "inherited" | "deleted")[];
    };
    requestBodies: never;
    headers: {
        /**
         * @description Indicates which preferences were applied to the response as per IETF RFC7240.
         * @example [
         *       "return=representation"
         *     ]
         */
        "Preference-Applied": string[];
    };
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    Applications_List: {
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
                    "application/json": components["schemas"]["ApplicationPage"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Applications_Create: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
            };
            path?: never;
            cookie?: never;
        };
        /** @description The application that should be created. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["Application"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    /** @description Indicates the URL of the newly-created resource. */
                    Location?: string;
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Application"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Applications_Get: {
        parameters: {
            query?: never;
            header?: {
                /** @description If provided and the value matches the RFC7232 ETag of the current resource a 304 NotModified response will be returned. Weak ETags will always be ignored. */
                "If-None-Match"?: string;
                /** @description If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided. */
                "If-Modified-Since"?: string;
            };
            path: {
                /** @description The key of the application to retrieve. */
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
                    "Last-Modified"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Application"];
                };
            };
            /** @description Not Modified */
            304: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Applications_Delete: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
                /** @description If provided, the DELETE request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
                "If-Match"?: string;
                /** @description If provided, the DELETE request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
                "If-Unmodified-Since"?: string;
            };
            path: {
                /** @description The key of the application to delete. */
                key: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Application"];
                };
            };
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            412: components["responses"]["PreconditionFailed"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Applications_Patch: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
                /** @description If provided, the PATCH request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
                "If-Match"?: string;
                /** @description If provided, the PATCH request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
                "If-Unmodified-Since"?: string;
            };
            path: {
                /** @description The key of the application to patch. */
                key: string;
            };
            cookie?: never;
        };
        /** @description The values of the application that should be patched formatted according to RFC7396. */
        requestBody: {
            content: {
                "application/merge-patch+json": components["schemas"]["ApplicationPatch"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Application"];
                };
            };
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            412: components["responses"]["PreconditionFailed"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
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
                    "application/json": components["schemas"]["BlueprintPage"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Blueprints_Create: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
            };
            path?: never;
            cookie?: never;
        };
        /** @description The blueprint that should be created. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["Blueprint"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    /** @description Indicates the URL of the newly-created resource. */
                    Location?: string;
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Blueprint"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Blueprints_Get: {
        parameters: {
            query?: never;
            header?: {
                /** @description If provided and the value matches the RFC7232 ETag of the current resource a 304 NotModified response will be returned. Weak ETags will always be ignored. */
                "If-None-Match"?: string;
                /** @description If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided. */
                "If-Modified-Since"?: string;
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
                    "Last-Modified"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Blueprint"];
                };
            };
            /** @description Not Modified */
            304: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Blueprints_Delete: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
                /** @description If provided, the DELETE request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
                "If-Match"?: string;
                /** @description If provided, the DELETE request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
                "If-Unmodified-Since"?: string;
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
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Blueprint"];
                };
            };
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            412: components["responses"]["PreconditionFailed"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Blueprints_Patch: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
                /** @description If provided, the PATCH request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
                "If-Match"?: string;
                /** @description If provided, the PATCH request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
                "If-Unmodified-Since"?: string;
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
                "application/merge-patch+json": components["schemas"]["BlueprintPatch"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Blueprint"];
                };
            };
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            412: components["responses"]["PreconditionFailed"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Content_Create: {
        parameters: {
            query?: never;
            header?: {
                /** @description Indicates which content validation rules should be bypassed. Supported values are '*' (skip all validations), 'data' (skip data validation), and 'references' (skip reference validation). Values can be combined, empty or duplicated values are ignored, and any unknown values result in a validation error. Use with caution as this may allow creation of invalid content that could cause issues in production. */
                "cms-skip-validation"?: components["parameters"]["SkipValidation"];
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
            };
            path?: never;
            cookie?: never;
        };
        /** @description The content item that should be created. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["NewContent"];
                "multipart/form-data": {
                    /** @description New content and the initial data required to create it. */
                    content: components["schemas"]["NewContent"];
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
                    "Last-Modified"?: string;
                    /** @description Indicates the URL of the newly-created resource. */
                    Location?: string;
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NewContentNode"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Content_Copy: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
                /** @description Indicates if the client accepts alternative response content in cases when the primary resource is unavailable. Empty and duplicated values are ignored. The order of values is ignored; When both are accepted, inherited resources take precedence over deleted resources. Unknown values are considered invalid. */
                "cms-accept-resource"?: components["parameters"]["AcceptResource"];
            };
            path: {
                /** @description The key of the content item to copy. */
                key: string;
            };
            cookie?: never;
        };
        /** @description Optional instructions for how to copy content. */
        requestBody?: {
            content: {
                "application/json": components["schemas"]["CopyContentOptions"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    /** @description Indicates the URL of the newly-created resource. */
                    Location?: string;
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContentNode"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Content_Undelete: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
            };
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
                    /** @description Indicates the standard location for the data returned in this response. */
                    "Content-Location"?: string;
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContentNode"];
                };
            };
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Content_GetNode: {
        parameters: {
            query?: never;
            header?: {
                /** @description Indicates if the client accepts alternative response content in cases when the primary resource is unavailable. Empty and duplicated values are ignored. The order of values is ignored; When both are accepted, inherited resources take precedence over deleted resources. Unknown values are considered invalid. */
                "cms-accept-resource"?: components["parameters"]["AcceptResource"];
                /** @description If provided and the value matches the RFC7232 ETag of the current resource a 304 NotModified response will be returned. Weak ETags will always be ignored. */
                "If-None-Match"?: string;
                /** @description If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided. */
                "If-Modified-Since"?: string;
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
                    "Last-Modified"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContentNode"];
                };
            };
            /** @description Not Modified */
            304: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Content_Delete: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
                /** @description Indicates that the content item should be permanently deleted immediately or if it should be soft deleted first. */
                "cms-permanent-delete"?: boolean;
                /** @description If provided, the DELETE request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
                "If-Match"?: string;
                /** @description If provided, the DELETE request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
                "If-Unmodified-Since"?: string;
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
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContentNode"];
                };
            };
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            412: components["responses"]["PreconditionFailed"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Content_PatchNode: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
                /** @description If provided, the PATCH request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
                "If-Match"?: string;
                /** @description If provided, the PATCH request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
                "If-Unmodified-Since"?: string;
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
                "application/merge-patch+json": components["schemas"]["ContentNodePatch"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContentNode"];
                };
            };
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            412: components["responses"]["PreconditionFailed"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
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
                    "application/json": components["schemas"]["ContentNodePage"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
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
                    "application/json": components["schemas"]["ContentNodePage"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
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
                    "application/json": components["schemas"]["ContentVersionPage"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Content_DeleteLocale: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
            };
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
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContentVersion"];
                };
            };
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
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
                    "application/json": components["schemas"]["ContentNodePage"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Content_ListVersions: {
        parameters: {
            query?: {
                /** @description Optional list of locales that should be included. Locale must be a valid IETF BCP-47 language tag. Use 'NEUTRAL' to include locale-neutral content. */
                locales?: string[];
                /** @description Optional list of status values that versions must have one of to be included. */
                statuses?: string[];
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
                    "application/json": components["schemas"]["ContentVersionPage"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Content_CreateVersion: {
        parameters: {
            query?: never;
            header?: {
                /** @description Indicates which content validation rules should be bypassed. Supported values are '*' (skip all validations), 'data' (skip data validation), and 'references' (skip reference validation). Values can be combined, empty or duplicated values are ignored, and any unknown values result in a validation error. Use with caution as this may allow creation of invalid content that could cause issues in production. */
                "cms-skip-validation"?: components["parameters"]["SkipValidation"];
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
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
                "application/json": components["schemas"]["ContentVersion"];
                "multipart/form-data": {
                    /** @description A version of a content item. */
                    content: components["schemas"]["ContentVersion"];
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
                    "Last-Modified"?: string;
                    /** @description Indicates the URL of the newly-created resource. */
                    Location?: string;
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContentVersion"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            409: components["responses"]["Conflict"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Content_Approve: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
                /** @description If provided, the POST request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
                "If-Match"?: string;
                /** @description If provided, the POST request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
                "If-Unmodified-Since"?: string;
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
                "application/json": components["schemas"]["ApprovalDecisionOptions"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    /** @description Indicates the standard location for the data returned in this response. */
                    "Content-Location"?: string;
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContentVersion"];
                };
            };
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            412: components["responses"]["PreconditionFailed"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Content_Draft: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
                /** @description If provided, the POST request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
                "If-Match"?: string;
                /** @description If provided, the POST request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
                "If-Unmodified-Since"?: string;
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
                    "Last-Modified"?: string;
                    /** @description Indicates the standard location for the data returned in this response. */
                    "Content-Location"?: string;
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContentVersion"];
                };
            };
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            412: components["responses"]["PreconditionFailed"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Content_Publish: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
                /** @description If provided, the POST request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
                "If-Match"?: string;
                /** @description If provided, the POST request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
                "If-Unmodified-Since"?: string;
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
                "application/json": components["schemas"]["PublishContentOptions"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    /** @description Indicates the standard location for the data returned in this response. */
                    "Content-Location"?: string;
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContentVersion"];
                };
            };
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            412: components["responses"]["PreconditionFailed"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Content_Ready: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
                /** @description If provided, the POST request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
                "If-Match"?: string;
                /** @description If provided, the POST request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
                "If-Unmodified-Since"?: string;
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
                "application/json": components["schemas"]["ReadyContentOptions"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    /** @description Indicates the standard location for the data returned in this response. */
                    "Content-Location"?: string;
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContentVersion"];
                };
            };
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            412: components["responses"]["PreconditionFailed"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Content_Reject: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
                /** @description If provided, the POST request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
                "If-Match"?: string;
                /** @description If provided, the POST request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
                "If-Unmodified-Since"?: string;
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
                "application/json": components["schemas"]["ApprovalDecisionOptions"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    /** @description Indicates the standard location for the data returned in this response. */
                    "Content-Location"?: string;
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContentVersion"];
                };
            };
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            412: components["responses"]["PreconditionFailed"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Content_GetVersion: {
        parameters: {
            query?: never;
            header?: {
                /** @description If provided and the value matches the RFC7232 ETag of the current resource a 304 NotModified response will be returned. Weak ETags will always be ignored. */
                "If-None-Match"?: string;
                /** @description If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided. */
                "If-Modified-Since"?: string;
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
                    "Last-Modified"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContentVersion"];
                };
            };
            /** @description Not Modified */
            304: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Content_DeleteVersion: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
                /** @description If provided, the DELETE request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
                "If-Match"?: string;
                /** @description If provided, the DELETE request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
                "If-Unmodified-Since"?: string;
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
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContentVersion"];
                };
            };
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            412: components["responses"]["PreconditionFailed"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Content_PatchVersion: {
        parameters: {
            query?: never;
            header?: {
                /** @description Indicates which content validation rules should be bypassed. Supported values are '*' (skip all validations), 'data' (skip data validation), and 'references' (skip reference validation). Values can be combined, empty or duplicated values are ignored, and any unknown values result in a validation error. Use with caution as this may allow creation of invalid content that could cause issues in production. */
                "cms-skip-validation"?: components["parameters"]["SkipValidation"];
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
                /** @description If provided, the PATCH request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
                "If-Match"?: string;
                /** @description If provided, the PATCH request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
                "If-Unmodified-Since"?: string;
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
                "application/merge-patch+json": components["schemas"]["ContentVersionPatch"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContentVersion"];
                };
            };
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            412: components["responses"]["PreconditionFailed"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
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
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Content_GetPreviews: {
        parameters: {
            query?: {
                /** @description Zero based index of the page that should be retrieved. */
                pageIndex?: number;
                /** @description The maximum items per page that should be retrieved. */
                pageSize?: number;
            };
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
                content: {
                    "application/json": components["schemas"]["PreviewPage"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Content_ListAllVersions: {
        parameters: {
            query?: {
                /** @description Optional list of locales that should be included. Locale must be a valid IETF BCP-47 language tag. Use 'NEUTRAL' to include locale-neutral content. */
                locales?: string[];
                /** @description Optional list of status values that versions must have one of to be included. */
                statuses?: string[];
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
                    "application/json": components["schemas"]["ContentVersionPage"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
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
                    "application/json": components["schemas"]["ContentSourcePage"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    ContentSources_Create: {
        parameters: {
            query?: never;
            header?: {
                /** @description Indicates which content validation rules should be bypassed. Supported values are '*' (skip all validations), 'data' (skip data validation), and 'references' (skip reference validation). Values can be combined, empty or duplicated values are ignored, and any unknown values result in a validation error. Use with caution as this may allow creation of invalid content that could cause issues in production. */
                "cms-skip-validation"?: components["parameters"]["SkipValidation"];
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
            };
            path?: never;
            cookie?: never;
        };
        /** @description The contentsource that should be created. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["ContentSource"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    /** @description Indicates the URL of the newly-created resource. */
                    Location?: string;
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContentSource"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    ContentSources_Get: {
        parameters: {
            query?: never;
            header?: {
                /** @description If provided and the value matches the RFC7232 ETag of the current resource a 304 NotModified response will be returned. Weak ETags will always be ignored. */
                "If-None-Match"?: string;
                /** @description If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided. */
                "If-Modified-Since"?: string;
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
                    "Last-Modified"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContentSource"];
                };
            };
            /** @description Not Modified */
            304: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    ContentSources_Delete: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
                /** @description If provided, the DELETE request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
                "If-Match"?: string;
                /** @description If provided, the DELETE request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
                "If-Unmodified-Since"?: string;
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
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContentSource"];
                };
            };
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            412: components["responses"]["PreconditionFailed"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    ContentSources_Patch: {
        parameters: {
            query?: never;
            header?: {
                /** @description Indicates which content validation rules should be bypassed. Supported values are '*' (skip all validations), 'data' (skip data validation), and 'references' (skip reference validation). Values can be combined, empty or duplicated values are ignored, and any unknown values result in a validation error. Use with caution as this may allow creation of invalid content that could cause issues in production. */
                "cms-skip-validation"?: components["parameters"]["SkipValidation"];
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
                /** @description If provided, the PATCH request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
                "If-Match"?: string;
                /** @description If provided, the PATCH request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
                "If-Unmodified-Since"?: string;
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
                "application/merge-patch+json": components["schemas"]["ContentSourcePatch"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContentSource"];
                };
            };
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            412: components["responses"]["PreconditionFailed"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
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
                    "application/json": components["schemas"]["ContentTypeBindingPage"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    ContentTypeBindings_Create: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
            };
            path?: never;
            cookie?: never;
        };
        /** @description The contenttypebinding that should be created. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["ContentTypeBinding"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    /** @description Indicates the URL of the newly-created resource. */
                    Location?: string;
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContentTypeBinding"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    ContentTypeBindings_Get: {
        parameters: {
            query?: never;
            header?: {
                /** @description If provided and the value matches the RFC7232 ETag of the current resource a 304 NotModified response will be returned. Weak ETags will always be ignored. */
                "If-None-Match"?: string;
                /** @description If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided. */
                "If-Modified-Since"?: string;
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
                    "Last-Modified"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContentTypeBinding"];
                };
            };
            /** @description Not Modified */
            304: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    ContentTypeBindings_Delete: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
                /** @description If provided, the DELETE request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
                "If-Match"?: string;
                /** @description If provided, the DELETE request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
                "If-Unmodified-Since"?: string;
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
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContentTypeBinding"];
                };
            };
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            412: components["responses"]["PreconditionFailed"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    ContentTypeBindings_Patch: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
                /** @description If provided, the PATCH request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
                "If-Match"?: string;
                /** @description If provided, the PATCH request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
                "If-Unmodified-Since"?: string;
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
                "application/merge-patch+json": components["schemas"]["ContentTypeBindingPatch"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContentTypeBinding"];
                };
            };
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            412: components["responses"]["PreconditionFailed"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
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
                    "application/json": components["schemas"]["ContentTypePage"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    ContentTypes_Create: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
            };
            path?: never;
            cookie?: never;
        };
        /** @description The content type that should be created. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["ContentType"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    /** @description Indicates the URL of the newly-created resource. */
                    Location?: string;
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContentType"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    ContentTypes_Get: {
        parameters: {
            query?: never;
            header?: {
                /** @description If provided and the value matches the RFC7232 ETag of the current resource a 304 NotModified response will be returned. Weak ETags will always be ignored. */
                "If-None-Match"?: string;
                /** @description If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided. */
                "If-Modified-Since"?: string;
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
                    "Last-Modified"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContentType"];
                };
            };
            /** @description Not Modified */
            304: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    ContentTypes_Delete: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
                /** @description If provided, the DELETE request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
                "If-Match"?: string;
                /** @description If provided, the DELETE request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
                "If-Unmodified-Since"?: string;
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
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContentType"];
                };
            };
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            412: components["responses"]["PreconditionFailed"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    ContentTypes_Patch: {
        parameters: {
            query?: never;
            header?: {
                /** @description Patch the content type even though the changes might result in data loss. */
                "cms-ignore-data-loss-warnings"?: boolean;
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
                /** @description If provided, the PATCH request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
                "If-Match"?: string;
                /** @description If provided, the PATCH request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
                "If-Unmodified-Since"?: string;
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
                "application/merge-patch+json": components["schemas"]["ContentTypePatch"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContentType"];
                };
            };
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            412: components["responses"]["PreconditionFailed"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
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
                    "application/json": components["schemas"]["DisplayTemplatePage"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    DisplayTemplates_Create: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
            };
            path?: never;
            cookie?: never;
        };
        /** @description The display template that should be created. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["DisplayTemplate"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    /** @description Indicates the URL of the newly-created resource. */
                    Location?: string;
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DisplayTemplate"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    DisplayTemplates_Get: {
        parameters: {
            query?: never;
            header?: {
                /** @description If provided and the value matches the RFC7232 ETag of the current resource a 304 NotModified response will be returned. Weak ETags will always be ignored. */
                "If-None-Match"?: string;
                /** @description If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided. */
                "If-Modified-Since"?: string;
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
                    "Last-Modified"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DisplayTemplate"];
                };
            };
            /** @description Not Modified */
            304: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    DisplayTemplates_Delete: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
                /** @description If provided, the DELETE request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
                "If-Match"?: string;
                /** @description If provided, the DELETE request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
                "If-Unmodified-Since"?: string;
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
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DisplayTemplate"];
                };
            };
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            412: components["responses"]["PreconditionFailed"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    DisplayTemplates_Patch: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
                /** @description If provided, the PATCH request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
                "If-Match"?: string;
                /** @description If provided, the PATCH request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
                "If-Unmodified-Since"?: string;
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
                "application/merge-patch+json": components["schemas"]["DisplayTemplatePatch"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DisplayTemplate"];
                };
            };
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            412: components["responses"]["PreconditionFailed"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
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
                    "application/json": components["schemas"]["LocalePage"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Locales_Create: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
            };
            path?: never;
            cookie?: never;
        };
        /** @description The locale that should be created. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["Locale"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    /** @description Indicates the URL of the newly-created resource. */
                    Location?: string;
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Locale"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Locales_Get: {
        parameters: {
            query?: never;
            header?: {
                /** @description If provided and the value matches the RFC7232 ETag of the current resource a 304 NotModified response will be returned. Weak ETags will always be ignored. */
                "If-None-Match"?: string;
                /** @description If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided. */
                "If-Modified-Since"?: string;
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
                    "Last-Modified"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Locale"];
                };
            };
            /** @description Not Modified */
            304: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Locales_Delete: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
                /** @description If provided, the DELETE request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
                "If-Match"?: string;
                /** @description If provided, the DELETE request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
                "If-Unmodified-Since"?: string;
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
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Locale"];
                };
            };
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            412: components["responses"]["PreconditionFailed"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Locales_Patch: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
                /** @description If provided, the PATCH request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
                "If-Match"?: string;
                /** @description If provided, the PATCH request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
                "If-Unmodified-Since"?: string;
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
                "application/merge-patch+json": components["schemas"]["LocalePatch"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Locale"];
                };
            };
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            412: components["responses"]["PreconditionFailed"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Manifest_Export: {
        parameters: {
            query?: {
                /** @description The sections that should be included in the manifest export. If not provided, all sections will be included. */
                sections?: string[];
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
                    "application/json": components["schemas"]["Manifest"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    Manifest_Import: {
        parameters: {
            query?: never;
            header?: {
                /** @description Indicates if manifest resources should be updated even though the changes might result in data loss. */
                "cms-ignore-data-loss-warnings"?: boolean;
            };
            path?: never;
            cookie?: never;
        };
        /** @description The manifest that should be imported. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["Manifest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ManifestImportResult"];
                };
            };
            /** @description Accepted */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
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
                    "application/json": components["schemas"]["PropertyFormatPage"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
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
                "If-None-Match"?: string;
                /** @description If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided. */
                "If-Modified-Since"?: string;
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
                    "Last-Modified"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PropertyFormat"];
                };
            };
            /** @description Not Modified */
            304: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
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
                    "application/json": components["schemas"]["PropertyGroupPage"];
                };
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    PropertyGroups_Create: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
            };
            path?: never;
            cookie?: never;
        };
        /** @description The property group that should be created. */
        requestBody: {
            content: {
                "application/json": components["schemas"]["PropertyGroup"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    /** @description Indicates the URL of the newly-created resource. */
                    Location?: string;
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PropertyGroup"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            409: components["responses"]["Conflict"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    PropertyGroups_Get: {
        parameters: {
            query?: never;
            header?: {
                /** @description If provided and the value matches the RFC7232 ETag of the current resource a 304 NotModified response will be returned. Weak ETags will always be ignored. */
                "If-None-Match"?: string;
                /** @description If provided and the resource has not been modified since the date a 304 NotModified response will be returned. This parameter will be ignored if an 'If-None-Match' parameter is also provided. */
                "If-Modified-Since"?: string;
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
                    "Last-Modified"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PropertyGroup"];
                };
            };
            /** @description Not Modified */
            304: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    PropertyGroups_Delete: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
                /** @description If provided, the DELETE request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
                "If-Match"?: string;
                /** @description If provided, the DELETE request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
                "If-Unmodified-Since"?: string;
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
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PropertyGroup"];
                };
            };
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            412: components["responses"]["PreconditionFailed"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
    PropertyGroups_Patch: {
        parameters: {
            query?: never;
            header?: {
                /**
                 * @description Indicates client preference for the response content as per IETF RFC7240. Currently only supports 'return=representation' which can be used to indicate a preference to receive a representation of the resource that has been altered in the response.
                 * @example [
                 *       "return=representation"
                 *     ]
                 */
                Prefer?: components["parameters"]["Prefer"];
                /** @description If provided, the PATCH request will only be considered if the value matches the RFC7232 ETag of the current resource. Weak ETags will always be ignored. */
                "If-Match"?: string;
                /** @description If provided, the PATCH request will only be considered if the resource has not been modified since the provided date. This parameter will be ignored if an 'If-Match' parameter is also provided. */
                "If-Unmodified-Since"?: string;
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
                "application/merge-patch+json": components["schemas"]["PropertyGroupPatch"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    /** @description The RFC7232 ETag header field in a response provides the current entity-tag for the resource. An entity-tag is an opaque identifier for different versions of a resource over time, regardless whether multiple versions are valid at the same time. */
                    ETag?: string;
                    /** @description The date and time at which the resource was last modified. */
                    "Last-Modified"?: string;
                    "Preference-Applied": components["headers"]["Preference-Applied"];
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PropertyGroup"];
                };
            };
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            403: components["responses"]["Forbidden"];
            404: components["responses"]["NotFound"];
            412: components["responses"]["PreconditionFailed"];
            429: components["responses"]["TooManyRequests"];
            500: components["responses"]["InternalServerError"];
        };
    };
}
