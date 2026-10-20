# Writing the docs

This page is for anyone adding to or editing the files in `docs/`. It describes how the
docs are organised, how a page is shaped and how it should read, so that every page feels
like part of the same set.

The model is the [React docs](https://react.dev/learn): short pages, one idea at a time,
examples before explanations, and a clear split between learning and looking things up.

## Where a page belongs

The docs have three sections. Decide which one a page belongs to before writing it.

| Section                      | Reader's question                     | Shape                                           |
| ---------------------------- | ------------------------------------- | ----------------------------------------------- |
| [`learn/`](./learn/)         | "How do I get started?"               | A linear tutorial. Each page builds on the last |
| [`guides/`](./guides/)       | "How do I do X?" / "How does X work?" | A standalone page about one topic               |
| [`reference/`](./reference/) | "What exactly does X accept?"         | Exhaustive and uniform. Scanned, not read       |

A few rules of thumb:

- **Learn** pages show one way to do each thing, and only what the reader needs right now.
  Options, alternatives and edge cases go in a guide or the reference.
- **Guides** explain a feature from the ground up and link to the reference for the full
  option list. They do not repeat it.
- **Reference** pages list everything, including options nobody needs on day one. They do
  not teach.

If you are writing the same explanation a second time, link to the first one instead.

## Voice

- Write to the reader as **you**, never "we", "the user" or "the developer".
- Use the present tense and the active voice: "The SDK adds the fragment", not "The
  fragment will be added".
- Explain why before how. One sentence of motivation is usually enough.
- Keep paragraphs to four sentences or fewer.
- Leave out marketing words such as "powerful", "seamless", "sophisticated" and "simply".
  They add nothing a reader can act on.
- Introduce a term in **bold** where it is defined, then use it the same way everywhere.
  See [Terminology](#terminology).

## Page templates

### Learn and guide pages

````md
# Fetch content

One or two sentences: what the reader will do on this page and why it matters.

> **You will learn**
>
> - How to configure the client once
> - How to fetch a page by its URL

## Configure the client

A short paragraph, then a complete example:

```ts
// src/app/layout.tsx
import { config } from '@optimizely/cms-sdk';
…
```

One line on the part of the example that matters.

## Fetch a page by its URL

…

## Recap

- Configure the client once with `config()`.
- Fetch content anywhere with `getClient()`.

**Next:** [Render with React →](./render-with-react.md)
````

- The title says what the reader will do ("Fetch content"), not what the page is
  ("Fetching").
- The "You will learn" bullets match the `##` sections, in order.
- Learn pages end with **Next**. Guides end with a **Related** list of two to four links
  instead.
- Keep Learn pages under about 200 lines. If one grows past that, the extra detail belongs
  in a guide or the reference.

### Reference pages

````md
# getContentByPath

Fetches the content published at a URL path.

```ts
client.getContentByPath(path, options?)
```

## Reference

### Parameters

- `path` — …
- `options` (optional) — …

### Returns

…

### Caveats

- …

## Usage

### Fetching a page for a route

The smallest working example comes first.

### Fetching from a specific site

…

## Troubleshooting

### I get an empty array

…
````

When one reference page documents several functions, repeat the `## Reference` /
`## Usage` pair under a `##` heading per function.

## Headings

- Use sentence case: "Configure the client", not "Configure The Client".
- Phrase guide and Learn headings as tasks or questions: "Restricting which types a
  property accepts", "Why use `getClient()`?".
- Don't skip levels, and don't go deeper than `####`.

## Code examples

- **Make every example paste-ready.** Include the imports. On the first line, put a
  comment with the file path when the location matters.
- **Show one way.** Use `config()` + `getClient()` in Learn and guide pages.
  `new GraphClient()` appears only in the reference.
- **Start minimal.** Show the smallest example that works, then add to it in later
  sections.
- **Use realistic names**, such as `ArticleContentType` and `HeroComponent`, not `Foo` or
  `MyType`.
- **Avoid `any`.** Type props with `ContentProps<typeof X>`.
- **Use the right fence language**: `ts`, `tsx`, `js` for `.mjs` files, `sh` for terminal
  commands, `ini` for `.env` files.
- **Keep every snippet valid code.** Prettier formats code blocks as well, and it misreads
  fragments: a bare `{ key: value }` is parsed as a block. Assign it to a variable
  instead.
- **Write CLI commands as `npx @optimizely/cms-cli@latest <command>`** in Learn pages, so
  they work without an install. Use the shorter `optimizely-cms-cli <command>` in guides
  and the reference.

## Callouts and deep dives

Use
[GitHub alerts](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts)
at most once per section:

| Alert          | Use it for                                   |
| -------------- | -------------------------------------------- |
| `> [!NOTE]`    | An aside the reader can skip                 |
| `> [!TIP]`     | A shortcut or better way                     |
| `> [!WARNING]` | A pitfall: something that silently breaks    |
| `> [!CAUTION]` | Something that loses data or can't be undone |

`> [!IMPORTANT]` is rarely needed. If something is important, it usually belongs in the
main text.

The alert marker must sit on its own line, followed by an empty `>` line. Without the
empty line, Prettier joins the marker onto the text and GitHub renders it as a plain
quote. GitHub also doesn't support custom titles, so `> [!NOTE] My title` renders the
marker literally.

```md
> [!WARNING]
>
> The text of the warning.
```

Put background that most readers can skip in a collapsible **deep dive**:

```md
<details>
<summary><b>Deep dive:</b> Why are caching and stored queries off when <code>auth</code> is set?</summary>

The explanation, with a blank line after the summary so markdown renders inside.

</details>
```

## Terminology

| Term                     | Meaning                                                                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| **content type**         | A schema defined with `contentType()`, such as `Article`                                                                |
| **base type**            | What a content type is built on: `_page`, `_experience`, `_component`, `_section`, `_folder`, `_image`, …               |
| **component**            | A content type with base type `_component`. The CMS UI calls this a "block". Say so once per page, then use "component" |
| **contract**             | A reusable set of properties, defined with `contract()`, that content types extend                                      |
| **experience**           | A routable content type built in Visual Builder (`_experience`)                                                         |
| **section**, **element** | The building blocks of an experience's composition                                                                      |
| **display template**     | A set of editor-selectable style settings, defined with `displayTemplate()`                                             |
| **Graph**                | Optimizely Graph, the API the SDK fetches content from                                                                  |
| **single key**           | The read-only Graph key used by default                                                                                 |
| **the CLI**              | `@optimizely/cms-cli`, which pushes content types to the CMS                                                            |

Write "Optimizely CMS" in full the first time on a page, and "the CMS" after that.

## Formatting

- Wrap prose at 90 columns, matching `proseWrap` in `.prettierrc`. Markdown is in
  `.prettierignore`, so format a page explicitly with
  `npx prettier --write --ignore-path= docs/path/to/page.md`.
- Use relative links between docs (`./guides/forms.md`), with an anchor where it helps
  (`./reference/config.md#fragment`).
- Store images in `docs/images/` and give every image meaningful alt text.
- Version upgrade notes go only in `reference/migration-v3.md`. Guides describe the
  current behaviour.

## Moving or renaming a page

Update every link to the old path in the same change. Links live in other docs, the
READMEs (the package READMEs use absolute GitHub URLs), the samples and source comments:

```sh
git grep -n "docs/old-page.md"
```
