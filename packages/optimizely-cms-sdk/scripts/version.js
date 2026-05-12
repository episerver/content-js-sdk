import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const createVersionFileContent = (version) =>
  `// This file is auto-generated during build by scripts/prebuild.js
// Do not edit manually.
//
// The version is generated from package.json instead of importing directly
// because the import attribute syntax (\`with { type: 'json' }\`) required for
// JSON imports is not supported in CommonJS module builds.

export const SDK_VERSION = '${version}';
`;

export const generateVersion = () => {
  const version = process.env.npm_package_version;

  if (!version) {
    throw new Error('npm_package_version not found. Run this script via npm/pnpm.');
  }

  const content = createVersionFileContent(version);
  const outputPath = join(__dirname, '..', 'src', 'version.ts');

  writeFileSync(outputPath, content, 'utf-8');
  console.log(`✓ Generated version.ts (${version})`);
};
