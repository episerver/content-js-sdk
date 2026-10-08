/** Validation and packaging of a project for front-end hosting */

import { createWriteStream, existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { glob } from 'glob';
import yazl from 'yazl';
import { hostingErrors } from '../error.js';

type PackageJson = {
  name?: string;
  version?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

type PackageNameOverrides = { name?: string; version?: string };

const SUPPORTED_LOCK_FILES = ['package-lock.json', 'yarn.lock'];
const UNSUPPORTED_LOCK_FILES = ['pnpm-lock.yaml', 'bun.lock', 'bun.lockb'];
const SUPPORTED_FRAMEWORKS = ['next', 'astro'];
const REQUIRED_SCRIPTS = ['build', 'start'];
const LOCAL_VERSION_PREFIXES = ['workspace:', 'link:', 'file:'];
const PACKAGE_NAME_PATTERN = /^[A-Za-z0-9-]+$/;
// No leading dot, so `..` cannot reach the file or blob path
const PACKAGE_VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9.-]*$/;

const EXCLUDED_PATTERNS = [
  '**/node_modules/**',
  '.next/**',
  'dist/**',
  '.astro/**',
  '.git/**',
  '.vercel/**',
  '.turbo/**',
  'coverage/**',
  'out/**',
  'build/**',
  '.yarn/cache/**',
  // Local HTTPS keys from `next dev --experimental-https`
  'certificates/**',
  '**/*.log',
  '**/*.tsbuildinfo',
  '**/*.head.app.*.zip',
  // CMS content exports (Stride ships a 9 MB one); the site never reads them at runtime
  '**/*.episerverdata',
  // The platform needs exactly one lock file, and validation ensures a supported one exists
  ...UNSUPPORTED_LOCK_FILES,
];
const KEPT_ENV_FILES = ['.env.example', '.env.template'];

// A literal registry token; an `${NPM_TOKEN}` placeholder does not match
const NPMRC_TOKEN_PATTERN = /_auth(Token)?\s*=\s*(?!\$\{)\S/;

const isSecretEnvFile = (path: string) => {
  const fileName = basename(path);

  return /^\.env(\..+)?$/.test(fileName) && !KEPT_ENV_FILES.includes(fileName);
};

// .npmrc ships with the package because the platform may need it to install private packages
const findPackageWarnings = async (dir: string, files: string[]): Promise<string[]> =>
  (
    files.includes('.npmrc') &&
    NPMRC_TOKEN_PATTERN.test(await readFile(join(dir, '.npmrc'), 'utf8'))
  ) ?
    [
      '.npmrc contains a registry token and is uploaded with the package. Replace it with an ${NPM_TOKEN} placeholder and set NPM_TOKEN in the App Settings tab of the DXP management portal',
    ]
  : [];

const present = (dir: string, files: string[]) =>
  files.filter(file => existsSync(join(dir, file)));

const findLockFileProblems = (dir: string): string[] => {
  const supported = present(dir, SUPPORTED_LOCK_FILES);
  const unsupported = present(dir, UNSUPPORTED_LOCK_FILES);

  if (supported.length > 1)
    return [
      `Found ${supported.join(' and ')}. Front-end hosting needs exactly one lock file`,
    ];
  if (supported.length === 1) return [];

  const found = unsupported.length > 0 ? ` (found ${unsupported.join(', ')})` : '';

  return [
    `No package-lock.json or yarn.lock found${found}. Front-end hosting installs with npm or yarn; run \`npm install --package-lock-only\` to create one`,
  ];
};

const findPackageJsonProblems = (packageJson: PackageJson): string[] => {
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
  const missingScripts = REQUIRED_SCRIPTS.filter(
    script => !packageJson.scripts?.[script],
  ).map(script => `package.json has no "${script}" script`);
  const frameworkProblems =
    SUPPORTED_FRAMEWORKS.some(framework => framework in dependencies) ?
      []
    : ['Front-end hosting supports Next.js and Astro, but neither is a dependency'];
  const localDependencies = Object.entries(dependencies)
    .filter(([, version]) =>
      LOCAL_VERSION_PREFIXES.some(prefix => version.startsWith(prefix)),
    )
    .map(
      ([name, version]) =>
        `Dependency "${name}" uses "${version}", which cannot be installed outside this machine or monorepo`,
    );

  return [...missingScripts, ...frameworkProblems, ...localDependencies];
};

const timestamp = (date: Date) => date.toISOString().replace(/[-:T]/g, '').slice(0, 14);

/** Check that a project meets the front-end hosting requirements and return its package.json */
export async function validateProject(dir: string): Promise<PackageJson> {
  const packageJsonPath = join(dir, 'package.json');

  if (!existsSync(packageJsonPath))
    throw new hostingErrors.InvalidProject([`No package.json found in ${resolve(dir)}`]);

  const packageJson: PackageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  const problems = [
    ...findPackageJsonProblems(packageJson),
    ...findLockFileProblems(dir),
  ];

  if (problems.length > 0) throw new hostingErrors.InvalidProject(problems);

  return packageJson;
}

/** Build the `<name>.head.app.<version>.zip` file name; the default version is made unique with a UTC timestamp */
export function resolvePackageName(
  packageJson: PackageJson,
  overrides: PackageNameOverrides = {},
  now = new Date(),
): string {
  const name =
    overrides.name ??
    (packageJson.name ?? '').replace(/^@[^/]+\//, '').replace(/[^A-Za-z0-9-]/g, '');
  const version =
    overrides.version ?? `${packageJson.version ?? '0.0.0'}-${timestamp(now)}`;

  if (!PACKAGE_NAME_PATTERN.test(name)) throw new hostingErrors.InvalidPackageName(name);
  if (!PACKAGE_VERSION_PATTERN.test(version))
    throw new hostingErrors.InvalidPackageVersion(version);

  return `${name}.head.app.${version}.zip`;
}

/** Zip the project into `outputDir`, leaving out build output, dependencies and secret env files; warns about other secrets it uploads */
export async function createPackage(
  dir: string,
  packageName: string,
  outputDir: string,
): Promise<{ path: string; files: string[]; warnings: string[] }> {
  const path = join(outputDir, packageName);
  const files = (
    await glob('**/*', {
      cwd: dir,
      dot: true,
      nodir: true,
      posix: true,
      ignore: EXCLUDED_PATTERNS,
    })
  )
    .filter(file => !isSecretEnvFile(file))
    .sort();

  await mkdir(outputDir, { recursive: true });

  const zip = new yazl.ZipFile();

  // yazl reports file read errors on the ZipFile, which `pipeline` does not watch
  zip.on('error', error => (zip.outputStream as Readable).destroy(error));
  files.forEach(file => zip.addFile(join(dir, file), file));
  zip.end();

  await pipeline(zip.outputStream, createWriteStream(path));

  return { path, files, warnings: await findPackageWarnings(dir, files) };
}
