#!/usr/bin/env bash
set -euo pipefail

mode="${1:-}"
if [[ "$mode" != "check" && "$mode" != "after-failed-push" ]]; then
  printf 'Usage: sync-guard.sh check|after-failed-push\n' >&2
  exit 1
fi

tip="$(git ls-remote --exit-code origin refs/heads/main | cut -f1)"
if ! [[ "$tip" =~ ^[0-9a-f]{40}$ ]]; then
  printf 'Could not determine the current main commit.\n' >&2
  exit 1
fi
if [ "$tip" = "$GITHUB_SHA" ]; then
  if [ "$mode" = "after-failed-push" ]; then
    printf 'Snapshot push failed without a newer main commit.\n' >&2
    exit 1
  fi
  printf 'current=true\n' >> "$GITHUB_OUTPUT"
else
  gh workflow run sync-pins.yml --repo "$GITHUB_REPOSITORY" --ref main
  if [ "$mode" = "check" ]; then printf 'current=false\n' >> "$GITHUB_OUTPUT"; fi
  printf 'Main advanced; requested a fresh run for its current commit.\n'
fi
