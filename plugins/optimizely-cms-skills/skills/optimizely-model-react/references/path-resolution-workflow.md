# Path Resolution Verification Workflow

This guide shows the complete workflow for verifying tsconfig.json path resolution when adding component imports.

## Scenario

You've created an `Article` component at `src/components/Article.tsx` and need to import it in `app/layout.tsx` for registration.

## Step-by-Step Verification

### Step 1: Check tsconfig.json Configuration

**Read the tsconfig.json file:**

```bash
cat tsconfig.json
```

**Look for these fields:**

```json
{
  "compilerOptions": {
    "baseUrl": ".",           // ← REQUIRED for paths to work
    "paths": {
      "@/*": ["./src/*"]      // ← This is your alias pattern
    }
  }
}
```

**Key points:**
- `baseUrl` MUST be present (usually `"."` or `"./"`)
- `paths` defines the alias mapping
- Without `baseUrl`, path aliases won't work

### Step 2: Determine Import Path from Configuration

**Given:**
- File location: `src/components/Article.tsx`
- tsconfig: `"@/*": ["./src/*"]` + `"baseUrl": "."`

**Calculate import path:**
1. File is at: `src/components/Article.tsx`
2. Alias `@/*` maps to `./src/*`
3. Remove `./src/` prefix: `components/Article.tsx`
4. Add `@/` prefix: `@/components/Article.tsx`
5. Remove `.tsx` extension: `@/components/Article`

**Result:** `import Article from '@/components/Article'`

### Step 3: Check Existing Imports (Most Reliable Method)

**Open the registration file:**

```bash
# Find the registration file
grep -r "initReactComponentRegistry" --include="*.tsx" --include="*.ts"
```

**Example output:**
```
app/layout.tsx:import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';
```

**Open app/layout.tsx and look at existing imports:**

```tsx
// app/layout.tsx
import HomePage from '@/components/HomePage';
import Hero from '@/components/Hero';
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';

initReactComponentRegistry({
  resolver: {
    HomePage,
    Hero,
  },
});
```

**Pattern observed:** Existing imports use `@/components/[ComponentName]`

**Your new import should match:**
```tsx
import Article, { ArticleContentType } from '@/components/Article';
```

### Step 4: Add Import and Test TypeScript Resolution

**Add the import to app/layout.tsx:**

```tsx
// app/layout.tsx
import HomePage from '@/components/HomePage';
import Hero from '@/components/Hero';
import Article, { ArticleContentType } from '@/components/Article'; // ← New import
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';
```

**Verify TypeScript accepts it:**

```bash
# Check for TypeScript errors (doesn't compile, just type-checks)
npx tsc --noEmit
```

**Expected output:**
```
# No errors = ✅ Import path works
# If you see errors, continue to Step 5
```

### Step 5: Visual Verification in IDE

**In VS Code or your editor:**

1. **Hover over the import:**
   ```tsx
   import Article from '@/components/Article';
   //                   ^^^^^^^^^^^^^^^^^^^^^^
   //                   Hover here
   ```

2. **Check the tooltip:**
   - ✅ Shows full file path → Path resolves correctly
   - ❌ Shows "Cannot find module" → Path is wrong

3. **Test auto-completion:**
   - Delete the import and start typing: `import Article from '@/`
   - Press `Ctrl+Space` (Windows) or `Cmd+Space` (Mac)
   - If `@/components/Article` appears in suggestions → Path works
   - If nothing appears or suggestions are wrong → Path broken

4. **Click-through test:**
   - `Cmd+Click` (Mac) or `Ctrl+Click` (Windows) on `'@/components/Article'`
   - Should jump to `src/components/Article.tsx`
   - If it doesn't jump → Path resolution failing

### Step 6: Test with Build Command

**Run the actual build:**

```bash
npm run build
# or
yarn build
# or
pnpm build
```

**Check for module resolution errors:**
```
✅ Success: Build completes without errors → Import works
❌ Error: "Cannot find module '@/components/Article'" → Path broken
```

### Step 7: Fallback to Relative Path (If Alias Fails)

**If path alias doesn't work, calculate relative path:**

```
From: app/layout.tsx
To:   src/components/Article.tsx

Relative path:
- Go up one level: ../
- Enter src: ../src/
- Enter components: ../src/components/
- File: ../src/components/Article.tsx
- Remove .tsx: ../src/components/Article

Result: import Article from '../src/components/Article';
```

**Test the relative import:**

```tsx
// app/layout.tsx
import Article from '../src/components/Article';  // ✅ Relative imports always work
```

## Common Scenarios

### Scenario A: Next.js with src Directory

**Project structure:**
```
project/
├── src/
│   ├── app/
│   │   └── layout.tsx
│   └── components/
│       └── Article.tsx
├── tsconfig.json
└── package.json
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Import from src/app/layout.tsx:**
```tsx
import Article from '@/components/Article';  // ✅ Correct
```

### Scenario B: Next.js with App Directory at Root

**Project structure:**
```
project/
├── app/
│   └── layout.tsx
├── components/
│   └── Article.tsx
├── tsconfig.json
└── package.json
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

**Import from app/layout.tsx:**
```tsx
import Article from '@/components/Article';  // ✅ Correct
```

### Scenario C: Monorepo with Multiple tsconfig Files

**Project structure:**
```
monorepo/
├── apps/
│   └── web/
│       ├── src/
│       │   ├── app/layout.tsx
│       │   └── components/Article.tsx
│       └── tsconfig.json          ← Uses this
└── tsconfig.base.json
```

**apps/web/tsconfig.json:**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Import from apps/web/src/app/layout.tsx:**
```tsx
import Article from '@/components/Article';  // ✅ Uses local tsconfig.json
```

### Scenario D: Vite Project (Requires vite.config.ts)

**tsconfig.json alone is NOT enough for Vite.**

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**vite.config.ts (REQUIRED):**
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),  // ← Must match tsconfig paths
    },
  },
});
```

**Import:**
```tsx
import Article from '@/components/Article';  // ✅ Works after both configs
```

## Troubleshooting Decision Tree

```
Import fails?
│
├─ Step 1: Does file exist?
│  │
│  ├─ No → Create the file first
│  └─ Yes → Continue to Step 2
│
├─ Step 2: Is baseUrl set in tsconfig.json?
│  │
│  ├─ No → Add "baseUrl": "." to compilerOptions
│  └─ Yes → Continue to Step 3
│
├─ Step 3: Does tsconfig.json have paths configured?
│  │
│  ├─ No → Use relative import instead
│  └─ Yes → Continue to Step 4
│
├─ Step 4: Do other imports in the file use the same alias?
│  │
│  ├─ Yes → Copy their exact pattern
│  └─ No → Continue to Step 5
│
├─ Step 5: Are you using Vite?
│  │
│  ├─ Yes → Add alias to vite.config.ts
│  └─ No → Continue to Step 6
│
├─ Step 6: Does npx tsc --noEmit show the error?
│  │
│  ├─ Yes → Path alias misconfigured, check tsconfig
│  └─ No → Build tool issue, check webpack/next.config
│
└─ Step 7: Restart TypeScript server and try again
   │
   ├─ Still fails → Use relative import
   └─ Works → Path alias fixed!
```

## Quick Reference: Common Path Patterns

| Pattern | tsconfig.json | File at | Import as | Notes |
|---------|--------------|---------|-----------|-------|
| Next.js (src) | `"@/*": ["./src/*"]` | `src/components/Article.tsx` | `@/components/Article` | Alias strips `./src/` |
| Next.js (root) | `"@/*": ["./*"]` | `components/Article.tsx` | `@/components/Article` | File at root level |
| **Next.js (root alias, file in src)** | `"@/*": ["./*"]` | `src/components/Article.tsx` | `@/src/components/Article` | **MUST include src/** ⚠️ |
| Tilde alias | `"~/*": ["./src/*"]` | `src/components/Article.tsx` | `~/components/Article` | Alternative symbol |
| BaseUrl only | `"baseUrl": "./src"` | `src/components/Article.tsx` | `components/Article` | Relative from baseUrl |
| Relative (always works) | N/A | `src/components/Article.tsx` from `app/layout.tsx` | `../src/components/Article` | Safest fallback |

⚠️ **Most common mistake**: When tsconfig has `"@/*": ["./*"]` (maps to root) and file is in `src/components/`, developers often write `@/components/Article` (forgetting `src/`), causing "Cannot find module" errors. The correct import is `@/src/components/Article`.

## Testing Checklist

Before reporting completion, verify:

- [ ] tsconfig.json has `baseUrl` set
- [ ] Import path matches existing patterns in the file
- [ ] `npx tsc --noEmit` shows no errors
- [ ] IDE hover shows file path (not error)
- [ ] IDE Cmd/Ctrl+Click jumps to the file
- [ ] `npm run build` completes successfully
- [ ] Component is actually registered and used in the code

If ANY of these fail, the import path is not correct yet.
