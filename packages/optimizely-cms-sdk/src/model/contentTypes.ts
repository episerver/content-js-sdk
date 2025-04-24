import { AnyProperty } from './properties';

/** All possible content types */
export type AnyContentType =
  | ComponentContentType
  | ExperienceContentType
  | OtherContentTypes;

/** A "Base" content type that includes all common attributes for all content types */
type BaseContentType = {
  key: string;
  displayName?: string;
  properties?: Record<string, AnyProperty>;
};

/** Represents the "Component" type (also called "Block") in CMS */
export type ComponentContentType = BaseContentType & {
  baseType: 'component';
  compositionBehaviors?: ('sectionEnabled' | 'elementEnabled')[];
};

export type ExperienceContentType = BaseContentType & {
  baseType: 'experience';
};

/** Represents all other types in CMS. They don't have any additional property */
export type OtherContentTypes = BaseContentType & {
  baseType:
    | 'page'
    | 'media'
    | 'image'
    | 'video'
    | 'folder'
    // | "section" -- not allowed
    | 'element';
};

export type ContentType<T = AnyContentType> = T & { __type: 'contentType' };

export type MediaStringTypes = 'Image' | 'Video' | 'Media';

export type ContentOrMediaType = ContentType | MediaStringTypes;
