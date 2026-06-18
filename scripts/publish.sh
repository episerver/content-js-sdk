#!/bin/bash
set -e

# Check if Changesets is currently in pre-release (beta) mode
if [ -f .changeset/pre.json ]; then
  echo "🧪 Pre-release mode detected. Routing to GitHub Packages..."
  
  # Point @optimizely scope to GitHub Packages under episerver org and authenticate
  echo "@optimizely:registry=https://npm.pkg.github.com/episerver" > .npmrc
  echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> .npmrc
  
  # Publish using Changesets
  pnpm changeset publish
else
  echo "🚀 Stable release mode detected. Routing to Public NPM..."
  
  # Point @optimizely scope to Public NPM and authenticate
  echo "@optimizely:registry=https://registry.npmjs.org/" > .npmrc
  echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" >> .npmrc
  
  pnpm changeset publish
fi