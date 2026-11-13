---
'@optimizely/cms-sdk': minor
'@optimizely/cms-cli': minor
---

[CMS-58287](https://optimizely-ext.atlassian.net/browse/CMS-58287): Add typed client and `generate client` CLI command

`createClient()` wraps `GraphClient` with per-content-type namespaces whose return types
and sort fields are inferred from the content type definition. `createClientFromRegistry()`
does the same from the runtime registry, without compile-time narrowing.

```ts
import { getClient, createClient } from '@optimizely/cms-sdk';
import { NewsPage } from './content-types';

const client = createClient(getClient(), { news: NewsPage });

const items = await client.news.getItems('/blog', {
  sort: { field: 'publishDate', direction: 'desc' },
});
```

The new CLI command `optimizely-cms-cli generate client` scans content type files from
`optimizely.config.mjs` and generates the typed client file automatically.
