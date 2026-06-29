import * as p from '@clack/prompts';
import type { CreateOptions, ScaffoldOptions, FreshCreateOptions, Mode, TemplateName, PackageManager, Framework } from './types.js';
import { detectFramework, detectPackageManager, isExistingProject } from './detect.js';
import { isValidProjectName } from './utils.js';
import { TEMPLATES, FRAMEWORKS, getFrameworkLabel } from './registry.js';

export async function runPrompts(args: {
  projectName?: string;
  template?: TemplateName;
  packageManager?: PackageManager;
  skipInstall: boolean;
}): Promise<CreateOptions | ScaffoldOptions | FreshCreateOptions | null> {
  p.intro('Optimizely CMS — Create a new project');

  const cwd = process.cwd();
  const existingProject = isExistingProject(cwd);

  let mode: Mode = 'create';

  if (args.projectName) {
    mode = 'create';
  } else if (existingProject) {
    const modeResult = await p.select({
      message: 'What would you like to do?',
      options: [
        { value: 'create', label: 'Create a new project from template' },
        { value: 'fresh', label: 'Create a fresh project', hint: 'Runs create-next-app or create-start, then adds Optimizely' },
        { value: 'scaffold', label: 'Add Optimizely CMS to this project' },
      ],
    });
    if (p.isCancel(modeResult)) return null;
    mode = modeResult as Mode;
  } else {
    const modeResult = await p.select({
      message: 'How would you like to create your project?',
      options: [
        { value: 'create', label: 'From an Optimizely template', hint: 'Pre-configured starter projects' },
        { value: 'fresh', label: 'Fresh project', hint: 'Runs create-next-app or create-start, then adds Optimizely' },
      ],
    });
    if (p.isCancel(modeResult)) return null;
    mode = modeResult as Mode;
  }

  if (mode === 'scaffold') {
    return runScaffoldPrompts(cwd, args);
  }

  if (mode === 'fresh') {
    return runFreshPrompts(args);
  }

  return runCreatePrompts(args);
}

async function runCreatePrompts(args: {
  projectName?: string;
  template?: TemplateName;
  packageManager?: PackageManager;
  skipInstall: boolean;
}): Promise<CreateOptions | null> {
  let projectName = args.projectName;
  if (!projectName) {
    const result = await p.text({
      message: 'Project name:',
      placeholder: 'my-opti-app',
      validate: (value) => {
        if (!value.trim()) return 'Project name is required';
        if (!isValidProjectName(value)) return 'Only letters, numbers, hyphens and underscores';
      },
    });
    if (p.isCancel(result)) return null;
    projectName = result;
  }

  let template = args.template;
  if (!template) {
    const result = await p.select({
      message: 'Select a template:',
      options: TEMPLATES.map(t => ({ value: t.name, label: t.label, hint: t.hint })),
    });
    if (p.isCancel(result)) return null;
    template = result as TemplateName;
  }

  let packageManager = args.packageManager;
  if (!packageManager) {
    const result = await p.select({
      message: 'Package manager:',
      options: [
        { value: 'npm', label: 'npm' },
        { value: 'pnpm', label: 'pnpm' },
        { value: 'yarn', label: 'yarn' },
      ],
    });
    if (p.isCancel(result)) return null;
    packageManager = result as PackageManager;
  }

  return {
    mode: 'create',
    projectName,
    template,
    packageManager,
    skipInstall: args.skipInstall,
  };
}

async function runScaffoldPrompts(cwd: string, args: {
  packageManager?: PackageManager;
  skipInstall: boolean;
}): Promise<ScaffoldOptions | null> {
  const framework = detectFramework(cwd);

  if (!framework) {
    p.log.error('Could not detect a supported framework (Next.js or TanStack Start).');
    return null;
  }

  p.log.info(`Detected: ${getFrameworkLabel(framework)} project`);

  const addSdk = await p.confirm({
    message: 'Add Optimizely CMS SDK?',
    initialValue: true,
  });
  if (p.isCancel(addSdk)) return null;

  const addCli = await p.confirm({
    message: 'Add Optimizely CMS CLI (for content type syncing)?',
    initialValue: true,
  });
  if (p.isCancel(addCli)) return null;

  const packageManager = args.packageManager ?? detectPackageManager(cwd);

  return {
    mode: 'scaffold',
    framework: framework as Framework,
    addSdk: addSdk as boolean,
    addCli: addCli as boolean,
    packageManager,
    skipInstall: args.skipInstall,
  };
}

async function runFreshPrompts(args: {
  projectName?: string;
  packageManager?: PackageManager;
  skipInstall: boolean;
}): Promise<FreshCreateOptions | null> {
  let projectName = args.projectName;
  if (!projectName) {
    const result = await p.text({
      message: 'Project name:',
      placeholder: 'my-opti-app',
      validate: (value) => {
        if (!value.trim()) return 'Project name is required';
        if (!isValidProjectName(value)) return 'Only letters, numbers, hyphens and underscores';
      },
    });
    if (p.isCancel(result)) return null;
    projectName = result;
  }

  const frameworkResult = await p.select({
    message: 'Select a framework:',
    options: FRAMEWORKS.map(f => ({ value: f.key, label: f.label })),
  });
  if (p.isCancel(frameworkResult)) return null;

  let packageManager = args.packageManager;
  if (!packageManager) {
    const result = await p.select({
      message: 'Package manager:',
      options: [
        { value: 'npm', label: 'npm' },
        { value: 'pnpm', label: 'pnpm' },
        { value: 'yarn', label: 'yarn' },
      ],
    });
    if (p.isCancel(result)) return null;
    packageManager = result as PackageManager;
  }

  return {
    mode: 'fresh',
    projectName,
    framework: frameworkResult as Framework,
    packageManager,
    skipInstall: args.skipInstall,
  };
}
