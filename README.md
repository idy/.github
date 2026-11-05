# idy GitHub configuration

This repository publishes the public repositories pinned on [idy's GitHub profile](https://github.com/idy) for display on [idy.dev](https://idy.dev/).

## Updating pinned projects

GitHub's profile pins are the source of truth. Use **Customize your pins** on the GitHub profile to choose and order up to six public repositories or gists. `pinned-projects.json` contains only public repository pins; gists and private repositories are not included.

The GitHub Actions workflow checks for changes hourly and publishes a changed snapshot immediately. When pins are unchanged, it refreshes the snapshot timestamp at least daily. A manual run of **Sync pinned repositories** on `main` refreshes it sooner. GitHub's schedule and raw-content cache can delay updates; scheduled workflows in inactive public repositories can also be disabled after 60 days.

The site reads the public snapshot without a token. If it cannot load or validate the snapshot, or if the snapshot is over 48 hours old, the site links to the GitHub profile instead of presenting it as current. The site allows up to five minutes of future clock skew. No GitHub API token is exposed in the site.

GitHub does not document an API for editing a user's profile pins, so this workflow reads pins but does not change them. For a personal profile README, GitHub requires a public repository named `idy/idy` with a root `README.md`; a user-owned `.github` repository does not display an organization-style profile README.

## Local development

Install Node.js and the authenticated [GitHub CLI](https://cli.github.com/), then run:

```sh
node --test tests/*.test.mjs
node scripts/sync-pins.mjs --check
node scripts/sync-pins.mjs
```

The script queries GitHub GraphQL and validates the result before replacing `pinned-projects.json`. It fails without changing the snapshot if the response is incomplete, private, malformed, or unavailable. The refresh workflow uses its repository-scoped `GITHUB_TOKEN` only for tested commits on `main`; pull-request checks run separately with read-only permissions. If `main` advances while a run is queued, the refresh job requests a new run using `actions: write`. A non-fast-forward push fails rather than overwriting a newer commit.

Limit repository branch-write access to trusted collaborators: a contributor who can alter workflow files on a same-repository branch may be able to request wider workflow permissions. Fork pull requests receive a read-only token.
