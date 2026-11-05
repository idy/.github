#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GITHUB_USER, serializePinnedProjects } from "./pinned-projects.mjs";

const query = `query($login: String!) {
  user(login: $login) {
    login
    pinnedItems(first: 6, types: [REPOSITORY]) {
      totalCount
      nodes { __typename ... on Repository { nameWithOwner url isPrivate } }
    }
  }
}`;

try {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--check") || args.length > 1) {
    throw new Error("Usage: node scripts/sync-pins.mjs [--check]");
  }
  const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "pinned-projects.json");
  let response;
  try {
    response = execFileSync("gh", ["api", "graphql", "-f", `query=${query}`, "-f", `login=${GITHUB_USER}`], {
      encoding: "utf8", timeout: 30_000, stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    throw new Error("Could not read pinned repositories from GitHub; the snapshot was left unchanged");
  }
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const content = serializePinnedProjects(JSON.parse(response), {
    previous: current, heartbeatMs: args.includes("--check") ? Infinity : undefined,
  });
  if (current === content) {
    process.stdout.write("Pinned repositories already match GitHub.\n");
  } else if (args.includes("--check")) {
    throw new Error("Pinned repositories differ from GitHub; run node scripts/sync-pins.mjs");
  } else {
    const temporary = `${file}.${process.pid}.tmp`;
    try {
      fs.writeFileSync(temporary, content, { flag: "wx", mode: 0o644 });
      fs.renameSync(temporary, file);
    } finally {
      if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    }
    process.stdout.write("Updated the public pinned-repository snapshot.\n");
  }
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
