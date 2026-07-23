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

# Create or update Jira release (non-blocking - npm publish always succeeds)
set +e  # Disable exit on error for Jira section
if [ "$SKIP_JIRA" = "true" ]; then
  echo "⏭️  Skipping Jira (skip_jira=true)"
elif [ -n "$JIRA_BOT_PASSWORD" ]; then
  # Check if this is a pre-release
  IS_PRERELEASE=false
  if [ -f .changeset/pre.json ]; then
    IS_PRERELEASE=true
    echo "📋 Creating Jira releases (unreleased)..."
  else
    echo "📋 Updating Jira releases (released)..."
  fi

  for pkg in packages/*/package.json; do
    PKG_NAME=$(node -p "require('./$pkg').name")
    PKG_VERSION=$(node -p "require('./$pkg').version")

    # Strip beta suffix for Jira release name (2.2.0-beta.0 → 2.2.0)
    JIRA_VERSION=$(echo "$PKG_VERSION" | sed 's/-beta\.[0-9]*$//')

    # Find previous tag for this package
    PREV_TAG=$(git tag --sort=-creatordate | grep "^${PKG_NAME}@" | head -1)

    if [ -z "$PREV_TAG" ]; then
      echo "No previous tag for $PKG_NAME, skipping Jira release"
      continue
    fi

    # Extract Jira IDs from merge commits since previous tag
    JIRA_IDS=$(git log --merges --oneline "$PREV_TAG"..HEAD --format="%s" \
      | grep -oE 'CMS-[0-9]+' | sort -u)

    if [ -z "$JIRA_IDS" ]; then
      echo "No Jira tickets found for $PKG_NAME@$JIRA_VERSION"
      continue
    fi

    echo "Found tickets for $PKG_NAME@$JIRA_VERSION: $(echo $JIRA_IDS | tr '\n' ' ')"

    # Check if release already exists in Jira
    SEARCH_RESPONSE=$(curl -s "$JIRA_URL/rest/api/3/project/CMS/versions" \
      -H "Content-Type: application/json" \
      -u "$JIRA_BOT_USERNAME:$JIRA_BOT_PASSWORD")

    EXISTING_VERSION_ID=$(echo "$SEARCH_RESPONSE" | node -p "
      const versions = JSON.parse(require('fs').readFileSync(0));
      const existing = versions.find(v => v.name === '${PKG_NAME}@${JIRA_VERSION}');
      existing ? existing.id : ''
    ")

    if [ -n "$EXISTING_VERSION_ID" ]; then
      # Update existing release
      if [ "$IS_PRERELEASE" = false ]; then
        echo "Updating existing Jira release to released=true..."
        RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$JIRA_URL/rest/api/3/version/$EXISTING_VERSION_ID" \
          -H "Content-Type: application/json" \
          -u "$JIRA_BOT_USERNAME:$JIRA_BOT_PASSWORD" \
          -d "{
            \"released\": true,
            \"releaseDate\": \"$(date +%Y-%m-%d)\"
          }")

        HTTP_CODE=$(echo "$RESPONSE" | tail -1)
        if [ "$HTTP_CODE" = "200" ]; then
          echo "Updated Jira release version ID: $EXISTING_VERSION_ID"
        else
          echo "::warning::Failed to update Jira release (HTTP $HTTP_CODE)"
        fi
      else
        echo "Jira release already exists (ID: $EXISTING_VERSION_ID), skipping"
      fi
      continue
    fi

    # Create new release version in Jira
    if [ "$IS_PRERELEASE" = true ]; then
      RELEASE_PAYLOAD="{
        \"name\": \"${PKG_NAME}@${JIRA_VERSION}\",
        \"project\": \"CMS\",
        \"released\": false
      }"
    else
      RELEASE_PAYLOAD="{
        \"name\": \"${PKG_NAME}@${JIRA_VERSION}\",
        \"project\": \"CMS\",
        \"released\": true,
        \"releaseDate\": \"$(date +%Y-%m-%d)\"
      }"
    fi

    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$JIRA_URL/rest/api/3/version" \
      -H "Content-Type: application/json" \
      -u "$JIRA_BOT_USERNAME:$JIRA_BOT_PASSWORD" \
      -d "$RELEASE_PAYLOAD")

    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" != "201" ]; then
      echo "::warning::Failed to create Jira release (HTTP $HTTP_CODE): $BODY"
      continue
    fi

    VERSION_ID=$(echo "$BODY" | node -p "JSON.parse(require('fs').readFileSync(0)).id")
    echo "Created Jira release version ID: $VERSION_ID"

    # Link each Jira issue to this release
    for ISSUE in $JIRA_IDS; do
      LINK_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$JIRA_URL/rest/api/3/issue/$ISSUE" \
        -H "Content-Type: application/json" \
        -u "$JIRA_BOT_USERNAME:$JIRA_BOT_PASSWORD" \
        -d "{
          \"update\": {
            \"fixVersions\": [{\"add\": {\"id\": \"$VERSION_ID\"}}]
          }
        }")

      LINK_HTTP_CODE=$(echo "$LINK_RESPONSE" | tail -1)

      if [ "$LINK_HTTP_CODE" = "204" ]; then
        echo "  ✓ Linked $ISSUE"
      else
        echo "  ✗ Failed to link $ISSUE (HTTP $LINK_HTTP_CODE)"
      fi
    done
  done
fi
set -e  # Re-enable exit on error
