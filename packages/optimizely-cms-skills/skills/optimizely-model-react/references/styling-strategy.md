# CSS/SCSS Integration Strategy

This reference provides guidance on integrating existing CSS/SCSS classes when generating React components for Optimizely CMS content types.

## Overview

Before generating a component, check for existing styles to maintain consistency with the project's design system and avoid creating duplicate or conflicting styles.

## Locating Style Files

Search for CSS/SCSS files in the project using these patterns:

```bash
glob: "**/*.css"
glob: "**/*.scss"
glob: "**/*.module.css"
glob: "**/*.module.scss"
```

## Searching for Relevant Classes

Look for class names that might apply to your component based on its purpose:

### Component-Specific Classes

- **Hero component**: Search for patterns like `hero`, `banner`, `header`, `jumbotron`
- **Card component**: Search for `card`, `tile`, `item`, `panel`
- **Article component**: Search for `article`, `post`, `content`, `entry`
- **Gallery component**: Search for `gallery`, `grid`, `carousel`, `slider`

### Structural Classes

Look for common layout and structural classes:
- Container: `container`, `wrapper`, `layout`
- Section: `section`, `block`, `area`
- Grid: `grid`, `flex`, `columns`, `row`

### Typography Classes

Search for text-related classes:
- Headings: `heading`, `title`, `headline`, `h1`, `h2`
- Body: `body-text`, `content`, `copy`, `paragraph`
- Meta: `subtitle`, `description`, `caption`, `meta`

## Reviewing Existing Components

Check how similar components use className:

```bash
grep: "className=" glob: "**/*.tsx"
```

Look at components with:
- Similar visual structure
- Same base type (e.g., other `_page` types for page components)
- Related content areas (e.g., other hero sections)

## Using Existing Classes

### When to Prefer Existing Classes

Use existing classes when:
- They match the component's semantic purpose
- They provide the visual styling needed
- They follow the project's established patterns
- They can be combined to achieve the desired layout

### How to Use Existing Classes

1. **Match naming conventions**: Follow the project's pattern (BEM, camelCase, kebab-case, etc.)
2. **Combine utility classes**: Use composition rather than creating new classes
3. **Maintain consistency**: Use the same classes as similar components

**Example:**
```tsx
// After finding existing classes in the project
<article className='blog-experience'>
  <header className='blog-header'>
    <h1 {...pa('title')}>{content.title}</h1>
  </header>
  <section className='blog-articles' {...pa('articles')}>
    {content.articles?.map((article, i) => (
      <OptimizelyComponent key={i} content={article} />
    ))}
  </section>
</article>
```

## Adding New Classes

### When to Add New Classes

Only add new classes when:
- No existing classes fit the component's purpose
- The component needs unique styling not covered by existing patterns
- You're creating a new design pattern for the project

### How to Add New Classes

When adding new classes:

1. **Follow project conventions**: Match the naming pattern used in existing CSS/SCSS files
2. **Use semantic names**: Name classes after their purpose, not their appearance
3. **Consider reusability**: Create classes that could be used by other components
4. **Document usage**: Add comments in the stylesheet explaining the class purpose

**Example:**
```tsx
// Adding new classes that follow project conventions
<section className='product-showcase'>  // New semantic class
  <div className='showcase-grid'>        // New layout class
    {content.products?.map((product, i) => (
      <div key={i} className='product-card'>  // Reusable card class
        <OptimizelyComponent content={product} />
      </div>
    ))}
  </div>
</section>
```

## CSS Module Patterns

If the project uses CSS Modules (`.module.css` or `.module.scss`):

```tsx
import styles from './BlogPage.module.scss';

export default function BlogPage({ content }: BlogPageProps) {
  return (
    <article className={styles.blogExperience}>
      <header className={styles.blogHeader}>
        <h1 {...pa('title')}>{content.title}</h1>
      </header>
    </article>
  );
}
```

## No Styles Workflow

If no relevant CSS files exist or the project doesn't use className attributes:

1. Skip className attributes entirely
2. Generate minimal semantic HTML
3. Use HTML5 semantic elements (`<article>`, `<section>`, `<header>`, `<footer>`)
4. Let the user add styling later if needed

**Example without styles:**
```tsx
export default function BlogPage({ content }: BlogPageProps) {
  return (
    <article>
      <header>
        <h1 {...pa('title')}>{content.title}</h1>
      </header>
      <section {...pa('body')}>
        <RichText content={content.body?.json ?? undefined} />
      </section>
    </article>
  );
}
```

## Tailwind CSS Projects

If the project uses Tailwind CSS:

1. **Look for utility patterns**: Search for common Tailwind utilities in existing components
2. **Use composition**: Combine Tailwind utilities to match existing component styles
3. **Check for custom classes**: Look for `@apply` directives in CSS files
4. **Match spacing**: Use consistent spacing utilities (`p-4`, `mb-6`, etc.)

**Example:**
```tsx
<article className='max-w-4xl mx-auto py-8'>
  <header className='mb-6'>
    <h1 className='text-3xl font-bold' {...pa('title')}>
      {content.title}
    </h1>
  </header>
  <section className='prose prose-lg' {...pa('body')}>
    <RichText content={content.body?.json ?? undefined} />
  </section>
</article>
```

## Best Practices Summary

1. **Always search first**: Look for existing classes before adding new ones
2. **Maintain consistency**: Follow the project's established patterns
3. **Prefer composition**: Combine existing classes rather than creating new ones
4. **Semantic HTML first**: Use proper HTML5 elements even without classes
5. **Don't assume**: If no styles exist, generate clean semantic HTML and let the user add styling
