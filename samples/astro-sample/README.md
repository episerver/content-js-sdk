# Astro Sample - Optimizely CMS

A full-featured sample application demonstrating Optimizely CMS JavaScript SDK integration with Astro and React.

## Features

- **Astro + React Integration** - Uses Astro's island architecture with React components
- **Static Site Generation** - Pre-renders all CMS content at build time via `getStaticPaths()`
- **Preview Mode** - Edit content live with CMS preview
- **TypeScript** - Full TypeScript support
- **Content Types** - 21 example content types (pages, components, experiences)
- **Display Templates** - Demonstrates visual builder layouts and display settings
- **React Components** - 21 UI-focused React components with separated content type definitions in `lib/contentTypes`

## Project Structure

```md
src/
├── pages/
│   ├── index.astro                      # Home page placeholder
│   ├── [...slug].astro                  # Dynamic content routing
│   └── preview.astro                    # Preview/edit mode
├── components/
│   └── react/                           # 21 React components
│       ├── Landing.tsx
│       ├── Article.tsx
│       ├── FAQ.tsx
│       ├── Hero.tsx
│       └── ... (17 more components)
├── layouts/
│   └── BaseLayout.astro                 # Root HTML layout
├── lib/
│   ├── optimizely.ts                    # SDK initialization & setup
│   └── contentTypes/                    # Separated content type definitions
│       ├── index.ts                     # Central export of all types
│       ├── LandingPage.ts               # Landing page content type
│       ├── Article.ts                   # Article content type
│       ├── Hero.ts                      # Hero component type
│       ├── Tile.ts                      # Tile + display templates
│       ├── LandingSection.ts            # Section + display template
│       └── ... (16 more content types)
├── styles/
│   ├── global.css                       # Global styles
│   └── env.d.ts                         # TypeScript env definitions
└── README.md
```

## Setup

### 1. Install Dependencies

```bash
cd samples/astro-sample
pnpm install
```

### 2. Configure Environment Variables

Copy `.env.template` to `.env.local` or just `.env` and fill in your CMS credentials.

Required variables:

- `OPTIMIZELY_CMS_URL` - Base URL of your CMS instance
- `OPTIMIZELY_GRAPH_SINGLE_KEY` - Content Graph API key
- `OPTIMIZELY_CMS_CLIENT_ID` - CLI client credentials
- `OPTIMIZELY_CMS_CLIENT_SECRET` - CLI client credentials
- `APPLICATION_HOST` - Host where your application runs (e.g., `localhost:3000`)

### 3. Development Server

Start the dev server:

```bash
pnpm dev
```

Visit `https://localhost:3000` (HTTPS required for CMS preview mode).

## Building

### Production Build

```bash
pnpm build
```

Generates static HTML files in `dist/` for all CMS content pages.

### Preview Build Output

```bash
pnpm preview
```

Runs the built output locally for testing.

## Content Sync

Sync content type definitions to your CMS:

```bash
pnpm opti-push
```

This uses `optimizely.config.mjs` to define content types and sample content.

## Architecture

### SDK Initialization

SDK initialization happens in `src/lib/optimizely.ts` which:

1. Configures API connection
2. Registers all content type definitions
3. Registers React component resolvers
4. Registers display templates

This module is imported and called from each page to ensure initialization before rendering.

### Routing

**Dynamic Routes** (`[...slug].astro`):

- Queries all CMS pages at build time via `getStaticPaths()`
- Pre-renders static HTML for each content path
- Falls back to 404 if content not found

**Preview Mode** (`preview.astro`):

- Accepts preview query parameters
- Uses client-side rendering with CMS communication injector
- Allows live editing in CMS preview interface

### Component Rendering

React components are rendered via `OptimizelyComponent` which:

1. Looks up the component in the registry by content type name
2. Passes content properties as component props
3. Renders with preview attributes (`pa()`) for edit mode

## Astro-Specific Patterns

### Client Directives

Interactive components use Astro client directives:

- `client:load` - Hydrate immediately (used for OptimizelyComponent for preview support)
- `client:visible` - Lazy hydration when scrolled into view
- `client:only="react"` - Client-side only rendering (used in preview mode)

### Static Generation

All routes are pre-rendered at build time:

1. `getStaticPaths()` queries CMS for all content
2. Astro builds static HTML for each path
3. No runtime server needed for content routes

## Styling

Global CSS (`src/styles/global.css`) includes:

- CSS variables for colors and fonts
- Responsive layout patterns
- Component-specific styles

Fonts loaded from Google Fonts API:

- Bodoni Moda (serif)
- Inter (sans-serif)

## License

MIT
