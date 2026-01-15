# Working with Experiences

Experiences are a powerful content type in Optimizely CMS that enable flexible, visual page building. Unlike traditional page (`_page`) types with fixed layouts, experiences (`_experience`) are routable entry points that support dynamic compositions made up of sections and elements that editors can arrange and customize through the Visual Builder interface.

## Creating an Experience Content Type

To create an experience, set the `baseType` to `'_experience'`:

```tsx
import { contentType, Infer } from '@optimizely/cms-sdk';
import { HeroContentType } from './Hero';
import { BannerContentType } from './Banner';

export const AboutExperienceContentType = contentType({
  key: 'AboutExperience',
  displayName: 'About Experience',
  baseType: '_experience',
  properties: {
    title: {
      type: 'string',
      displayName: 'Title',
    },
    subtitle: {
      type: 'string',
      displayName: 'Subtitle',
    },
    section: {
      type: 'content',
      restrictedTypes: [HeroContentType, BannerContentType],
    },
  },
});
```

The key difference from other content types is the `baseType: '_experience'`, which automatically gives the content type access to the visual composition system.

## Rendering an Experience

To render an experience, you'll use the `OptimizelyComposition` component, which handles the dynamic composition structure:

```tsx
import {
  ComponentContainerProps,
  getPreviewUtils,
  OptimizelyComponent,
  OptimizelyComposition,
} from '@optimizely/cms-sdk/react/server';

type Props = {
  opti: Infer<typeof AboutExperienceContentType>;
};

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);
  return <div {...pa(node)}>{children}</div>;
}

export default function AboutExperience({ opti }: Props) {
  const { pa } = getPreviewUtils(opti);

  return (
    <main className="about-experience">
      <header className="about-header">
        <h1 {...pa('title')}>{opti.title}</h1>
        <p {...pa('subtitle')}>{opti.subtitle}</p>
      </header>

      {opti.section && (
        <div className="about-section" {...pa('section')}>
          <OptimizelyComponent opti={opti.section} />
        </div>
      )}

      <OptimizelyComposition
        nodes={opti.composition.nodes ?? []}
        ComponentWrapper={ComponentWrapper}
      />
    </main>
  );
}
```

### Understanding the Key Parts

**`opti.composition.nodes`**  
Every experience has a `composition` property that contains the visual layout structure. The `nodes` array represents all the sections and elements that editors have added to the experience.

**`<OptimizelyComposition/>`**  
This component recursively renders the entire composition structure, handling both structural nodes (rows, columns) and component nodes (your custom components).

**`<ComponentWrapper/>`**  
A wrapper function that wraps each component in the composition. This is where you add preview attributes using `pa(node)` to enable on-page editing in preview mode.

## Using the Built-in BlankExperience

The SDK provides `BlankExperienceContentType`, a ready-to-use experience type with no predefined properties. It's perfect for creating flexible pages where the entire layout is built visually:

```tsx
import { BlankExperienceContentType, Infer } from '@optimizely/cms-sdk';
import {
  ComponentContainerProps,
  OptimizelyComposition,
  getPreviewUtils,
} from '@optimizely/cms-sdk/react/server';

type Props = {
  opti: Infer<typeof BlankExperienceContentType>;
};

function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);
  return <div {...pa(node)}>{children}</div>;
}

export default function BlankExperience({ opti }: Props) {
  return (
    <main className="blank-experience">
      <OptimizelyComposition
        nodes={opti.composition.nodes ?? []}
        ComponentWrapper={ComponentWrapper}
      />
    </main>
  );
}
```

Since `BlankExperienceContentType` has no custom properties, the entire page layout is managed through the visual composition interface. This gives editors maximum flexibility.

**Note:** The experience uses the outline layout type, meaning sections and section-enabled components are arranged as a flat, ordered list in the Visual Builder.

## Working with Sections

Sections represent a vertical "chunk" of an experience and are extensions of blocks (components). A section has all the features of a block but also has access to the layout system through a composition.

### Creating a Section Content Type

To create a custom section, set the `baseType` to `'_section'`:

```tsx
import { contentType, Infer } from '@optimizely/cms-sdk';

export const HeroSectionContentType = contentType({
  key: 'HeroSection',
  displayName: 'Hero Section',
  baseType: '_section',
  properties: {
    backgroundImage: {
      type: 'contentReference',
      allowedTypes: ['_image'],
    },
    backgroundColor: {
      type: 'string',
      displayName: 'Background Color',
    },
  },
});
```

Section content types can have properties and configuration, while their content (elements) is managed through the grid layout (rows/ columns).

### Using BlankSection

The SDK provides `BlankSectionContentType` for creating generic section containers. Here's how to render a section with the `OptimizelyGridSection` component:

```tsx
import { BlankSectionContentType, Infer } from '@optimizely/cms-sdk';
import {
  OptimizelyGridSection,
  StructureContainerProps,
  getPreviewUtils,
} from '@optimizely/cms-sdk/react/server';

type BlankSectionProps = {
  opti: Infer<typeof BlankSectionContentType>;
};

export default function BlankSection({ opti }: BlankSectionProps) {
  const { pa } = getPreviewUtils(opti);

  return (
    <section {...pa(opti)}>
      <OptimizelyGridSection nodes={opti.nodes} />
    </section>
  );
}
```

**`<OptimizelyGridSection/>`**  
This component renders a grid-based layout for section contents. It handles the structural organization of components within the section, including rows and columns.

### Customizing Row and Column Rendering

You can customize how rows and columns are rendered by providing custom container components:

```tsx
import { BlankSectionContentType, Infer } from '@optimizely/cms-sdk';
import {
  OptimizelyGridSection,
  StructureContainerProps,
  getPreviewUtils,
} from '@optimizely/cms-sdk/react/server';

type BlankSectionProps = {
  opti: Infer<typeof BlankSectionContentType>;
};

function CustomRow({ children, node }: StructureContainerProps) {
  const { pa } = getPreviewUtils(node);
  return (
    <div className="custom-row" {...pa(node)}>
      {children}
    </div>
  );
}

function CustomColumn({ children, node }: StructureContainerProps) {
  const { pa } = getPreviewUtils(node);
  return (
    <div className="custom-column" {...pa(node)}>
      {children}
    </div>
  );
}

export default function BlankSection({ opti }: BlankSectionProps) {
  const { pa } = getPreviewUtils(opti);

  return (
    <section {...pa(opti)}>
      <OptimizelyGridSection
        nodes={opti.nodes}
        row={CustomRow}
        column={CustomColumn}
      />
    </section>
  );
}
```

The `row` and `column` props accept `StructureContainerProps`, which provides:

- `children` - The nested content to render
- `node` - The structure node with metadata like `key`, `displayTemplateKey`, and `displaySettings`

This allows you to apply custom styling, add CSS classes, or implement responsive grid layouts based on your design system.

### Enabling Components for Sections

To allow a component to be used within experience sections, add `compositionBehaviors`:

```tsx
export const LandingSectionContentType = contentType({
  key: 'LandingSection',
  baseType: '_component',
  displayName: 'Landing Section',
  properties: {
    heading: { type: 'string' },
    subtitle: { type: 'string' },
  },
  compositionBehaviors: ['sectionEnabled'],
});
```

**Composition Behaviors:**

- `'sectionEnabled'` - Allows the component to be used as a section container with grid layout capabilities
- `'elementEnabled'` - Allows the component to be used as an element, the smallest building block with actual content data
- You can specify both: `['sectionEnabled', 'elementEnabled']`

## Understanding Elements

Elements are the smallest building blocks in Visual Builder and contain the actual content data of an experience. Elements are also extensions of blocks (components) but with specific restrictions.

### Creating an Element-Enabled Component

To create a component that can be used as an element:

```tsx
export const CallToActionContentType = contentType({
  key: 'CallToAction',
  baseType: '_component',
  displayName: 'Call to Action',
  properties: {
    heading: { type: 'string' },
    buttonText: { type: 'string' },
    buttonLink: { type: 'string' },
  },
  compositionBehaviors: ['elementEnabled'],
});
```

This component can now be dragged into sections within an experience as a content element.

## Registering Experience Components

Don't forget to register your experience components in your application setup:

```tsx
import { initContentTypeRegistry } from '@optimizely/cms-sdk';
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';

import AboutExperience, {
  AboutExperienceContentType,
} from '@/components/AboutExperience';
import BlankExperience from '@/components/BlankExperience';
import BlankSection from '@/components/BlankSection';

// Register content types
initContentTypeRegistry([
  AboutExperienceContentType,
  BlankExperienceContentType,
  BlankSectionContentType,
  // ... other content types
]);

// Register React components
initReactComponentRegistry({
  AboutExperience,
  BlankExperience,
  BlankSection,
  // ... other components
});
```

## Best Practices

### Provide Default Wrappers

Always provide a `ComponentWrapper` to ensure proper preview attribute handling:

```tsx
function ComponentWrapper({ children, node }: ComponentContainerProps) {
  const { pa } = getPreviewUtils(node);
  return <div {...pa(node)}>{children}</div>;
}
```

This enables on-page editing in preview mode, allowing editors to click components and jump to the corresponding CMS field.

### Mixing Static and Composed Content

Experiences can combine static properties (defined in your content type) with dynamic composition areas. This is useful when you need consistent elements like headers alongside flexible content:

```tsx
export default function AboutExperience({ opti }: Props) {
  const { pa } = getPreviewUtils(opti);

  return (
    <main>
      {/* Static content from experience properties */}
      <header className="about-header">
        <h1 {...pa('title')}>{opti.title}</h1>
        <p {...pa('subtitle')}>{opti.subtitle}</p>
      </header>

      {/* Dynamic visual composition */}
      <OptimizelyComposition
        nodes={opti.composition.nodes ?? []}
        ComponentWrapper={ComponentWrapper}
      />
    </main>
  );
}
```

The static properties (`title`, `subtitle`) provide structured fields editors fill in, while `OptimizelyComposition` renders the flexible sections and elements they arrange visually.

> [!TIP]
> Use static properties for critical content that must always be present, and composition areas for flexible, reorderable content blocks.
