# RichText

A React component that renders a rich text property from its `json` field.

```tsx
import { RichText } from '@optimizely/cms-sdk/react/richText';

<RichText content={content.body?.json} />;
```

## Reference

### Props

| Prop                  | Type                                               | Default | Description                                            |
| --------------------- | -------------------------------------------------- | ------- | ------------------------------------------------------ |
| `content`             | `{ type: 'richText', children: Node[] } \| string` |         | The `json` field of a rich text property. Optional     |
| `elements`            | `ElementMap`                                       | `{}`    | Components that replace the default element for a type |
| `leafs`               | `LeafMap`                                          | `{}`    | Components that replace the default element for a mark |
| `decodeHtmlEntities`  | `boolean`                                          | `true`  | Decode entities such as `&lt;` and `&amp;` in text     |
| Any `<div>` attribute | `React.HTMLAttributes<HTMLDivElement>`             |         | Wraps the output in a `<div>` with these attributes    |

- **`content`** accepts the tree as an object or as a JSON string, because Graph returns
  either, depending on the CMS version. A string that isn't valid JSON, or a value without
  a `children` array, renders nothing. So does `undefined`.
- **`elements`** and **`leafs`** are merged over the defaults, so you only list the types
  you change. Keys are matched case-insensitively.
- **`<div>` attributes**, such as `className` or the output of `pa()`, wrap the output in
  a `<div>`. Without them, `<RichText>` renders a fragment.

### Element types

Each element type in the tree renders as the HTML element below unless you replace it in
`elements`.

| Group             | Types → tag                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Blocks            | `paragraph` → `p`, `div` → `div`, `quote` → `blockquote`                                                                                         |
| Headings          | `heading-one` … `heading-six` → `h1` … `h6`                                                                                                      |
| Lists             | `bulleted-list` → `ul`, `numbered-list` → `ol`, `list-item` → `li`                                                                               |
| Code              | `code`, `pre`, `var`, `samp`                                                                                                                     |
| Inline text       | `span`, `mark`, `strong`, `em`, `u`, `s`, `i`, `b`, `small`, `sub`, `sup`, `ins`, `del`, `kbd`, `abbr`, `cite`, `dfn`, `q`, `data`, `bdo`, `bdi` |
| Links and buttons | `link` → `a`, `a`, `button`, `label`                                                                                                             |
| Media             | `image` → `img`, `img`, `canvas`                                                                                                                 |
| Forms             | `input`, `select`, `option`, `textarea`                                                                                                          |
| Line breaks       | `br`, `wbr`                                                                                                                                      |
| Tables            | `table`, `thead`, `tbody`, `tfoot`, `caption`, `tr`, `td`, `th`                                                                                  |
| Root              | `richText` → `div` with the class `cms:rich-text`                                                                                                |

A type without an arrow renders as the tag of the same name. `image`, `img`, `input`, `br`
and `wbr` render without children.

### Leaf types

| Mark            | Tag      |
| --------------- | -------- |
| `bold`          | `strong` |
| `italic`        | `em`     |
| `underline`     | `u`      |
| `strikethrough` | `s`      |
| `code`          | `code`   |

A mark is any property on a text node whose value is `true`. Any other key in `leafs`,
such as `highlight`, handles a custom mark of that name.

### `ElementProps`

The props a component in `elements` receives.

| Prop         | Type                      | Description                                                                                    |
| ------------ | ------------------------- | ---------------------------------------------------------------------------------------------- |
| `children`   | `ReactNode`               | The rendered child nodes                                                                       |
| `element`    | `Element`                 | The node, including any custom fields. Narrow it with a cast, such as `element as LinkElement` |
| `attributes` | `Record<string, unknown>` | The node's attributes, before they are converted to React props. Optional                      |
| `text`       | `string`                  | The plain text of the node and its descendants. Optional                                       |

For a `link`, `element.url` holds the link target. For an `image`, it holds the image URL.

### `LeafProps`

The props a component in `leafs` receives.

| Prop         | Type                      | Description                                          |
| ------------ | ------------------------- | ---------------------------------------------------- |
| `children`   | `ReactNode`               | The text, already wrapped by any inner marks         |
| `leaf`       | `Text`                    | `{ text, [mark]: true }` for the mark being rendered |
| `attributes` | `Record<string, unknown>` | Always empty for leaves. Optional                    |
| `text`       | `string`                  | The text. Optional                                   |

### Exports

Everything below is exported from `@optimizely/cms-sdk/react/richText`.

**Component:** `RichText`.

**Prop types:** `RichTextProps`, `ElementProps`, `LeafProps`, `ElementRendererProps`,
`LinkElementProps`, `ImageElementProps`, `TableElementProps`,
`TableCellElementRendererProps`, `ElementMap`, `LeafMap`.

**Node types:** `Node`, `Element`, `Text`, `BaseElement`, `GenericElement`,
`GenericElementType`, `LinkElement`, `ImageElement`, `TableElement`, `TableCellElement`,
`ElementType`, `MarkType`.

| Node type          | Fields beyond `children`                                                        |
| ------------------ | ------------------------------------------------------------------------------- |
| `LinkElement`      | `type: 'link'`, `url`, `target?`, `rel?`, `title?`                              |
| `ImageElement`     | `type: 'image'`, `url`, `alt?`, `title?`, `width?`, `height?`, `loading?`       |
| `TableElement`     | `type: 'table'`, `border?`, `cellpadding?`, `cellspacing?`, `width?`, `height?` |
| `TableCellElement` | `type: 'td' \| 'th'`, `colspan?`, `rowspan?`, `scope?`                          |
| `GenericElement`   | `type`, plus any custom field                                                   |

**Factories** that build the default components, for reuse in `elements` and `leafs`:

| Function                                 | Returns                                                                 |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| `createHtmlComponent(tag, config?)`      | An element component that renders `tag`                                 |
| `createLeafComponent(tag, config?)`      | A leaf component that renders `tag`                                     |
| `createLinkComponent(tag?, config?)`     | A link component that maps `url` to `href`. `tag` defaults to `'a'`     |
| `createImageComponent(tag?, config?)`    | An image component that maps `url` to `src`. `tag` defaults to `'img'`  |
| `createTableComponent(tag?, config?)`    | A table component. `tag` defaults to `'table'`                          |
| `createTableCellComponent(tag, config?)` | A table cell component for `'td'` or `'th'`                             |
| `createSelectComponent(config?)`         | A `select` component that sets `defaultValue` from its selected options |
| `generateDefaultElements()`              | The full default `ElementMap`                                           |
| `generateDefaultLeafs()`                 | The full default `LeafMap`                                              |

`config` has three optional fields: `className` (added to the element's own classes),
`attributes` (extra props, which win over the node's) and `selfClosing` (render without
children, `createHtmlComponent` only).

### How attributes are converted

Before an element renders, the SDK turns the node's fields into React props:

1. It drops `url`, `children`, `type`, `internal` and `base`. A `link`'s `url` becomes
   `href`, and an `image`'s `url` becomes `src`. On any other element, `url` becomes
   `data-url`.
2. It moves CSS properties into `style`, camelCased: `font-size: '16px'` becomes
   `style.fontSize`. A `style` string, such as `'color: red; margin: 0'`, is parsed into
   `style` too.
3. It renames HTML attributes React spells differently, such as `class` → `className`.
   Attributes that aren't in the mapping, including every `aria-*` and `data-*` attribute,
   pass through unchanged.

Some rules apply on top of that:

- **`border`, `width` and `height`** stay HTML attributes on `table`, `img`, `input` and
  `canvas`. On every other element, including `td` and `th`, they move to `style`.
- **Keys without the `text-` prefix**, such as `decoration` or `align`, resolve to
  `text-decoration` and `text-align` when only the prefixed name is a CSS property.
- **Boolean attributes** become `true` or `false`. An attribute is `true` when present,
  whatever its value, unless the value is the string `'false'`. This applies to
  `allowfullscreen`, `async`, `autofocus`, `autoplay`, `checked`, `controls`, `defer`,
  `disabled`, `formnovalidate`, `hidden`, `inert`, `ismap`, `itemscope`, `loop`,
  `multiple`, `muted`, `nomodule`, `novalidate`, `open`, `playsinline`, `readonly`,
  `required`, `reversed` and `selected`.
- **`hidden="until-found"`** keeps its value.
- **`class` and `className`** on the same node are joined.
- **`selected`** is removed. A `select` gets a `defaultValue` from the options marked
  `selected` instead, as React expects.
- **`image` elements** get the request's preview token appended to `src` when the preview
  was fetched with `forceMediaToken: true`. Otherwise the preview component adds it to
  images that fail to load.

<details>
<summary><b>Deep dive:</b> HTML attribute → React prop mapping</summary>

| HTML attribute                        | React prop        |
| ------------------------------------- | ----------------- |
| `class`                               | `className`       |
| `for`                                 | `htmlFor`         |
| `colspan`                             | `colSpan`         |
| `rowspan`                             | `rowSpan`         |
| `cellpadding`                         | `cellPadding`     |
| `cellspacing`                         | `cellSpacing`     |
| `tabindex`, `tab-index`               | `tabIndex`        |
| `readonly`                            | `readOnly`        |
| `maxlength`                           | `maxLength`       |
| `minlength`                           | `minLength`       |
| `autocomplete`                        | `autoComplete`    |
| `autofocus`                           | `autoFocus`       |
| `checked`                             | `defaultChecked`  |
| `autoplay`                            | `autoPlay`        |
| `contenteditable`, `content-editable` | `contentEditable` |
| `spellcheck`                          | `spellCheck`      |
| `novalidate`                          | `noValidate`      |
| `crossorigin`                         | `crossOrigin`     |
| `usemap`                              | `useMap`          |
| `ismap`                               | `isMap`           |
| `itemscope`                           | `itemScope`       |
| `nomodule`                            | `noModule`        |
| `allowfullscreen`                     | `allowFullScreen` |
| `frameborder`                         | `frameBorder`     |
| `playsinline`                         | `playsInline`     |
| `srcset`                              | `srcSet`          |
| `srcdoc`                              | `srcDoc`          |
| `srclang`                             | `srcLang`         |
| `accept-charset`                      | `acceptCharset`   |
| `http-equiv`                          | `httpEquiv`       |
| `charset`                             | `charSet`         |
| `datetime`                            | `dateTime`        |
| `hreflang`                            | `hrefLang`        |
| `formaction`                          | `formAction`      |
| `formenctype`                         | `formEnctype`     |
| `formmethod`                          | `formMethod`      |
| `formnovalidate`                      | `formNoValidate`  |
| `formtarget`                          | `formTarget`      |
| `enctype`                             | `encType`         |
| `accesskey`                           | `accessKey`       |
| `autocapitalize`                      | `autoCapitalize`  |
| `referrerpolicy`                      | `referrerPolicy`  |

Attribute names are matched case-insensitively.

</details>

<details>
<summary><b>Deep dive:</b> CSS properties moved to <code>style</code></summary>

| Group                  | Properties                                                                                                                                                                                                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sizing                 | `min-width`, `max-width`, `min-height`, `max-height`, plus `width` and `height` outside `table`, `img`, `input` and `canvas`                                                                                                                                                                                         |
| Spacing                | `margin`, `margin-top`, `margin-right`, `margin-bottom`, `margin-left`, `padding`, `padding-top`, `padding-right`, `padding-bottom`, `padding-left`                                                                                                                                                                  |
| Typography             | `font`, `font-family`, `font-size`, `font-weight`, `font-style`, `font-variant`, `line-height`, `letter-spacing`, `word-spacing`, `text-align`, `text-decoration`, `text-transform`, `text-indent`, `text-shadow`, `vertical-align`                                                                                  |
| Colours and background | `color`, `background`, `background-color`, `background-image`, `background-repeat`, `background-position`, `background-size`, `background-attachment`, `background-clip`, `background-origin`                                                                                                                        |
| Borders                | `border` (outside `table`, `img`, `input` and `canvas`), `border-width`, `border-style`, `border-color`, `border-radius`, `border-top`, `border-right`, `border-bottom`, `border-left`, `border-{top,right,bottom,left}-{width,style,color}`, `border-{top-left,top-right,bottom-left,bottom-right}-radius`          |
| Outline                | `outline`, `outline-width`, `outline-style`, `outline-color`, `outline-offset`                                                                                                                                                                                                                                       |
| Positioning            | `position`, `top`, `right`, `bottom`, `left`, `z-index`, `float`, `clear`                                                                                                                                                                                                                                            |
| Display and visibility | `display`, `visibility`, `opacity`, `overflow`, `overflow-x`, `overflow-y`, `clip`, `clip-path`                                                                                                                                                                                                                      |
| Flexbox                | `flex`, `flex-direction`, `flex-wrap`, `flex-flow`, `justify-content`, `align-items`, `align-content`, `align-self`, `flex-grow`, `flex-shrink`, `flex-basis`                                                                                                                                                        |
| Grid                   | `grid`, `grid-template`, `grid-template-rows`, `grid-template-columns`, `grid-template-areas`, `grid-area`, `grid-row`, `grid-column`, `grid-gap`, `gap`, `row-gap`, `column-gap`                                                                                                                                    |
| Text layout            | `white-space`, `word-wrap`, `word-break`, `overflow-wrap`, `hyphens`, `text-overflow`, `direction`, `unicode-bidi`, `writing-mode`                                                                                                                                                                                   |
| Visual effects         | `box-shadow`, `filter`, `backdrop-filter`, `transform`, `transform-origin`, `perspective`, `perspective-origin`                                                                                                                                                                                                      |
| Animation              | `transition`, `transition-property`, `transition-duration`, `transition-timing-function`, `transition-delay`, `animation`, `animation-name`, `animation-duration`, `animation-timing-function`, `animation-delay`, `animation-iteration-count`, `animation-direction`, `animation-fill-mode`, `animation-play-state` |
| Interaction            | `cursor`, `pointer-events`, `user-select`, `resize`, `scroll-behavior`                                                                                                                                                                                                                                               |
| Tables                 | `table-layout`, `border-collapse`, `border-spacing`, `caption-side`, `empty-cells`                                                                                                                                                                                                                                   |
| Lists                  | `list-style`, `list-style-type`, `list-style-position`, `list-style-image`                                                                                                                                                                                                                                           |
| Modern CSS             | `aspect-ratio`, `object-fit`, `object-position`, `overscroll-behavior`, `scroll-snap-type`, `scroll-snap-align`, `scroll-margin`, `scroll-padding`                                                                                                                                                                   |
| Generated content      | `content`, `quotes`, `counter-reset`, `counter-increment`                                                                                                                                                                                                                                                            |

Anything else stays an HTML attribute, where the browser ignores it. That includes
multi-column properties such as `column-count`, logical properties such as
`margin-inline-start`, masking, print properties such as `page-break-before`, and custom
properties such as `--brand-color`.

</details>

### Caveats

- **Unknown element types and marks render as `<span>`**, with the node's attributes
  dropped. Add the type to `elements` or `leafs` to render it differently.
- **SVG isn't supported.** `svg` and its child elements are unknown types.
- **`pa()` adds a wrapper only in edit mode.** It returns attributes only while the page
  is open in the CMS editor, so the `<div>` appears there and not on the live site. Pass a
  `className` too if your layout depends on the wrapper.
- **`<RichText>` doesn't sanitise content.** It renders whatever the tree contains as
  React elements, which React escapes, but it doesn't remove elements or attributes.

## Usage

### Rendering a property

```tsx
import { type ContentProps } from '@optimizely/cms-sdk';
import { RichText } from '@optimizely/cms-sdk/react/richText';
import { ArticleContentType } from './Article';

export function ArticleBody({
  content,
}: {
  content: ContentProps<typeof ArticleContentType>;
}) {
  return <RichText className='prose' content={content.body?.json} />;
}
```

### Adding a class to a default element

Use a factory to keep the default behaviour and add a class:

```tsx
import {
  RichText,
  createHtmlComponent,
  type RichTextProps,
} from '@optimizely/cms-sdk/react/richText';

const elements = {
  'heading-two': createHtmlComponent('h2', { className: 'text-2xl font-bold' }),
  paragraph: createHtmlComponent('p', { className: 'mb-4 leading-relaxed' }),
};

export function ArticleBody({ content }: Pick<RichTextProps, 'content'>) {
  return <RichText content={content} elements={elements} />;
}
```

### Replacing links

```tsx
import {
  RichText,
  type ElementProps,
  type LinkElement,
  type RichTextProps,
} from '@optimizely/cms-sdk/react/richText';

function ArticleLink({ element, children }: ElementProps) {
  const { url, target, rel } = element as LinkElement;

  return (
    <a href={url} target={target} rel={rel} className='text-blue-600 underline'>
      {children}
    </a>
  );
}

export function ArticleBody({ content }: Pick<RichTextProps, 'content'>) {
  return <RichText content={content} elements={{ link: ArticleLink }} />;
}
```

### Rendering a custom mark

```tsx
import {
  RichText,
  type LeafProps,
  type RichTextProps,
} from '@optimizely/cms-sdk/react/richText';

function Highlight({ children }: LeafProps) {
  return <mark className='bg-yellow-200'>{children}</mark>;
}

export function ArticleBody({ content }: Pick<RichTextProps, 'content'>) {
  return <RichText content={content} leafs={{ highlight: Highlight }} />;
}
```

### Reading an attribute the SDK doesn't convert

`attributes` holds the node's fields before conversion, so a custom element can read
properties that would otherwise be ignored:

```tsx
import type { CSSProperties } from 'react';
import {
  RichText,
  type ElementProps,
  type RichTextProps,
} from '@optimizely/cms-sdk/react/richText';

function Columns({ attributes, children }: ElementProps) {
  const columnCount = Number(attributes?.['column-count']) || undefined;
  const style: CSSProperties = { columnCount };

  return <div style={style}>{children}</div>;
}

export function ArticleBody({ content }: Pick<RichTextProps, 'content'>) {
  return <RichText content={content} elements={{ div: Columns }} />;
}
```

### Keeping HTML entities encoded

```tsx
<RichText content={content.body?.json} decodeHtmlEntities={false} />
```

With `decodeHtmlEntities={false}`, a text node containing `&lt;div&gt;` renders as the
literal text `&lt;div&gt;` instead of `<div>`.

## Troubleshooting

### Nothing renders

Check that `content.body?.json` has a value. If `fragment.richTextFormat` is `'html'`, the
SDK doesn't fetch `json` at all. Set it to `'json'` or `'both'`. See
[`config()`](./config.md).

### An element renders as a `<span>`

Its type has no default. Add a component for that type to `elements`. To find the type
name, log `content.body?.json`.

### A style from the CMS has no effect

The CSS property isn't one the SDK moves to `style`, so it stays an attribute. Read it
from `attributes` in a custom element, as in
[Reading an attribute the SDK doesn't convert](#reading-an-attribute-the-sdk-doesnt-convert).
