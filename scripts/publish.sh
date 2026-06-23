#!/bin/bash
set -e

echo "📦 Publishing to NPM..."

# Point @optimizely scope to Public NPM
echo "@optimizely:registry=https://registry.npmjs.org/" > .npmrc
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" >> .npmrc

# Changesets automatically uses correct tag:
# - Pre-release mode: publishes with "beta" tag
# - Stable mode: publishes with "latest" tag
pnpm changeset publish

# After stable release, deprecate all beta versions for this release
if [ ! -f .changeset/pre.json ]; then
  echo "🗑️  Deprecating beta versions..."

  for pkg in packages/*/package.json; do
    PKG_NAME=$(node -p "require('./$pkg').name")
    PKG_VERSION=$(node -p "require('./$pkg').version")

    # Deprecate all beta versions matching this major.minor version
    # e.g., if publishing 2.1.0, deprecates 2.1.0-beta.0, 2.1.0-beta.1, etc.
    MAJOR_MINOR=$(echo $PKG_VERSION | cut -d. -f1,2)

    echo "Deprecating ${PKG_NAME}@${MAJOR_MINOR}.*-beta*"
    npm deprecate "${PKG_NAME}@${MAJOR_MINOR}.*-beta*" "Beta versions deprecated. Use stable ${PKG_VERSION}" 2>/dev/null || echo "  No beta versions found or already deprecated"
  done
fi
