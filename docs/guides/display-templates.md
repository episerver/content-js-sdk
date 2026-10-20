# Style components with display templates

A **display template** is a set of style settings, such as a color or an orientation, that
editors choose in Visual Builder. You define the settings and the choices, and your
component reads what the editor picked. Editors get visual variations without you adding a
content type for each one.

> **You will learn**
>
> - How to define a display template
> - How to choose what a template applies to
> - How to offer settings with select and checkbox editors
> - How to read the settings in a component
> - How to render a different component for a template
> - How to register display templates

## Define a display template

Call `displayTemplate()` and export the result from a file that `optimizely.config.mjs`
includes, so `config push` uploads it with your content types:

```tsx
// src/components/Tile.tsx
import { contentType, displayTemplate } from '@optimizely/cms-sdk';

export const TileContentType = contentType({
  key: 'Tile',
  displayName: 'Tile',
  baseType: '_component',
  properties: {
    title: { type: 'string', displayName: 'Title' },
    description: { type: 'string', displayName: 'Description' },
  },
  compositionBehaviors: ['elementEnabled'],
});

export const SquareDisplayTemplate = displayTemplate({
  key: 'SquareDisplayTemplate',
  displayName: 'Square',
  isDefault: false,
  contentType: 'Tile',
  settings: {
    color: {
      editor: 'select' as const,
      displayName: 'Description color',
      sortOrder: 0,
      choices: {
        yellow: { displayName: 'Yellow', sortOrder: 1 },
        green: { displayName: 'Green', sortOrder: 2 },
        orange: { displayName: 'Orange', sortOrder: 3 },
      },
    },
  },
});
```

| Field         | Required | Description                                                                                                 |
| ------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `key`         | Yes      | Unique identifier of the template                                                                           |
| `displayName` | Yes      | The name editors see                                                                                        |
| `isDefault`   | Yes      | Whether the template applies when the editor hasn't chosen one                                              |
| `settings`    | No       | The settings editors can change. See [Offer settings](#offer-settings)                                      |
| `tag`         | No       | Picks a variant component. See [Render a different component](#render-a-different-component-for-a-template) |

Plus one of `baseType`, `contentType` or `nodeType`, described next.

## Choose what a template applies to

Set exactly one of these fields:

| Field         | Values                                        | The template applies to                |
| ------------- | --------------------------------------------- | -------------------------------------- |
| `baseType`    | `'_component'`, `'_section'`, `'_experience'` | Every content type with that base type |
| `contentType` | A content type key, such as `'Tile'`          | That content type only                 |
| `nodeType`    | `'row'`, `'column'`                           | Rows or columns in a section's grid    |

`contentType` takes the key as a string, not the content type object. A template for rows
looks like this:

```tsx
// src/components/TileRow.tsx
import { displayTemplate } from '@optimizely/cms-sdk';

export const TileRowDisplayTemplate = displayTemplate({
  key: 'TileRowDisplayTemplate',
  displayName: 'Tile row',
  isDefault: true,
  nodeType: 'row',
  settings: {
    padding: {
      editor: 'select' as const,
      displayName: 'Padding',
      sortOrder: 0,
      choices: {
        small: { displayName: 'Small', sortOrder: 1 },
        medium: { displayName: 'Medium', sortOrder: 2 },
        large: { displayName: 'Large', sortOrder: 3 },
      },
    },
  },
});
```

## Offer settings

Each entry in `settings` is one control in the Visual Builder style panel. The entry's key
is the name your component reads.

| Field         | Required | Description                                                         |
| ------------- | -------- | ------------------------------------------------------------------- |
| `displayName` | Yes      | The label editors see                                               |
| `sortOrder`   | Yes      | The setting's position in the panel                                 |
| `choices`     | Yes      | The options, keyed by value. Each has `displayName` and `sortOrder` |
| `editor`      | No       | `'select'` or `'checkbox'`                                          |

> [!WARNING]
>
> Write `editor` with `as const`, as in the examples on this page. `ContentProps` infers a
> type only for settings whose `editor` is the literal `'select'` or `'checkbox'`. Without
> `as const`, or without `editor`, the setting is typed `never`.

### Select editor

A drop-down with one choice selected. Both templates above use it. Your component receives
the key of the chosen choice, such as `'small'`, typed as the union of the keys in
`choices`.

### Checkbox editor

A toggle. List the two choices `true` and `false`, to label them. Your component receives
a `boolean`:

```tsx
// src/components/Card.tsx
import { displayTemplate } from '@optimizely/cms-sdk';

export const BorderedCardDisplayTemplate = displayTemplate({
  key: 'BorderedCardDisplayTemplate',
  displayName: 'Bordered card',
  isDefault: false,
  baseType: '_component',
  settings: {
    showBorder: {
      editor: 'checkbox' as const,
      displayName: 'Show border',
      sortOrder: 0,
      choices: {
        true: { displayName: 'Show', sortOrder: 1 },
        false: { displayName: 'Hide', sortOrder: 2 },
      },
    },
  },
});
```

Graph returns every setting as a string. The SDK converts `'true'` and `'false'` to
booleans before your component receives them.

## Read the settings in a component

Add a `displaySettings` prop and type it with `ContentProps<typeof YourTemplate>`:

```tsx
// src/components/SquareTile.tsx
import { ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';
import { SquareDisplayTemplate, TileContentType } from './Tile';

type Props = {
  content: ContentProps<typeof TileContentType>;
  displaySettings?: ContentProps<typeof SquareDisplayTemplate>;
};

export function SquareTile({ content, displaySettings }: Props) {
  const { pa } = getPreviewUtils(content);

  return (
    <div className='square-tile'>
      <h4 {...pa('title')}>{content.title}</h4>
      <p style={{ color: displaySettings?.color }} {...pa('description')}>
        {content.description}
      </p>
    </div>
  );
}
```

`displaySettings?.color` is typed `'yellow' | 'green' | 'orange'`. The prop is optional:
`OptimizelyComposition` and `OptimizelyGridSection` pass it for content in an experience,
but `OptimizelyComponent` passes it only if you do.

Rows and columns receive their settings the same way, in the `displaySettings` prop of the
`row` and `column` components. See [Experiences](./experiences.md).

## Render a different component for a template

To render a template with a component of its own, rather than styling one component, give
the template a `tag`:

```tsx
// src/components/Tile.tsx
import { displayTemplate } from '@optimizely/cms-sdk';

export const SquareDisplayTemplate = displayTemplate({
  key: 'SquareDisplayTemplate',
  displayName: 'Square',
  isDefault: false,
  contentType: 'Tile',
  tag: 'Square',
});
```

A template can have both a tag and settings. The [complete example](#complete-example) has
both.

Then register a variant component for that tag, next to `Tile`, the component that renders
tiles without the template. There are two equivalent ways:

```tsx
// src/lib/optimizely.ts
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';
import Tile from '@/components/Tile';
import { SquareTile } from '@/components/SquareTile';

initReactComponentRegistry({
  resolver: {
    Tile: {
      default: Tile,
      tags: { Square: SquareTile },
    },
  },
});
```

```tsx
// src/lib/optimizely.ts
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';
import Tile from '@/components/Tile';
import { SquareTile } from '@/components/SquareTile';

initReactComponentRegistry({
  resolver: {
    Tile,
    'Tile:Square': SquareTile,
  },
});
```

When a `Tile` uses the `Square` template, the SDK looks for `'Tile:Square'`, then for
`Square` in the `tags` of `Tile`, then falls back to the default `Tile` component.

The tag exists only in your code. `config push` doesn't send it to the CMS.

## Register display templates

The SDK finds a template's tag in the display template registry. Register every template
next to your content types:

```tsx
// src/lib/optimizely.ts
import {
  initContentTypeRegistry,
  initDisplayTemplateRegistry,
} from '@optimizely/cms-sdk';
import { SquareDisplayTemplate, TileContentType } from '@/components/Tile';
import { TileRowDisplayTemplate } from '@/components/TileRow';

initContentTypeRegistry([TileContentType]);
initDisplayTemplateRegistry([SquareDisplayTemplate, TileRowDisplayTemplate]);
```

> [!WARNING]
>
> Each call to `initDisplayTemplateRegistry` replaces the previous list. A template left
> out of it still works in the CMS, but its tagged variant never renders.

## Complete example

A tile with a default component and a square variant, in one file:

```tsx
// src/components/Tile.tsx
import { contentType, displayTemplate, ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

export const TileContentType = contentType({
  key: 'Tile',
  displayName: 'Tile',
  baseType: '_component',
  properties: {
    title: { type: 'string', displayName: 'Title' },
    description: { type: 'string', displayName: 'Description' },
  },
  compositionBehaviors: ['elementEnabled'],
});

export const SquareDisplayTemplate = displayTemplate({
  key: 'SquareDisplayTemplate',
  displayName: 'Square',
  isDefault: false,
  contentType: 'Tile',
  tag: 'Square',
  settings: {
    color: {
      editor: 'select' as const,
      displayName: 'Description color',
      sortOrder: 0,
      choices: {
        yellow: { displayName: 'Yellow', sortOrder: 1 },
        green: { displayName: 'Green', sortOrder: 2 },
        orange: { displayName: 'Orange', sortOrder: 3 },
      },
    },
    showBorder: {
      editor: 'checkbox' as const,
      displayName: 'Show border',
      sortOrder: 1,
      choices: {
        true: { displayName: 'Show', sortOrder: 1 },
        false: { displayName: 'Hide', sortOrder: 2 },
      },
    },
  },
});

type Props = {
  content: ContentProps<typeof TileContentType>;
  displaySettings?: ContentProps<typeof SquareDisplayTemplate>;
};

export default function Tile({ content }: Props) {
  const { pa } = getPreviewUtils(content);

  return (
    <div className='tile'>
      <h3 {...pa('title')}>{content.title}</h3>
      <p {...pa('description')}>{content.description}</p>
    </div>
  );
}

export function SquareTile({ content, displaySettings }: Props) {
  const { pa } = getPreviewUtils(content);

  return (
    <div
      className='square-tile'
      style={{ border: displaySettings?.showBorder ? '1px solid' : 'none' }}
    >
      <h4 {...pa('title')}>{content.title}</h4>
      <p style={{ color: displaySettings?.color }} {...pa('description')}>
        {content.description}
      </p>
    </div>
  );
}
```

Register it in your layout:

```tsx
// src/lib/optimizely.ts
import {
  initContentTypeRegistry,
  initDisplayTemplateRegistry,
} from '@optimizely/cms-sdk';
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';
import Tile, {
  SquareDisplayTemplate,
  SquareTile,
  TileContentType,
} from '@/components/Tile';

initContentTypeRegistry([TileContentType]);
initDisplayTemplateRegistry([SquareDisplayTemplate]);
initReactComponentRegistry({
  resolver: {
    Tile: { default: Tile, tags: { Square: SquareTile } },
  },
});
```

## Recap

- Define a template with `displayTemplate()` and target a base type, a content type or a
  node type.
- Use `editor: 'select'` for a choice of values and `editor: 'checkbox'` for a boolean.
- Read the editor's choices from the `displaySettings` prop, typed with `ContentProps`.
- Give a template a `tag` to render it with a variant component.
- Register every template with `initDisplayTemplateRegistry`.

## Related

- [Experiences](./experiences.md)
- [React components reference](../reference/react-components.md)
- [Content types](./content-types.md)
