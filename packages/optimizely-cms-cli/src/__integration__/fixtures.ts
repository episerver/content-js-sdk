export const createMinimalPageType = (key: string) => ({
  key,
  baseType: '_page',
  displayName: `Test Page ${key}`,
  properties: {
    heading: {
      type: 'string',
      displayName: 'Heading',
      isRequired: true,
    },
    body: {
      type: 'richText',
      displayName: 'Body',
    },
  },
});

export const createMinimalComponentType = (key: string) => ({
  key,
  baseType: '_component',
  displayName: `Test Component ${key}`,
  properties: {
    text: {
      type: 'string',
      displayName: 'Text',
    },
  },
});

export const createManifestPayload = (contentTypes: any[]) => ({
  contentTypes,
  displayTemplates: [],
});
