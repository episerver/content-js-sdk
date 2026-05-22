export type Framework = 'nextjs' | 'tanstack';

export type TemplateName = 'nextjs-starter' | 'nextjs-alloy' | 'tanstack-starter';

export type PackageManager = 'npm' | 'pnpm' | 'yarn';

export type Mode = 'create' | 'scaffold';

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

export type Options = CreateOptions | ScaffoldOptions;

export interface ParsedArgs {
  projectName?: string;
  template?: TemplateName;
  packageManager?: PackageManager;
  skipInstall: boolean;
  help: boolean;
  version: boolean;
}
