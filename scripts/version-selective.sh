#!/bin/bash
set -e

# Version only the changesets that touch $TARGET, holding the rest as pending.
# Usage: version-selective.sh [package-name|all]
#   all / empty -> normal `changeset version` (bumps every pending package)
#   a package   -> only changesets naming that package are consumed; others
#                  are moved aside and restored so they stay pending on main.
TARGET="$1"

# Prepend each changeset's release note with a link to its Jira ticket, so
# every changelog entry traces back to the ticket that introduced it. The
# ticket ID is pulled from the branch name recorded in the merge commit that
# added the changeset file (e.g. "Merge pull request #1 from org/CMS-123-foo").
link_jira_tickets() {
  local regex url
  regex=$(sed -n 's/.*regex = "\(.*\)".*/\1/p' .issuetracker | sed 's/\\\\/\\/g; s/\\d/[0-9]/g')
  url=$(sed -n 's/.*url = "\(.*\)".*/\1/p' .issuetracker)

  for f in .changeset/*.md; do
    [ "$(basename "$f")" = "README.md" ] && continue
    local commit ticket id link
    commit=$(git log --diff-filter=A --max-count=1 --pretty=format:%H -- "$f")
    [ -z "$commit" ] && continue
    ticket=$(git log -1 --format=%B "$commit" | grep -oE "$regex" | head -1)
    [ -z "$ticket" ] && continue
    id=${ticket#CMS-}
    link="[$ticket](${url/\$1/$id})"
    awk -v link="$link" '
      $0 == "---" { fm++; print; next }
      fm >= 2 && !inserted && NF > 0 { print link ": " $0; inserted=1; next }
      { print }
    ' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
  done
}

if [ -z "$TARGET" ] || [ "$TARGET" = "all" ]; then
  link_jira_tickets
  pnpm changeset version
  exit 0
fi

HOLD=$(mktemp -d)
shopt -s nullglob
for f in .changeset/*.md; do
  [ "$(basename "$f")" = "README.md" ] && continue
  # changeset frontmatter lists packages as: '@scope/name': bump
  grep -q "'$TARGET'" "$f" || mv "$f" "$HOLD/"
done

link_jira_tickets
pnpm changeset version

# restore held changesets so they remain pending (unchanged in the PR diff)
mv "$HOLD"/*.md .changeset/ 2>/dev/null || true
rmdir "$HOLD"
