import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const createVersionFileContent = version =>
  `// This file is auto-generated during build by scripts/prebuild.js
// Do not edit manually.
//
// The version is read from process.env.npm_package_version at build time
// rather than importing package.json directly because JSON import attributes
// are not supported in CommonJS builds.

export const SDK_VERSION = '${version}';
`;

export const generateVersion = () => {
  const version = process.env.npm_package_version;

  if (!version) {
    throw new Error('npm_package_version not found. Run this script via npm/pnpm.');
  }

  const content = createVersionFileContent(version);
  const outputDir = join(__dirname, '..', 'src', 'generated');
  const outputPath = join(outputDir, 'version.ts');

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, content, 'utf-8');
  console.log(`✓ Generated version.ts (${version})`);
};
