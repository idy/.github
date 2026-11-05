#!/usr/bin/env bash
set -euo pipefail

git add -- pinned-projects.json
if git diff --cached --quiet -- pinned-projects.json; then exit 0; fi
git config user.name 'github-actions[bot]'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
git commit -m 'chore: refresh pinned repositories'
if ! git push origin HEAD:main; then
  bash scripts/sync-guard.sh after-failed-push
fi
