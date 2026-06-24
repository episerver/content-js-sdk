import type { FRAMEWORKS, TEMPLATES } from './registry.js';

export type Framework = (typeof FRAMEWORKS)[number]['key'];

export type TemplateName = (typeof TEMPLATES)[number]['name'];

export type PackageManager = 'npm' | 'pnpm' | 'yarn';

export type Mode = 'create' | 'scaffold' | 'fresh';

export interface CreateOptions {
  mode: 'create';
  projectName: string;
  template: TemplateName;
  packageManager: PackageManager;
  skipInstall: boolean;
}

export interface ScaffoldOptions {
  mode: 'scaffold';
  framework: Framework;
  addSdk: boolean;
  addCli: boolean;
  packageManager: PackageManager;
  skipInstall: boolean;
}

export interface FreshCreateOptions {
  mode: 'fresh';
  projectName: string;
  framework: Framework;
  packageManager: PackageManager;
  skipInstall: boolean;
}

export type Options = CreateOptions | ScaffoldOptions | FreshCreateOptions;

export interface ParsedArgs {
  projectName?: string;
  template?: TemplateName;
  packageManager?: PackageManager;
  skipInstall: boolean;
  help: boolean;
  version: boolean;
}
