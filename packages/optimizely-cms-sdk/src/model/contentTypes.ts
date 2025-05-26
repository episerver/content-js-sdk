import { AnyProperty } from './properties';

/** All possible content types */
export type AnyContentType =
  | ComponentContentType
  | ExperienceContentType
  // Note: Add `SectionContentType` when users can create their own
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

// This content type is used only internally
export type SectionContentType = BaseContentType & {
  baseType: 'section';
};

export type BaseTypes =
  | 'page'
  | 'media'
  | 'image'
  | 'video'
  | 'folder'
  | 'element';

/** Represents all other types in CMS. They don't have any additional property */
export type OtherContentTypes = BaseContentType & {
  baseType: BaseTypes;
};

export type ContentType<T = AnyContentType> = T & { __type: 'contentType' };

export type MediaStringTypes = '_Image' | '_Video' | '_Media';

export type ContentOrMediaType = ContentType | MediaStringTypes;
