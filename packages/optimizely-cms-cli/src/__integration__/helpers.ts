import { createRestApiClient } from '../service/cmsRestClient.js';

export const createTestRestClient = () =>
  createRestApiClient({
    clientId: process.env.OPTIMIZELY_CMS_CLIENT_ID!,
    clientSecret: process.env.OPTIMIZELY_CMS_CLIENT_SECRET!,
  });

export const generateTestPrefix = () =>
  `TEST_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_`;

export const skipCleanup = () =>
  process.env.INTEGRATION_TEST_SKIP_CLEANUP === 'true';

export const cleanupTestContentTypes = async (
  client: any,
  prefix: string
) => {
  const { data } = await client.GET('/contenttypes');
  const testTypes = (data?.items ?? []).filter(
    (ct: any) => ct.key.startsWith(prefix)
  );

  await Promise.allSettled(
    testTypes.map((type: any) =>
      client.DELETE('/contenttypes/{key}', {
        params: { path: { key: type.key } },
      })
    )
  );
};
