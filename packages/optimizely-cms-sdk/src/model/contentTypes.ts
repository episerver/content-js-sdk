import { AnyProperty } from './properties';

/** All possible content types */
export type AnyContentType = Component | Experience | Others;

/** A "Base" content type that includes all common attributes for all content types */
type Base = {
  key: string;
  displayName?: string;
  properties?: Record<string, AnyProperty>;
};

/** Represents the "Component" type (also called "Block") in CMS */
export type Component = Base & {
  baseType: 'component';
  compositionBehaviors?: ('sectionEnabled' | 'elementEnabled')[];
};

export type Experience = Base & {
  baseType: 'experience';
};

/** Represents all other types in CMS. They don't have any additional property */
export type Others = Base & {
  baseType:
    | 'page'
    | 'media'
    | 'image'
    | 'video'
    | 'folder'
    // | "section" -- not allowed
    | 'element';
};
