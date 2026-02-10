# Display Settings and Templates

Display templates allow developers to define visual variations that content editors can apply to components, sections, and structural nodes in Visual Builder. After developers create the display templates, content editors can select from these predefined styles directly in the Visual Builder UI without writing any code.

## Creating Display Templates

Display templates can be associated with three different targets:

- **Base type** - Apply to `_experience`, `_section`, or `_component`
- **Content type** - Apply to specific content types derived from the base types `_experience`, `_section`, and `_component` (like `Tile`, `Hero`, etc.)
- **Node type** - Apply to structural nodes: `row` or `column`

### Example: Component Display Template

Here's how to create a display template for a component:

```tsx
import {
  contentType,
  displayTemplate,
  ContentProps,
} from '@optimizely/cms-sdk';

export const TileContentType = contentType({
  key: 'Tile',
  displayName: 'Tile Component',
  baseType: '_component',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
  },
  compositionBehaviors: ['elementEnabled'],
});

export const SquareDisplayTemplate = displayTemplate({
  key: 'SquareDisplayTemplate',
  isDefault: false,
  displayName: 'Square Display Template',
  baseType: '_component',
  settings: {
    color: {
      editor: 'select',
      displayName: 'Description Font Color',
      sortOrder: 0,
      choices: {
        yellow: {
          displayName: 'Yellow',
          sortOrder: 1,
        },
        green: {
          displayName: 'Green',
          sortOrder: 2,
        },
        orange: {
          displayName: 'Orange',
          sortOrder: 3,
        },
      },
    },
    orientation: {
      editor: 'select',
      displayName: 'Orientation',
      sortOrder: 1,
      choices: {
        vertical: { displayName: 'Vertical', sortOrder: 1 },
        horizontal: { displayName: 'Horizontal', sortOrder: 2 },
      },
    },
  },
  tag: 'Square',
});
```

### Example: Row Display Template

Display templates for structural nodes like rows and columns:

```tsx
export const TileRowDisplayTemplate = displayTemplate({
  key: 'TileRowDisplayTemplate',
  isDefault: true,
  displayName: 'Tile Row Display Template',
  nodeType: 'row',
  settings: {
    padding: {
      editor: 'select',
      displayName: 'Padding',
      sortOrder: 0,
      choices: {
        small: {
          displayName: 'Small',
          sortOrder: 1,
        },
        medium: {
          displayName: 'Medium',
          sortOrder: 2,
        },
        large: {
          displayName: 'Large',
          sortOrder: 3,
        },
      },
    },
  },
});
```

### Example: Column Display Template

```tsx
export const TileColumnDisplayTemplate = displayTemplate({
  key: 'TileColumnDisplayTemplate',
  isDefault: true,
  displayName: 'Tile Column Display Template',
  nodeType: 'column',
  settings: {
    background: {
      editor: 'select',
      displayName: 'Background Color',
      sortOrder: 0,
      choices: {
        red: {
          displayName: 'Red',
          sortOrder: 1,
        },
        black: {
          displayName: 'Black',
          sortOrder: 2,
        },
        grey: {
          displayName: 'Grey',
          sortOrder: 3,
        },
      },
    },
  },
});
```

## Display Setting Editors

Display settings support two editor types that determine how editors interact with the setting:

### Select Editor

A drop-down list supporting single-item selection. This is the most common editor type.

```tsx
settings: {
  color: {
    editor: 'select',
    displayName: 'Text Color',
    sortOrder: 0,
    choices: {
      blue: { displayName: 'Blue', sortOrder: 1 },
      red: { displayName: 'Red', sortOrder: 2 },
      green: { displayName: 'Green', sortOrder: 3 },
    },
  },
}
```

**Behavior:**

- Editors see a drop-down with all choices
- Single selection only
- Values are the choice keys (e.g., `'blue'`, `'red'`, `'green'`)

### Checkbox Editor

A toggle for boolean true/false values.

```tsx
settings: {
  showBorder: {
    editor: 'checkbox',
    displayName: 'Show Border',
    sortOrder: 0,
    choices: {
      true: { displayName: 'Enabled', sortOrder: 1 },
      false: { displayName: 'Disabled', sortOrder: 2 },
    },
  },
}
```

**Behavior:**

- Editors see a checkbox toggle
- Returns `true` or `false`
- Choices define the display labels but the value is always boolean

## Using Display Settings in Components

To use display settings in your component, add a `displaySettings` prop typed with `ContentProps<typeof YourDisplayTemplate>`:

```tsx
import { ContentProps } from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

type Props = {
  content: ContentProps<typeof TileContentType>;
  displaySettings?: ContentProps<typeof SquareDisplayTemplate>;
};

export function SquareTile({ content, displaySettings }: Props) {
  const { pa } = getPreviewUtils(content);

  return (
    <div className="square-tile">
      <h4 {...pa('title')}>{content.title}</h4>
      <p
        style={{
          color: displaySettings?.color,
          flexDirection:
            displaySettings?.orientation === 'horizontal' ? 'row' : 'column',
        }}
        {...pa('description')}
      >
        {content.description}
      </p>
    </div>
  );
}
```

**Important points:**

- `displaySettings` is optional (`?`) as it may not always be present
- Use optional chaining (`displaySettings?.color`) to safely access values
- The values correspond to the choice keys you defined
- TypeScript provides autocomplete for available settings and choices

## Creating Default and Variant Components

You can have a default component and variants that use different display templates:

```tsx
// Default component without display settings
export default function Tile({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <div className="tile">
      <h1 {...pa('title')}>{content.title}</h1>
      <p {...pa('description')}>{content.description}</p>
    </div>
  );
}

// Variant component with display settings
export function SquareTile({ content, displaySettings }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <div className="square-tile">
      <h4 {...pa('title')}>{content.title}</h4>
      <p
        style={{
          color: displaySettings?.color,
          flexDirection:
            displaySettings?.orientation === 'horizontal' ? 'row' : 'column',
        }}
        {...pa('description')}
      >
        {content.description}
      </p>
    </div>
  );
}
```

## Registering Display Templates

Display templates must be registered in your application setup:

```tsx
import { initDisplayTemplateRegistry } from '@optimizely/cms-sdk';
import {
  SquareDisplayTemplate,
  TileRowDisplayTemplate,
  TileColumnDisplayTemplate,
} from '@/components/Tile';

initDisplayTemplateRegistry([
  SquareDisplayTemplate,
  TileRowDisplayTemplate,
  TileColumnDisplayTemplate,
  // ... other display templates
]);
```

## Using the `tag` Property

The `tag` property links a display template to a specific component variant:

```tsx
export const SquareDisplayTemplate = displayTemplate({
  key: 'SquareDisplayTemplate',
  // ... other properties
  tag: 'Square', // Links to SquareTile component
});
```

When registering components, you can use either of two patterns to associate the variant:

**Pattern 1: Using tags object (recommended)**

```tsx
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';
import Tile, { SquareTile } from '@/components/Tile';

initReactComponentRegistry({
  resolver: {
    Tile: {
      default: Tile, // Default component
      tags: {
        Square: SquareTile, // Variant for 'Square' tag
      },
    },
    // ... other components
  },
});
```

**Pattern 2: Using colon notation**

```tsx
initReactComponentRegistry({
  resolver: {
    'Tile:Square': SquareTile, // Variant for 'Square' tag
    Tile: Tile, // Default/fallback component
    // ... other components
  },
});
```

Both patterns work identically. The SDK will:

1. First check for a tagged variant (e.g., `Tile:Square`)
2. If found, use that component
3. If not found, fall back to the default component

The tag name in the display template matches either the key in the `tags` object (Pattern 1) or the string after the colon (Pattern 2).

## Display Template Properties

### Required Properties

- **`key`** - Unique identifier for the display template
- **`displayName`** - Human-readable name shown to editors
- **`isDefault`** - Whether this is the default template (one per baseType/contentType/nodeType)
- **`settings`** - Object defining available settings and their options

### Target Properties (choose one)

- **`baseType`** - Apply to `'_component'`, `'_experience'`, or `'_section'`
- **`contentType`** - Apply to a specific content type key
- **`nodeType`** - Apply to `'row'` or `'column'`

### Optional Properties

- **`tag`** - Links to a specific component variant (e.g., `'Square'`)
- **`sortOrder`** - Controls display order in the CMS UI

## Complete Example

Here's a complete example bringing everything together:

```tsx
import {
  contentType,
  displayTemplate,
  ContentProps,
} from '@optimizely/cms-sdk';
import { getPreviewUtils } from '@optimizely/cms-sdk/react/server';

// Content Type
export const TileContentType = contentType({
  key: 'Tile',
  displayName: 'Tile Component',
  baseType: '_component',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
  },
  compositionBehaviors: ['elementEnabled'],
});

// Display Template
export const SquareDisplayTemplate = displayTemplate({
  key: 'SquareDisplayTemplate',
  isDefault: false,
  displayName: 'Square Display Template',
  baseType: '_component',
  settings: {
    color: {
      editor: 'select',
      displayName: 'Description Font Color',
      sortOrder: 0,
      choices: {
        yellow: { displayName: 'Yellow', sortOrder: 1 },
        green: { displayName: 'Green', sortOrder: 2 },
        orange: { displayName: 'Orange', sortOrder: 3 },
      },
    },
    orientation: {
      editor: 'select',
      displayName: 'Orientation',
      sortOrder: 1,
      choices: {
        vertical: { displayName: 'Vertical', sortOrder: 1 },
        horizontal: { displayName: 'Horizontal', sortOrder: 2 },
      },
    },
  },
  tag: 'Square',
});

// Component Types
type Props = {
  content: ContentProps<typeof TileContentType>;
  displaySettings?: ContentProps<typeof SquareDisplayTemplate>;
};

// Default Component
export default function Tile({ content }: Props) {
  const { pa } = getPreviewUtils(content);
  return (
    <div className="tile">
      <h1 {...pa('title')}>{content.title}</h1>
      <p {...pa('description')}>{content.description}</p>
    </div>
  );
}

// Variant Component with Display Settings
export function SquareTile({ content, displaySettings }: Props) {
  const { pa } = getPreviewUtils(content);

  return (
    <div className="square-tile">
      <h4 {...pa('title')}>{content.title}</h4>
      <p
        style={{
          color: displaySettings?.color,
          flexDirection:
            displaySettings?.orientation === 'horizontal' ? 'row' : 'column',
        }}
        {...pa('description')}
      >
        {content.description}
      </p>
    </div>
  );
}
```

Display templates give editors powerful styling control while keeping your codebase maintainable and type-safe.
