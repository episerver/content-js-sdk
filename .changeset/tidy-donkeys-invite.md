---
'@optimizely/cms-sdk': patch
'@optimizely/cms-cli': patch
---

[CMS-56470](https://optimizely-ext.atlassian.net/browse/CMS-56470): Register contracts alongside the content types that extend them

Rendering a page whose content area accepted a content type implementing a contract threw `Content type "<name>Contract" is not available in the component registry`, because query generation looks a contract fragment up by key but nothing ever put the contract in the registry.

- `initContentTypeRegistry()` now also registers any contract reached through a registered type's `extends`, so existing applications need no change.
- `optimizely-cms-cli config pull` now includes contracts in the generated `registry.ts`, which also covers contracts used only in `allowedTypes`/`restrictedTypes`.
