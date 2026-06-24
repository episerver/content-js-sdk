import type { PackageManager } from './types.js';

export function getInstallCommand(pm: PackageManager): string {
  return pm === 'yarn' ? 'yarn' : `${pm} install`;
}

export function getAddCommand(pm: PackageManager, deps: string[], isDev: boolean): string {
  switch (pm) {
    case 'npm':
      return `npm install ${isDev ? '--save-dev' : ''} ${deps.join(' ')}`.trim();
    case 'pnpm':
      return `pnpm add ${isDev ? '-D' : ''} ${deps.join(' ')}`.trim();
    case 'yarn':
      return `yarn add ${isDev ? '-D' : ''} ${deps.join(' ')}`.trim();
  }
}

export function getRunCommand(pm: PackageManager, script: string): string {
  return pm === 'npm' ? `npm run ${script}` : `${pm} ${script}`;
}
