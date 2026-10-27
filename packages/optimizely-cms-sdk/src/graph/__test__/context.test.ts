import { describe, expect, test, beforeEach } from 'vitest';
import { GraphClient } from '../index.js';
import { configureAdapter, getContext, initializeRequestContext } from '../../context/config.js';
import type { ContextAdapter } from '../../context/baseContext.js';
import { MemoryAdapter } from '../../core/context/memoryAdapter.js';
import { contentType, initContentTypeRegistry } from '../../index.js';
import { metadataResponse, stubGraph } from './helpers.js';

describe('GraphClient - Context Integration', () => {
  const TestPageContentType = contentType({
    key: 'TestPage',
    displayName: 'Test Page',
    baseType: '_page',
    properties: {
      title: { type: 'string', displayName: 'Title' },
    },
  });

  const previewParams = {
    preview_token: 'token-123',
    key: 'page-key',
    ctx: 'edit',
    ver: '1.0',
    loc: 'en-US',
  };

  const stubPreview = (client: GraphClient) =>
    stubGraph(client, {
      metadata: metadataResponse(['TestPage']),
      content: { _Content: { item: { __typename: 'TestPage', TestPage__title: 'Test' } } },
    });

  beforeEach(() => {
    initContentTypeRegistry([TestPageContentType]);
    configureAdapter(new MemoryAdapter());
    initializeRequestContext();
  });

  describe('getPreviewContent', () => {
    test('should populate global context with preview params', async () => {
      const client = new GraphClient('test-key');
      stubPreview(client);

      await client.getPreviewContent(previewParams);

      expect(getContext()).toEqual({
        previewToken: 'token-123',
        locale: 'en-US',
        key: 'page-key',
        version: '1.0',
        type: 'TestPage',
        mode: 'edit',
      });
    });

    test('should store the media token opt-in', async () => {
      const client = new GraphClient('test-key');
      stubPreview(client);

      await client.getPreviewContent(previewParams, { forceMediaToken: true });

      expect(getContext()?.mediaToken).toBe('token-123');
    });

    test('should throw error if adapter is broken', async () => {
      const fail = () => {
        throw new Error('Adapter error');
      };
      const brokenAdapter: ContextAdapter = {
        initializeContext: fail,
        getData: fail,
        setData: fail,
        set: fail,
        get: fail,
        clear: fail,
      };

      configureAdapter(brokenAdapter);
      const client = new GraphClient('test-key');
      stubPreview(client);

      await expect(client.getPreviewContent(previewParams)).rejects.toThrow('Adapter error');
    });
  });
});
