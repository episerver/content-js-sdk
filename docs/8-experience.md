# Working with Experiences

Experiences are a powerful content type in Optimizely CMS that enable flexible, visual page building. Unlike traditional page types with fixed layouts, experiences support dynamic compositions made up of sections and elements that editors can arrange and customize through a visual interface.

## What is an Experience?

An experience (`_experience`) is a unique content type that:

- Provides a specialized page type with enhanced visual editing capabilities
- Supports dynamic layouts composed of nested sections and elements
- Functions as an independent content instance and cannot be embedded as a property in other content types

Experiences are flexible pages where editors drag and drop sections and elements in the Visual Builder to create dynamic layouts.

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

To render an experience, you'll use the `OptimizelyExperience` component, which handles the dynamic composition structure:

```tsx
import {
  ComponentContainerProps,
  getPreviewUtils,
  OptimizelyComponent,
  OptimizelyExperience,
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

      <OptimizelyExperience
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

**`OptimizelyExperience`**  
This component recursively renders the entire composition structure, handling both structural nodes (rows, columns) and component nodes (your custom components).

**`ComponentWrapper`**  
A wrapper function that wraps each component in the composition. This is where you add preview attributes using `pa(node)` to enable on-page editing in preview mode.

## Using the Built-in BlankExperience

The SDK provides `BlankExperienceContentType`, a ready-to-use experience type with no predefined properties. It's perfect for creating flexible pages where the entire layout is built visually:

```tsx
import { BlankExperienceContentType, Infer } from '@optimizely/cms-sdk';
import {
  ComponentContainerProps,
  OptimizelyExperience,
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
      <OptimizelyExperience
        nodes={opti.composition.nodes ?? []}
        ComponentWrapper={ComponentWrapper}
      />
    </main>
  );
}
```

Since `BlankExperienceContentType` has no custom properties, the entire page layout is managed through the visual composition interface. This gives editors maximum flexibility.

## Working with Sections

Sections are structural containers within experiences, typically representing rows in a grid layout. Components can be marked as "section-enabled" to allow them to be used within the composition.

### Using BlankSection

The SDK provides `BlankSectionContentType` for creating generic section containers. Here's how to render a section with the `OptimizelyGridSection` component:

```tsx
import { BlankSectionContentType, Infer } from '@optimizely/cms-sdk';
import {
  OptimizelyGridSection,
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

**`OptimizelyGridSection`**  
This component renders a grid-based layout for section contents. It handles the structural organization of components within the section, including rows and columns.

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

- `'sectionEnabled'` - Allows the component to be used as a section container
- `'elementEnabled'` - Allows the component to be used as an individual element
- You can specify both: `['sectionEnabled', 'elementEnabled']`

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

### Combine Fixed and Dynamic Content

Experiences work well when you combine fixed header/footer areas with dynamic composition areas:

```tsx
export default function AboutExperience({ opti }: Props) {
  const { pa } = getPreviewUtils(opti);

  return (
    <main>
      {/* Fixed header section */}
      <header>
        <h1 {...pa('title')}>{opti.title}</h1>
      </header>

      {/* Dynamic composition area */}
      <OptimizelyExperience
        nodes={opti.composition.nodes ?? []}
        ComponentWrapper={ComponentWrapper}
      />

      {/* Fixed footer could go here */}
    </main>
  );
}
```

### Handle Empty Compositions Gracefully

Always provide fallback for empty compositions:

```tsx
<OptimizelyExperience
  nodes={opti.composition.nodes ?? []}
  ComponentWrapper={ComponentWrapper}
/>
```

> [!TIP]
> The `?? []` ensures the component doesn't break when there are no nodes yet.
