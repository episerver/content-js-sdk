import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPrompts } from './prompts.js';
import { createProject, createFreshProject } from './scaffold.js';
import { augmentProject } from './augment.js';
import { detectPackageManager } from './detect.js';
import { TEMPLATE_NAMES } from './registry.js';
import { isValidProjectName } from './utils.js';
import { CI_PROVIDERS, type ParsedArgs, type TemplateName, type PackageManager } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getVersion(): string {
  const pkgPath = path.resolve(__dirname, '..', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  return pkg.version;
}

const PACKAGE_MANAGERS = ['npm', 'pnpm', 'yarn'];

function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = {
    skipInstall: false,
    help: false,
    version: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--help':
      case '-h':
        args.help = true;
        break;
      case '--version':
      case '-v':
        args.version = true;
        break;
      case '--skip-install':
        args.skipInstall = true;
        break;
      case '--template': {
        const val = argv[++i];
        if (TEMPLATE_NAMES.includes(val)) args.template = val as TemplateName;
        break;
      }
      case '--pm': {
        const val = argv[++i];
        if (PACKAGE_MANAGERS.includes(val)) args.packageManager = val as PackageManager;
        break;
      }
      case '--ci': {
        const val = argv[++i];
        args.ci = CI_PROVIDERS.find(provider => provider === val) ?? args.ci;
        break;
      }
      default:
        if (!arg.startsWith('-') && !args.projectName) {
          if (!isValidProjectName(arg)) {
            console.error(`Invalid project name "${arg}". Only lowercase letters, numbers and hyphens are allowed.`);
            process.exit(1);
          }
          args.projectName = arg;
        }
    }
  }

  return args;
}

function printHelp(): void {
  console.log(`
  Usage: npx @optimizely/cms-create-app [project-name] [options]

  Options:
    --template <name>   Template to use (${TEMPLATE_NAMES.join(', ')})
    --pm <manager>      Package manager (npm, pnpm, yarn)
    --skip-install      Skip dependency installation
    --ci <provider>     Add a workflow that deploys to Optimizely front-end hosting (github, none)
    -h, --help          Show help
    -v, --version       Show version
  `);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  if (args.help) {
    printHelp();
    return;
  }

  if (args.version) {
    console.log(getVersion());
    return;
  }

  const options = await runPrompts({
    projectName: args.projectName,
    template: args.template,
    packageManager: args.packageManager,
    skipInstall: args.skipInstall,
    ci: args.ci,
  });

  if (!options) {
    console.log('Cancelled.');
    process.exit(0);
  }

  if (options.mode === 'create') {
    await createProject(options);
  } else if (options.mode === 'fresh') {
    const targetDir = await createFreshProject(options);
    if (!fs.existsSync(targetDir)) {
      console.error(`Project directory "${targetDir}" was not created. Please try again.`);
      process.exit(1);
    }
    process.chdir(targetDir);
    await augmentProject({
      mode: 'scaffold',
      framework: options.framework,
      addSdk: true,
      addCli: true,
      packageManager: detectPackageManager(targetDir),
      skipInstall: options.skipInstall,
    });
  } else {
    await augmentProject(options);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
