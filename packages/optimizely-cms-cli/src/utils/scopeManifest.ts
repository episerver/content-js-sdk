import { PropertyGroupType } from '@optimizely/cms-sdk';

// remaining manifest fields are passed through untouched
type Passthrough = { [prop: string]: unknown };

type ScopableManifest = {
  contentTypes: ({
    key: string;
    properties?: Record<string, { group?: string } & Passthrough>;
  } & Passthrough)[];
  displayTemplates: ({ key: string; contentType?: string } & Passthrough)[];
  propertyGroups: PropertyGroupType[];
};

const usedGroupKeys = (contentTypes: ScopableManifest['contentTypes']) =>
  new Set(
    contentTypes.flatMap(it =>
      Object.values(it.properties ?? {}).flatMap(prop => prop.group ?? []),
    ),
  );

/** Returns the keys that match no content type, contract or display template in the manifest */
export const findUnknownKeys = (manifest: ScopableManifest, keys: string[]) => {
  const knownKeys = new Set(
    [...manifest.contentTypes, ...manifest.displayTemplates].map(it => it.key),
  );

  return keys.filter(key => !knownKeys.has(key));
};

/**
 * Reduces the manifest to the given keys: matching content types and contracts,
 * display templates matched by key or by content type, and the property groups they use.
 */
export const scopeManifest = (
  manifest: ScopableManifest,
  keys: string[],
): ScopableManifest => {
  const keySet = new Set(keys);
  const contentTypes = manifest.contentTypes.filter(it => keySet.has(it.key));
  const displayTemplates = manifest.displayTemplates.filter(
    it =>
      keySet.has(it.key) || (it.contentType !== undefined && keySet.has(it.contentType)),
  );
  const groupKeys = usedGroupKeys(contentTypes);

  return {
    contentTypes,
    displayTemplates,
    propertyGroups: manifest.propertyGroups.filter(it => groupKeys.has(it.key)),
  };
};
