# Configuration

The Optimizely CMS SDK provides flexible configuration options for build-time setup, environment variables, and performance tuning. Proper configuration ensures optimal performance and seamless integration with your development workflow.

## Overview

Configuration in the CMS SDK covers:
- **Build Configuration**: Component discovery and build-time processing
- **Environment Variables**: Runtime configuration and API keys
- **Performance Settings**: Query optimization and caching
- **Development Tools**: Debugging and development helpers

## Build Configuration

### Basic Build Config

Create `optimizely.config.mjs` in your project root:

```javascript
import { buildConfig } from '@episerver/cms-sdk';

export default buildConfig({
  components: [
    './src/components/**/*.tsx',
    './src/components/**/*.ts'
  ]
});
```

### Advanced Build Config

```javascript
import { buildConfig } from '@episerver/cms-sdk';

export default buildConfig({
  // Component discovery patterns
  components: [
    './src/components/**/*.tsx',
    './src/components/**/*.ts',
    './src/blocks/**/*.tsx',
    './src/pages/**/*.tsx'
  ],
  
  // Additional configuration options can be added here
  // as the SDK evolves
});
```

### Component Discovery

The build configuration tells the SDK where to find your content components:

```
src/
├── components/
│   ├── Article.tsx          ← Discovered
│   ├── Product.tsx          ← Discovered
│   ├── Hero.tsx             ← Discovered
│   └── shared/
│       ├── Button.tsx       ← Discovered (matches pattern)
│       └── Layout.tsx       ← Discovered (matches pattern)
├── blocks/
│   ├── CallToAction.tsx     ← Discovered (if pattern included)
│   └── Gallery.tsx          ← Discovered (if pattern included)
└── utils/
    └── helpers.ts           ← Not discovered (doesn't match pattern)
```

### Multiple Configuration Files

For complex projects, you can organize configurations:

```javascript
// optimizely.config.mjs (main config)
import { buildConfig } from '@episerver/cms-sdk';
import { componentPatterns } from './config/components.mjs';

export default buildConfig({
  components: componentPatterns
});
```

```javascript
// config/components.mjs
export const componentPatterns = [
  // Page components
  './src/pages/**/*.tsx',
  
  // Reusable components
  './src/components/**/*.tsx',
  
  // Block components
  './src/blocks/**/*.tsx',
  
  // Layout components
  './src/layouts/**/*.tsx'
];
```

## Environment Variables

### Required Variables

```bash
# .env.local
# Required: Your Optimizely Graph Single Key
OPTIMIZELY_GRAPH_SINGLE_KEY=your_single_key_here
```

### Optional Variables

```bash
# Optional: Custom Graph URL (defaults to Optimizely's public endpoint)
OPTIMIZELY_GRAPH_URL=https://cg.optimizely.com/content/v2

# Optional: Custom Graph Gateway URL for special deployments
OPTIMIZELY_GRAPH_GATEWAY_URL=https://your-custom-gateway.com

# Performance: Fragment threshold for query optimization
MAX_FRAGMENT_THRESHOLD=100

# Development: Enable debug mode
OPTIMIZELY_DEBUG=true

# Preview: Preview endpoint configuration
OPTIMIZELY_PREVIEW_URL=https://your-cms-instance.cms.optimizely.com
```

### Environment-Specific Configuration

#### Development

```bash
# .env.development
OPTIMIZELY_GRAPH_SINGLE_KEY=dev_key_here
OPTIMIZELY_DEBUG=true
MAX_FRAGMENT_THRESHOLD=50
NEXT_PUBLIC_OPTIMIZELY_PREVIEW_MODE=true
```

#### Staging

```bash
# .env.staging
OPTIMIZELY_GRAPH_SINGLE_KEY=staging_key_here
OPTIMIZELY_DEBUG=false
MAX_FRAGMENT_THRESHOLD=75
NEXT_PUBLIC_OPTIMIZELY_PREVIEW_MODE=true
```

#### Production

```bash
# .env.production
OPTIMIZELY_GRAPH_SINGLE_KEY=prod_key_here
OPTIMIZELY_DEBUG=false
MAX_FRAGMENT_THRESHOLD=100
NEXT_PUBLIC_OPTIMIZELY_PREVIEW_MODE=false
```

### Client vs Server Variables

For Next.js applications, understand the difference:

```bash
# Server-side only (secure)
OPTIMIZELY_GRAPH_SINGLE_KEY=server_key

# Client-side (public - be careful!)
NEXT_PUBLIC_OPTIMIZELY_GRAPH_KEY=public_key

# Preview mode (client-side for preview components)
NEXT_PUBLIC_OPTIMIZELY_PREVIEW_MODE=true
```

## Framework-Specific Configuration

### Next.js Configuration

#### App Router Setup

```typescript
// app/layout.tsx
import { PreviewComponent } from '@episerver/cms-sdk/react/client';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* Enable preview mode */}
        <PreviewComponent />
      </body>
    </html>
  );
}
```

#### Pages Router Setup

```typescript
// pages/_app.tsx
import type { AppProps } from 'next/app';
import { PreviewComponent } from '@episerver/cms-sdk/react/client';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <PreviewComponent />
    </>
  );
}
```

#### Next.js Config Extensions

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable server actions if needed
    serverActions: true,
  },
  
  // Image optimization for Optimizely media
  images: {
    domains: [
      'your-cms-instance.cms.optimizely.com',
      'assets.your-cms-instance.cms.optimizely.com'
    ],
  },
  
  // Environment variables
  env: {
    OPTIMIZELY_GRAPH_URL: process.env.OPTIMIZELY_GRAPH_URL,
  },
};

module.exports = nextConfig;
```

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  // Define environment variables
  define: {
    'process.env.OPTIMIZELY_GRAPH_SINGLE_KEY': JSON.stringify(
      process.env.OPTIMIZELY_GRAPH_SINGLE_KEY
    ),
  },
  
  // Server configuration for development
  server: {
    port: 3000,
    host: true,
  },
});
```

### Create React App Configuration

```bash
# .env
# CRA automatically loads REACT_APP_ prefixed variables
REACT_APP_OPTIMIZELY_GRAPH_KEY=your_key_here
REACT_APP_OPTIMIZELY_GRAPH_URL=https://cg.optimizely.com/content/v2
```

```typescript
// src/config/optimizely.ts
export const optimizelyConfig = {
  graphKey: process.env.REACT_APP_OPTIMIZELY_GRAPH_KEY!,
  graphUrl: process.env.REACT_APP_OPTIMIZELY_GRAPH_URL || 'https://cg.optimizely.com/content/v2',
};
```

## Performance Configuration

### Fragment Threshold Tuning

The SDK monitors query complexity and warns about performance issues:

```typescript
// Adjust the threshold based on your needs
process.env.MAX_FRAGMENT_THRESHOLD = '50'; // More strict
// or
process.env.MAX_FRAGMENT_THRESHOLD = '200'; // More permissive
```

### Query Optimization

```typescript
// src/lib/optimizely-client.ts
import { GraphClient } from '@episerver/cms-sdk';

// Configure client with performance options
export const optimizelyClient = new GraphClient(
  process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  {
    graphUrl: process.env.OPTIMIZELY_GRAPH_URL,
    // Additional options as they become available
  }
);
```

### Caching Configuration

#### Next.js Caching

```typescript
// app/[...slug]/page.tsx
export const revalidate = 3600; // Cache for 1 hour

export default async function Page({ params }: { params: { slug: string[] } }) {
  // Content will be cached and revalidated every hour
  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!);
  const content = await client.fetchContent(`/${params.slug.join('/')}/`);
  
  return <OptimizelyComponent opti={content} />;
}
```

#### Custom Caching

```typescript
// src/lib/cache.ts
const contentCache = new Map();

export async function getCachedContent(path: string) {
  if (contentCache.has(path)) {
    const { content, timestamp } = contentCache.get(path);
    
    // Cache for 5 minutes
    if (Date.now() - timestamp < 5 * 60 * 1000) {
      return content;
    }
  }
  
  const client = new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!);
  const content = await client.fetchContent(path);
  
  contentCache.set(path, {
    content,
    timestamp: Date.now()
  });
  
  return content;
}
```

## Debug Configuration

### Enable Debug Mode

```typescript
// src/lib/debug.ts
export const isDebugMode = process.env.OPTIMIZELY_DEBUG === 'true' ||
                          process.env.NODE_ENV === 'development';

export function debugLog(message: string, data?: any) {
  if (isDebugMode) {
    console.log(`[Optimizely Debug] ${message}`, data);
  }
}
```

### Debug Component Registry

```typescript
// src/lib/optimizely.ts
import { initReactComponentRegistry } from '@episerver/cms-sdk/react/server';
import { debugLog } from './debug';

initReactComponentRegistry({
  resolver: (contentType: string) => {
    debugLog(`Resolving component for content type: ${contentType}`);
    
    const component = componentMap[contentType];
    
    if (!component) {
      debugLog(`No component found for content type: ${contentType}`);
    }
    
    return component || null;
  }
});
```

### Request Debugging

```typescript
// src/lib/optimizely-client.ts
import { GraphClient } from '@episerver/cms-sdk';
import { debugLog } from './debug';

class DebugGraphClient extends GraphClient {
  async request(query: string, variables: any, previewToken?: string) {
    debugLog('GraphQL Request', { query, variables, previewToken });
    
    const start = performance.now();
    const result = await super.request(query, variables, previewToken);
    const duration = performance.now() - start;
    
    debugLog(`GraphQL Response (${duration.toFixed(2)}ms)`, result);
    
    return result;
  }
}

export const client = process.env.OPTIMIZELY_DEBUG === 'true' 
  ? new DebugGraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!)
  : new GraphClient(process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!);
```

## TypeScript Configuration

### Recommended tsconfig.json

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/content-types/*": ["./src/content-types/*"],
      "@/components/*": ["./src/components/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

### Type Declaration Extensions

```typescript
// types/optimizely.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      OPTIMIZELY_GRAPH_SINGLE_KEY: string;
      OPTIMIZELY_GRAPH_URL?: string;
      MAX_FRAGMENT_THRESHOLD?: string;
      OPTIMIZELY_DEBUG?: string;
    }
  }
}

export {};
```

## CI/CD Configuration

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        env:
          OPTIMIZELY_GRAPH_SINGLE_KEY: ${{ secrets.OPTIMIZELY_GRAPH_SINGLE_KEY }}
          OPTIMIZELY_GRAPH_URL: ${{ secrets.OPTIMIZELY_GRAPH_URL }}
        run: npm run build
      
      - name: Deploy
        # Your deployment steps
        run: npm run deploy
```

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# Build arguments for environment variables
ARG OPTIMIZELY_GRAPH_SINGLE_KEY
ARG OPTIMIZELY_GRAPH_URL

ENV OPTIMIZELY_GRAPH_SINGLE_KEY=$OPTIMIZELY_GRAPH_SINGLE_KEY
ENV OPTIMIZELY_GRAPH_URL=$OPTIMIZELY_GRAPH_URL

RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
```

## Configuration Validation

### Environment Validation

```typescript
// src/lib/config-validation.ts
import { z } from 'zod';

const configSchema = z.object({
  OPTIMIZELY_GRAPH_SINGLE_KEY: z.string().min(1, 'Graph Single Key is required'),
  OPTIMIZELY_GRAPH_URL: z.string().url().optional(),
  MAX_FRAGMENT_THRESHOLD: z.string().transform(Number).pipe(z.number().positive()).optional(),
  OPTIMIZELY_DEBUG: z.enum(['true', 'false']).optional(),
});

export function validateConfig() {
  try {
    return configSchema.parse(process.env);
  } catch (error) {
    console.error('Configuration validation failed:', error);
    throw new Error('Invalid configuration. Please check your environment variables.');
  }
}

// Call during app initialization
validateConfig();
```

### Runtime Configuration Check

```typescript
// src/lib/config-check.ts
export function checkConfiguration() {
  const issues: string[] = [];
  
  if (!process.env.OPTIMIZELY_GRAPH_SINGLE_KEY) {
    issues.push('OPTIMIZELY_GRAPH_SINGLE_KEY is required');
  }
  
  if (process.env.MAX_FRAGMENT_THRESHOLD) {
    const threshold = Number(process.env.MAX_FRAGMENT_THRESHOLD);
    if (isNaN(threshold) || threshold <= 0) {
      issues.push('MAX_FRAGMENT_THRESHOLD must be a positive number');
    }
  }
  
  if (issues.length > 0) {
    throw new Error(`Configuration issues:\n${issues.join('\n')}`);
  }
}
```

## Best Practices

### 1. Environment Organization

```
.env.local          # Local development (never commit)
.env.development    # Development defaults (can commit)
.env.staging        # Staging configuration (can commit)
.env.production     # Production configuration (can commit)
.env.example        # Example configuration (commit this)
```

### 2. Secure Key Management

```bash
# ❌ Don't do this
OPTIMIZELY_GRAPH_SINGLE_KEY=abc123key

# ✅ Use your deployment platform's secret management
# Vercel: Environment Variables in dashboard
# Netlify: Site settings > Environment variables
# AWS: Systems Manager Parameter Store
# Azure: Key Vault
```

### 3. Configuration Layering

```typescript
// src/lib/config.ts
const defaultConfig = {
  graphUrl: 'https://cg.optimizely.com/content/v2',
  fragmentThreshold: 100,
  debug: false,
};

const envConfig = {
  graphKey: process.env.OPTIMIZELY_GRAPH_SINGLE_KEY!,
  graphUrl: process.env.OPTIMIZELY_GRAPH_URL || defaultConfig.graphUrl,
  fragmentThreshold: Number(process.env.MAX_FRAGMENT_THRESHOLD) || defaultConfig.fragmentThreshold,
  debug: process.env.OPTIMIZELY_DEBUG === 'true',
};

export const config = { ...defaultConfig, ...envConfig };
```

### 4. Feature Flags

```typescript
// src/lib/features.ts
export const features = {
  previewMode: process.env.NEXT_PUBLIC_OPTIMIZELY_PREVIEW_MODE === 'true',
  debugMode: process.env.OPTIMIZELY_DEBUG === 'true',
  experimentalFeatures: process.env.OPTIMIZELY_EXPERIMENTAL === 'true',
};
```

## Troubleshooting

### Common Configuration Issues

**Build fails with "Cannot find module"**:
- Check that `optimizely.config.mjs` exists in project root
- Verify component patterns match your file structure

**GraphQL errors in production**:
- Ensure Graph Single Key is set correctly
- Check that Graph URL is accessible from your deployment environment

**Components not resolving**:
- Verify component registry is initialized before rendering
- Check that component patterns include all necessary files

**Performance warnings**:
- Adjust MAX_FRAGMENT_THRESHOLD based on your content complexity
- Review content type relationships for circular references

For more troubleshooting, see the [Advanced Usage guide](./advanced-usage.md#troubleshooting).

## Next Steps

- **[API Reference](./api-reference.md)** - Explore the complete configuration API
- **[Advanced Usage](./advanced-usage.md)** - Learn optimization techniques
- **[CLI Configuration](../cms-cli/configuration-management.md)** - Set up content type deployment

---

*Proper configuration is crucial for optimal performance and seamless development experience. Take time to set up your environment correctly - it will save you time and headaches later.*