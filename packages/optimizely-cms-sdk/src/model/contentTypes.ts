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
  baseType: '_component';
  compositionBehaviors?: ('sectionEnabled' | 'elementEnabled')[];
};

export type ExperienceContentType = BaseContentType & {
  baseType: '_experience';
};

// This content type is used only internally
export type SectionContentType = BaseContentType & {
  baseType: '_section';
};

export type BaseTypes =
  | '_page'
  | '_media'
  | '_image'
  | '_video'
  | '_folder'
  | '_element';

/** Represents all other types in CMS. They don't have any additional property */
export type OtherContentTypes = BaseContentType & {
  baseType: BaseTypes;
};

export type ContentType<T = AnyContentType> = T & { __type: 'contentType' };

export type MediaStringTypes = '_Image' | '_Video' | '_Media';

export type ContentOrMediaType = ContentType | MediaStringTypes;
