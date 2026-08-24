import { describe, it, expect } from 'vitest';
import { contentType, contract, initContentTypeRegistry } from '../../model/index.js';
import { createFragment } from '../createQuery.js';

// Mirrors the namespaced entries in templates/alloy/src/content-types/manifest.ts.
// Namespaced keys (graph:, globalcontract:) must strip to bare GraphQL type names.
const graphcmp_AssetLabelGroupCT = contentType({
  key: 'graph:cmp_AssetLabelGroup',
  displayName: 'cmp_AssetLabelGroup',
  baseType: '_component',
  properties: {
    Id: { type: 'string', group: 'Content' },
    Name: { type: 'string', group: 'Content' },
  },
});

const globalcontract_MetadataCT = contentType({
  key: 'globalcontract:_Metadata',
  displayName: '_Metadata',
  baseType: '_component',
  properties: {
    type: { type: 'string', group: 'Content' },
    lastModified: { type: 'dateTime', group: 'Content' },
    displayName: { type: 'string', group: 'Content' },
    key: { type: 'string', group: 'Content' },
  },
});

const globalcontract_ItemContract = contract({
  key: 'globalcontract:_Item',
  displayName: '_Item',
  properties: {
    _id: { type: 'string', isRequired: true, group: 'Content', displayMode: 'hidden' },
    _itemMetadata: {
      type: 'component',
      contentType: globalcontract_MetadataCT,
      group: 'Content',
      displayMode: 'hidden',
    },
  },
});

describe('manifest namespace prefixes', () => {
  it('graph: contentType -> bare cmp_ fragment', () => {
    initContentTypeRegistry([graphcmp_AssetLabelGroupCT]);
    const { fragments } = createFragment('graph:cmp_AssetLabelGroup');
    expect(fragments).toMatchInlineSnapshot(`
      [
        "fragment cmp_AssetLabelGroup on cmp_AssetLabelGroup { __typename cmp_AssetLabelGroup__Id:Id cmp_AssetLabelGroup__Name:Name }",
      ]
    `);
  });

  it('globalcontract: contract -> _I interface fragment', () => {
    initContentTypeRegistry([globalcontract_ItemContract, globalcontract_MetadataCT]);
    const { fragments } = createFragment('globalcontract:_Item');
    expect(fragments).toMatchInlineSnapshot(`
      [
        "fragment _MetadataProperty on _Metadata { __typename _MetadataProperty__type:type _MetadataProperty__lastModified:lastModified _MetadataProperty__displayName:displayName _MetadataProperty__key:key }",
        "fragment _Item on _IItem { __typename _Item___id:_id _Item___itemMetadata:_itemMetadata { ..._MetadataProperty } }",
      ]
    `);
  });
});
