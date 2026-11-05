export const GITHUB_USER = "idy";

// Only public repositories are published. Gists and private pins are not part
// of the website's project list and cannot be exposed by this snapshot.
export function normalizePinnedProjects(response) {
  if (response?.errors?.length) throw new Error("GitHub returned GraphQL errors");
  const user = response?.data?.user;
  if (typeof user?.login !== "string" || user.login.toLowerCase() !== GITHUB_USER) {
    throw new Error("GitHub did not return the expected user");
  }
  const items = user.pinnedItems;
  if (!Array.isArray(items?.nodes) || !Number.isInteger(items.totalCount)
    || items.totalCount < 0 || items.totalCount > 6 || items.totalCount !== items.nodes.length) {
    throw new Error("GitHub returned an incomplete pinned-repository list");
  }

  const seen = new Set();
  const repositories = items.nodes.map((item) => {
    const name = item?.nameWithOwner;
    if (item?.__typename !== "Repository" || item.isPrivate !== false
      || typeof name !== "string"
      || !/^[a-z0-9](?:[a-z0-9-]{0,38})\/[a-z0-9_.-]{1,100}$/i.test(name)) {
      throw new Error("GitHub returned an invalid or non-public repository");
    }
    let url;
    try { url = new URL(item.url); } catch { throw new Error("GitHub returned an invalid repository URL"); }
    if (url.origin !== "https://github.com" || url.username || url.password
      || url.search || url.hash || url.pathname.toLowerCase() !== `/${name}`.toLowerCase()) {
      throw new Error("GitHub returned an unexpected repository URL");
    }
    const key = name.toLowerCase();
    if (seen.has(key)) throw new Error("GitHub returned duplicate pinned repositories");
    seen.add(key);
    return { name, url: `https://github.com/${name}` };
  });
  return { schemaVersion: 1, login: GITHUB_USER, repositories };
}

export function serializePinnedProjects(response, { now = Date.now(), previous = "", heartbeatMs = 24 * 60 * 60 * 1000 } = {}) {
  const current = normalizePinnedProjects(response);
  if (!Number.isFinite(now)) throw new Error("Invalid snapshot time");
  let timestamp = new Date(now).toISOString();
  try {
    const old = JSON.parse(previous);
    const oldTime = Date.parse(old.updatedAt);
    if (old.schemaVersion === current.schemaVersion && old.login === current.login
      && JSON.stringify(old.repositories) === JSON.stringify(current.repositories)
      && Number.isFinite(oldTime) && new Date(oldTime).toISOString() === old.updatedAt
      && oldTime <= now && now - oldTime < heartbeatMs) {
      timestamp = old.updatedAt;
    }
  } catch { /* A missing or malformed previous snapshot is replaced. */ }
  return `${JSON.stringify({ ...current, updatedAt: timestamp }, null, 2)}\n`;
}
