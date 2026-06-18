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
