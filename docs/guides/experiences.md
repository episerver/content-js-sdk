# Build pages with experiences

An **experience** is a page that editors lay out themselves in Visual Builder, by adding
sections and arranging components in them. Your code defines the building blocks and how
each one renders. The SDK walks the layout the editor built and renders the right
component for every part of it.

> **You will learn**
>
> - How an experience is structured
> - How to define an experience content type
> - How to render an experience
> - How to render sections, rows and columns
> - How to make a component available in Visual Builder
> - How to register everything

## How an experience is structured

Besides its own properties, every experience has a `composition`: the tree of sections and
elements the editor built in Visual Builder.

```text
AboutExperience                 experience (_experience)
├── title, subtitle             the experience's own properties
└── composition
    ├── BlankSection            section (_section)
    │   └── row
    │       ├── column
    │       │   └── Tile        element (component with elementEnabled)
    │       └── column
    │           └── CallToAction
    └── LandingSection          component with sectionEnabled
```

- A **section** is a vertical part of the page. It is either a content type with base type
  `_section`, or a component marked `sectionEnabled`. A `_section` holds a grid of rows
  and columns.
- An **element** is a component marked `elementEnabled`. Editors place elements in the
  columns of a section.
- Rows and columns are **structure nodes**. They have no content type of their own and
  only arrange what is inside them.

Components are what the CMS UI calls "blocks".

## Define an experience content type

Set `baseType` to `'_experience'`. Properties are optional. Use them for content that
every page of this type must have, such as a title:

```tsx
// src/components/AboutExperience.tsx
import { contentType } from '@optimizely/cms-sdk';

export const AboutExperienceContentType = contentType({
  key: 'AboutExperience',
  displayName: 'About Experience',
  baseType: '_experience',
  properties: {
    title: { type: 'string', displayName: 'Title' },
    subtitle: { type: 'string', displayName: 'Subtitle' },
  },
});
```

If you don't need any properties, use the built-in `BlankExperienceContentType` instead.
See [Use the built-in blank experience](#use-the-built-in-blank-experience).

## Render an experience

Render the experience's own properties as usual, and pass the composition to
`OptimizelyComposition`:

```tsx
// src/components/AboutExperience.tsx
import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils, OptimizelyComposition } from '@optimizely/cms-sdk/react/server';

export const AboutExperienceContentType = contentType({
  key: 'AboutExperience',
  displayName: 'About Experience',
  baseType: '_experience',
  properties: {
    title: { type: 'string', displayName: 'Title' },
    subtitle: { type: 'string', displayName: 'Subtitle' },
  },
});

type Props = {
  content: ContentProps<typeof AboutExperienceContentType>;
};

export default function AboutExperience({ content }: Props) {
  const { pa } = getPreviewUtils(content);

  return (
    <main>
      <header>
        <h1 {...pa('title')}>{content.title}</h1>
        <p {...pa('subtitle')}>{content.subtitle}</p>
      </header>
      <OptimizelyComposition nodes={content.composition.nodes ?? []} />
    </main>
  );
}
```

`OptimizelyComposition` renders each top-level node with the component you registered for
its content type. Each component node is wrapped in a `<div>` that carries the preview
attributes Visual Builder needs. `nodes` is optional in the type, hence the `?? []`.

### Use the built-in blank experience

`BlankExperienceContentType` is an experience with no properties, so the whole page is
built in Visual Builder:

```tsx
// src/components/BlankExperience.tsx
import { BlankExperienceContentType, ContentProps } from '@optimizely/cms-sdk';
import { OptimizelyComposition } from '@optimizely/cms-sdk/react/server';

type Props = {
  content: ContentProps<typeof BlankExperienceContentType>;
};

export default function BlankExperience({ content }: Props) {
  return (
    <main>
      <OptimizelyComposition nodes={content.composition.nodes ?? []} />
    </main>
  );
}
```

### Wrap each component yourself

To replace the default `<div>` around each component, pass a `ComponentWrapper`. It
receives the composition node and the rendered component as `children`:

```tsx
// src/components/BlankExperience.tsx
import { BlankExperienceContentType, ContentProps } from '@optimizely/cms-sdk';
import {
  ComponentContainerProps,
  getPreviewUtils,
  OptimizelyComposition,
} from '@optimizely/cms-sdk/react/server';

type Props = {
  content: ContentProps<typeof BlankExperienceContentType>;
};

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);

  return (
    <div className='composition-item' {...pa(node)}>
      {children}
    </div>
  );
}

export default function BlankExperience({ content }: Props) {
  return (
    <main>
      <OptimizelyComposition
        nodes={content.composition.nodes ?? []}
        ComponentWrapper={ComponentWrapper}
      />
    </main>
  );
}
```

> [!WARNING]
>
> A custom wrapper replaces the default one, preview attributes included. Spread
> `pa(node)` onto it, or editors can't select the component in Visual Builder.

## Render sections

A section is rendered by the component registered for its content type, like any other
content. For the grid inside it, pass the section's `nodes` to `OptimizelyGridSection`.

### Render the blank section

`BlankSectionContentType` is a section with no properties:

```tsx
// src/components/BlankSection.tsx
import { BlankSectionContentType, ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils, OptimizelyGridSection } from '@optimizely/cms-sdk/react/server';

type Props = {
  content: ContentProps<typeof BlankSectionContentType>;
};

export default function BlankSection({ content }: Props) {
  const { pa } = getPreviewUtils(content);

  return (
    <section {...pa(content)}>
      <OptimizelyGridSection nodes={content.nodes} />
    </section>
  );
}
```

`pa(content)` marks the whole section as selectable in Visual Builder. By default, each
row renders as a flex container and each column as a `flex: 1` item.

### Customize rows and columns

Pass your own components in the `row` and `column` props. Each receives the structure
node, its rendered contents as `children`, and the settings of its
[display template](./display-templates.md) as `displaySettings`:

```tsx
// src/components/BlankSection.tsx
import { BlankSectionContentType, ContentProps } from '@optimizely/cms-sdk';
import {
  getPreviewUtils,
  OptimizelyGridSection,
  StructureContainerProps,
} from '@optimizely/cms-sdk/react/server';

type Props = {
  content: ContentProps<typeof BlankSectionContentType>;
};

function Row({ children, node }: StructureContainerProps) {
  const { pa } = getPreviewUtils(node);

  return (
    <div className='row' {...pa(node)}>
      {children}
    </div>
  );
}

function Column({ children, node }: StructureContainerProps) {
  const { pa } = getPreviewUtils(node);

  return (
    <div className='column' {...pa(node)}>
      {children}
    </div>
  );
}

export default function BlankSection({ content }: Props) {
  const { pa } = getPreviewUtils(content);

  return (
    <section {...pa(content)}>
      <OptimizelyGridSection nodes={content.nodes} row={Row} column={Column} />
    </section>
  );
}
```

> [!TIP]
>
> To use the same row and column components in every section, register them as `_Row` and
> `_Column` in `initReactComponentRegistry` instead. A `row` or `column` prop still takes
> priority over the registered component.

### Create your own section type

Set `baseType` to `'_section'` when a section needs properties of its own, such as a
background color. The grid works the same way:

```tsx
// src/components/HeroSection.tsx
import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils, OptimizelyGridSection } from '@optimizely/cms-sdk/react/server';

export const HeroSectionContentType = contentType({
  key: 'HeroSection',
  displayName: 'Hero Section',
  baseType: '_section',
  properties: {
    heading: { type: 'string', displayName: 'Heading' },
    backgroundColor: { type: 'string', displayName: 'Background Color' },
  },
});

type Props = {
  content: ContentProps<typeof HeroSectionContentType>;
};

export default function HeroSection({ content }: Props) {
  const { pa } = getPreviewUtils(content);

  return (
    <section
      {...pa(content)}
      style={{ backgroundColor: content.backgroundColor ?? undefined }}
    >
      <h2 {...pa('heading')}>{content.heading}</h2>
      <OptimizelyGridSection nodes={content.nodes} />
    </section>
  );
}
```

## Make a component available in Visual Builder

Editors can only add a component to an experience if its content type has
`compositionBehaviors`:

| Value              | Editors can add the component as             |
| ------------------ | -------------------------------------------- |
| `'sectionEnabled'` | A section, at the top level of an experience |
| `'elementEnabled'` | An element, inside a column of a section     |

Set both to allow either. A third value, `'formsElementEnabled'`, is for Optimizely Forms
elements. See [Forms](./forms.md).

```tsx
// src/components/CallToAction.tsx
import { contentType, ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const CallToActionContentType = contentType({
  key: 'CallToAction',
  displayName: 'Call to Action',
  baseType: '_component',
  properties: {
    heading: { type: 'string', displayName: 'Heading' },
    buttonText: { type: 'string', displayName: 'Button Text' },
    buttonLink: { type: 'url', displayName: 'Button Link' },
  },
  compositionBehaviors: ['elementEnabled'],
});

type Props = {
  content: ContentProps<typeof CallToActionContentType>;
};

export default function CallToAction({ content }: Props) {
  const { pa } = getPreviewUtils(content);

  return (
    <div>
      <h3 {...pa('heading')}>{content.heading}</h3>
      <a href={content.buttonLink?.default ?? undefined} {...pa('buttonLink')}>
        {content.buttonText}
      </a>
    </div>
  );
}
```

> [!WARNING]
>
> The SDK only fetches the properties of components that have `compositionBehaviors` and
> are registered with `initContentTypeRegistry`. Any other component in a composition
> renders with its properties missing.

## Register everything

Register the content types so the SDK can query them, and the components so it can render
them:

```tsx
// src/lib/optimizely.ts
import {
  BlankExperienceContentType,
  BlankSectionContentType,
  initContentTypeRegistry,
} from '@optimizely/cms-sdk';
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';
import type { ReactNode } from 'react';
import AboutExperience, {
  AboutExperienceContentType,
} from '@/components/AboutExperience';
import BlankExperience from '@/components/BlankExperience';
import BlankSection from '@/components/BlankSection';
import CallToAction, { CallToActionContentType } from '@/components/CallToAction';
import HeroSection, { HeroSectionContentType } from '@/components/HeroSection';

initContentTypeRegistry([
  AboutExperienceContentType,
  BlankExperienceContentType,
  BlankSectionContentType,
  CallToActionContentType,
  HeroSectionContentType,
]);

initReactComponentRegistry({
  resolver: {
    AboutExperience,
    BlankExperience,
    BlankSection,
    CallToAction,
    HeroSection,
  },
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en'>
      <body>{children}</body>
    </html>
  );
}
```

The resolver keys are content type keys: `BlankExperience` and `BlankSection` are the keys
of the built-in types.

<details>
<summary><b>Deep dive:</b> How deep can a composition be?</summary>

The SDK queries compositions four levels deep by default. If editors nest sections deeper
than that, raise `compositionDepth` in the `fragment` option of `config()`. See
[`config()`](../reference/config.md).

</details>

## Recap

- An experience has its own properties plus a `composition` of sections, rows, columns and
  elements.
- Render the composition with `OptimizelyComposition`, and a section's grid with
  `OptimizelyGridSection`.
- Customize the wrappers with `ComponentWrapper`, `row` and `column`, and keep `pa(node)`
  on them.
- Give components `compositionBehaviors` so editors can add them in Visual Builder.
- Register every content type and component you use.

## Related

- [Display templates](./display-templates.md)
- [React components reference](../reference/react-components.md)
- [Live preview](../learn/live-preview.md)
- [Content types](./content-types.md)
