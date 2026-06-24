export interface FrameworkConfig {
  key: string;
  label: string;
  detectPackage: string;
  createCommand: string;
}

export interface TemplateConfig {
  name: string;
  label: string;
  hint: string;
  framework: string;
  source: string;
}

export const FRAMEWORKS: FrameworkConfig[] = [
  { key: 'nextjs', label: 'Next.js', detectPackage: 'next', createCommand: 'npx create-next-app@latest' },
  { key: 'tanstack', label: 'TanStack Start', detectPackage: '@tanstack/react-start', createCommand: 'npx create-start@latest' },
];

export const TEMPLATES: TemplateConfig[] = [
  { name: 'nextjs-starter', label: 'Next.js Starter', hint: 'Minimal Next.js + Optimizely CMS', framework: 'nextjs', source: 'samples/nextjs-template' },
  { name: 'nextjs-alloy', label: 'Next.js Alloy', hint: 'Full demo site with Tailwind', framework: 'nextjs', source: 'templates/alloy-template' },
  { name: 'tanstack-starter', label: 'TanStack Start', hint: 'TanStack Start + Optimizely CMS', framework: 'tanstack', source: 'samples/tanstack-template' },
];

export const PACKAGES = {
  sdk: { name: '@optimizely/cms-sdk', pkgDir: 'packages/optimizely-cms-sdk' },
  cli: { name: '@optimizely/cms-cli', pkgDir: 'packages/optimizely-cms-cli' },
} as const;

export const TEMPLATE_NAMES = TEMPLATES.map(t => t.name);

export function getFrameworkLabel(key: string): string {
  return FRAMEWORKS.find(f => f.key === key)?.label ?? key;
}
