export type Renditions = {
  Id: string | null;
  Name: string | null;
  Url: string | null;
  Width: number | null;
  Height: number | null;
};

export type Tags = {
  Guid: string | null;
  Name: string | null;
};

/** Common fields shared across all cmp asset types */
type BaseAsset = {
  Url: string | null;
  Title: string | null;
  Description: string | null;
  Tags: Tags[] | null;
  MimeType: string | null;
};

export type PublicImageAsset = BaseAsset & {
  __typename: 'cmp_PublicImageAsset';
  Height: number | null;
  Width: number | null;
  AltText: string | null;
  Renditions: Renditions[] | null;
  FocalPoint: { X: number | null; Y: number | null } | null;
};

export type PublicVideoAsset = BaseAsset & {
  __typename: 'cmp_PublicVideoAsset';
  AltText: string | null;
  Renditions: Renditions[] | null;
};

export type PublicRawFileAsset = BaseAsset & {
  __typename: 'cmp_PublicRawFileAsset';
};
