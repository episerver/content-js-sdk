# Authenticate requests to Graph

Your **single key** only sees content the **Everyone** group can read. When an editor
restricts a page through access rights in Optimizely CMS, Graph still indexes it, but it
won't return it to the single key. To fetch that content, you send a stronger credential
with the `auth` option.

> **You will learn**
>
> - How to read restricted content with `hmac`
> - How to act as a specific user
> - How to choose the credential per request
> - How to forward a signed-in user's token with `bearer`
> - How to write your own resolver
> - What changes when `auth` is set

## Read restricted content with `hmac`

The `hmac` mode signs every request with your Graph app key and secret. Copy the **App
Key** and **Secret** from **Settings → API Keys** in the CMS, in the same **Render
Content** section as the single key, and add them to `.env`:

```ini
OPTIMIZELY_GRAPH_SINGLE_KEY=<your single key>
OPTIMIZELY_GRAPH_APP_KEY=<your app key>
OPTIMIZELY_GRAPH_SECRET=<your secret>
```

Declare the key and secret once in `secrets`, then turn the mode on with `auth`:

```ts
// src/lib/optimizely.ts
import { config } from '@optimizely/cms-sdk';

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  secrets: {
    appKey: process.env.OPTIMIZELY_GRAPH_APP_KEY!,
    secret: process.env.OPTIMIZELY_GRAPH_SECRET!,
  },
  auth: { type: 'hmac' },
});
```

Every request now carries a signature instead of the single key. `hmac` authenticates as
the **tenant**, not as a person, so Graph returns everything the tenant holds, restricted
content included. `config()` throws straight away if `auth` asks for `hmac` and `secrets`
is missing or empty.

> [!WARNING]
>
> Keep the secret on the server. A request made from browser code with `hmac` set throws,
> because it would carry the secret. Fetch from a server component, route handler or API
> route instead.

<details>
<summary><b>Deep dive:</b> Why is there no Basic auth mode?</summary>

Graph also accepts HTTP Basic with the same app key and secret. The SDK leaves it out on
purpose: Basic puts the long-lived secret on the wire with every request, so anything that
terminates TLS, such as an intercepting proxy or a mis-trusted CA, walks away with a
permanent credential. `hmac` sends a per-request signature instead, and the secret never
travels.

Setting `auth: { type: 'basic' }` throws with an explanation. If Basic is unavoidable,
[write your own resolver](#write-your-own-resolver) that builds the header.

</details>

### Which versions you get

A privileged credential sees every version of a page, drafts included. So the SDK adds a
`_metadata.status` filter that keeps only `Published` content. This is the `publishedOnly`
option, and it is on by default. Turn it off when you want drafts:

```ts
import { getClient } from '@optimizely/cms-sdk';

const drafts = await getClient().getContentByPath('/news/', { publishedOnly: false });
```

To turn it off for every request, set `query: { publishedOnly: false }` in `config()`. The
filter changes nothing for the single key, which never sees drafts, and the SDK skips it
when you ask for one specific version, such as in a preview.

`hmac` also takes two flags that widen what Graph returns. Both default to `false`:

```ts
// src/lib/optimizely.ts
import { config } from '@optimizely/cms-sdk';

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  secrets: {
    appKey: process.env.OPTIMIZELY_GRAPH_APP_KEY!,
    secret: process.env.OPTIMIZELY_GRAPH_SECRET!,
  },
  auth: { type: 'hmac', includeDeleted: true, includeExpired: true },
});
```

- `includeDeleted` adds content in the CMS trash.
- `includeExpired` adds content whose stop-publish date has passed.

## Act as a user

Returning everything the tenant holds is rarely what a public page wants. Add `asUser` to
have Graph apply one user's access rights instead:

```ts
// src/lib/optimizely.ts
import { config } from '@optimizely/cms-sdk';

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  secrets: {
    appKey: process.env.OPTIMIZELY_GRAPH_APP_KEY!,
    secret: process.env.OPTIMIZELY_GRAPH_SECRET!,
  },
  auth: {
    type: 'hmac',
    asUser: { username: 'delivery', roles: ['WebDelivery', 'Members'] },
  },
});
```

The SDK sends the fields as Graph's `cg-username` and `cg-roles` headers, which Graph's
own documentation calls impersonation. You can give either field on its own, but you must
give one: an empty `asUser` throws rather than leaving the request with the tenant's full
access. `asUser` narrows by access rights only. Drafts stay hidden because of
`publishedOnly`, not because of `asUser`.

> [!WARNING]
>
> Graph doesn't verify who this user is. It trusts the app credential's word, so treat
> `asUser` as a privileged assertion. Never fill it straight from a request header or
> query parameter without establishing who the user is yourself first.

### Reading the user from the session

Who is signed in is rarely known when `config()` runs, so `asUser` also takes a callback.
The SDK awaits it on every request:

```ts
import { getClient } from '@optimizely/cms-sdk';
import { getSession } from '@/lib/session'; // your own session helper

const client = getClient({
  auth: {
    type: 'hmac',
    asUser: async () => {
      const session = await getSession();

      return { username: session.email, roles: session.roles };
    },
  },
});
```

The callback reads the current user, so create the client where the request is in scope,
as above. The next section shows how.

> [!WARNING]
>
> A callback passed to the global `config()` is shared by every visitor, so it can serve
> one visitor's content to another. Pass user-specific callbacks to `getClient()` only.

## Choose the credential per request

`config()` is global, so an `auth` set there applies to every visitor. Because `auth`
carries no secret of its own, you can leave it out of `config()` and choose it per request
with `getClient()` instead. `secrets` on its own authenticates nothing: requests stay on
the single key until an `auth` mode asks for them.

```ts
// src/lib/optimizely.ts
import { config } from '@optimizely/cms-sdk';

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  secrets: {
    appKey: process.env.OPTIMIZELY_GRAPH_APP_KEY!,
    secret: process.env.OPTIMIZELY_GRAPH_SECRET!,
  },
});
```

Then pick the credential where you fetch:

```ts
import { getClient } from '@optimizely/cms-sdk';

// Anonymous: the single key, cached by Graph.
const news = await getClient().getContentByPath('/news/');

// Signed, using the configured secrets.
const drafts = await getClient({ auth: { type: 'hmac' } }).getContentByPath('/news/', {
  publishedOnly: false,
});

// Signed, as a particular user.
const members = await getClient({
  auth: { type: 'hmac', asUser: { username: 'johan' } },
}).getContentByPath('/members/');
```

This is the **mixed-mode** pattern: public pages keep the fast single-key path, and only
gated routes pay for an authenticated one.

## Forward a signed-in user's token with `bearer`

If your users sign in through an identity provider that Graph accepts, you can forward
their token instead of signing with the app secret. The `bearer` mode sends it as
`Authorization: Bearer <token>`. The token is only known once a request is in flight, so
choose it with `getClient()`:

```tsx
// src/app/members/page.tsx
import { getClient } from '@optimizely/cms-sdk';
import { OptimizelyComponent } from '@optimizely/cms-sdk/react/server';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/session'; // your own session helper

export default async function MembersPage() {
  const session = await getSession();

  const client =
    session ?
      getClient({ auth: { type: 'bearer', token: session.accessToken } })
    : getClient(); // anonymous visitors keep the single key

  const [content] = await client.getContentByPath('/members/');

  if (!content) notFound();

  return <OptimizelyComponent content={content} />;
}
```

Tokens expire, so `token` can also be a callback. The SDK awaits it on every request, and
throws if it returns anything other than a non-empty string:

```ts
import { getClient } from '@optimizely/cms-sdk';
import { getAccessToken } from '@/lib/session'; // your own token helper

const client = getClient({
  auth: { type: 'bearer', token: () => getAccessToken() },
});
```

Unlike `hmac`, `bearer` may run in the browser. The SDK holds no secret in that case, so
keeping the token safe is up to you.

## Write your own resolver

For any scheme the built-in modes don't cover, `auth` also accepts a function that returns
the headers to send. The SDK calls it on every request and passes in the request it is
authenticating: the absolute `url`, the `method` (always `POST`) and the exact `body`
string that will be sent.

```ts
import { getClient } from '@optimizely/cms-sdk';
import { fetchGraphToken } from '@/lib/graph-token'; // your own token service

const client = getClient({
  auth: async ({ url }) => ({
    Authorization: `Bearer ${await fetchGraphToken(url)}`,
  }),
});
```

If the returned headers include no `Authorization` header, the SDK keeps the single key
and adds yours on top. A resolver can therefore contribute only `cg-username` or
`cg-roles`. If the resolver throws, or returns something other than an object, the request
fails with an `OptimizelyGraphError`.

A resolver may run in the browser. Like the `asUser` callback, a user-specific resolver
belongs in `getClient()`, not in the global `config()`.

<details>
<summary><b>Deep dive:</b> The HMAC scheme written by hand</summary>

This resolver produces the same headers as `auth: { type: 'hmac' }`. Use it as a starting
point if your scheme is similar but not covered. Prefer the built-in mode otherwise: it
needs no Node built-ins, so it also runs on edge runtimes.

```ts
import { createHash, createHmac, randomUUID } from 'node:crypto';
import { config } from '@optimizely/cms-sdk';

const appKey = process.env.OPTIMIZELY_GRAPH_APP_KEY!;
const secret = process.env.OPTIMIZELY_GRAPH_SECRET!;

config({
  apiKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,

  auth: ({ url, method, body }) => {
    const { pathname, search } = new URL(url);
    const timestamp = Date.now().toString();
    const nonce = randomUUID();
    const bodyHash = createHash('md5').update(body).digest('base64');

    const message = [appKey, method, pathname + search, timestamp, nonce, bodyHash].join(
      '',
    );
    const signature = createHmac('sha256', Buffer.from(secret, 'base64'))
      .update(message)
      .digest('base64');

    return {
      Authorization: `epi-hmac ${appKey}:${timestamp}:${nonce}:${signature}`,
      'cg-roles': 'WebDelivery',
    };
  },
});
```

The secret is base64 encoded, and the signature uses the bytes it decodes to, not the text
itself.

</details>

## What changes when `auth` is set

- **Caching and stored queries are off by default.** A client with `auth` stops sending
  `cache=true` and `stored=true`, because responses can differ per identity.
- **Live preview is unaffected.** A preview token is a credential of its own, so it takes
  precedence and the SDK doesn't consult `auth` for that request.
- **Authenticated requests are slower than the single key.** They bypass Graph's fast read
  path, so use them for gated routes rather than for every public page.

> [!WARNING]
>
> An explicit `query: { cache: true }` or `query: { stored: true }` in `config()` also
> applies to every client you create with `getClient({ auth })`. Only set them globally if
> no request uses `auth`, or override them per request.

<details>
<summary><b>Deep dive:</b> Why are caching and stored queries off when <code>auth</code> is set?</summary>

The SDK generates the same query text for a given content type, whichever credential runs
it. With caching on, a gated request and an anonymous one can collide on the same cache
entry, so one visitor may receive content fetched for another.

Stored queries are the more dangerous of the two. Graph keys a stored query's result by
the query text rather than by the credential that ran it. Opt back in with `cache: true`
or `stored: true` only where the response doesn't vary by identity.

</details>

## Recap

- The single key only sees content the Everyone group can read. Set `auth` to see more.
- `hmac` signs with the `secrets` you declare in `config()`, and only runs on the server.
- `asUser` applies one user's access rights. Graph trusts it, so establish the user first.
- Leave `auth` out of `config()` and choose it per request with `getClient({ auth })`.
- `bearer` forwards a token you already hold. A resolver covers any other scheme.
- `auth` turns caching and stored queries off. `publishedOnly` keeps drafts out.

## Related

- [`config()` options](../reference/config.md)
- [GraphClient](../reference/graph-client.md)
- [Live preview](../learn/live-preview.md)
- [Observability](./observability.md)
