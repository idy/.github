import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { normalizePinnedProjects, serializePinnedProjects } from "../scripts/pinned-projects.mjs";

const repository = (name) => ({
  __typename: "Repository", nameWithOwner: name,
  url: `https://github.com/${name}`, isPrivate: false,
});
const response = (nodes) => ({ data: { user: { login: "idy", pinnedItems: { totalCount: nodes.length, nodes } } } });

test("preserves GitHub pin order and serializes only public project identities", () => {
  const input = response([repository("embed-zig/embed-zig"), repository("GizClaw/gizclaw")]);
  input.data.user.pinnedItems.nodes[0].description = "untrusted <script>";
  const result = normalizePinnedProjects(input);
  assert.deepEqual(result, { schemaVersion: 1, login: "idy", repositories: [
    { name: "embed-zig/embed-zig", url: "https://github.com/embed-zig/embed-zig" },
    { name: "GizClaw/gizclaw", url: "https://github.com/GizClaw/gizclaw" },
  ] });
  const snapshot = serializePinnedProjects(input, { now: Date.UTC(2026, 10, 6) });
  assert.deepEqual(JSON.parse(snapshot), { ...result, updatedAt: "2026-11-06T00:00:00.000Z" });
  assert.ok(snapshot.endsWith("\n"));
});

test("refreshes the heartbeat daily or immediately when the pins change", () => {
  const start = Date.UTC(2026, 10, 6);
  const first = response([repository("idy/one"), repository("idy/two")]);
  const changed = response([repository("idy/two"), repository("idy/one")]);
  const original = serializePinnedProjects(first, { now: start });
  assert.equal(serializePinnedProjects(first, { now: start + 60_000, previous: original }), original);
  const updated = serializePinnedProjects(first, { now: start + 24 * 60 * 60 * 1000, previous: original });
  assert.notEqual(JSON.parse(updated).updatedAt, JSON.parse(original).updatedAt);
  const reordered = JSON.parse(serializePinnedProjects(changed, { now: start + 1000, previous: original }));
  assert.deepEqual(reordered.repositories.map((item) => item.name), ["idy/two", "idy/one"]);
  assert.equal(reordered.updatedAt, new Date(start + 1000).toISOString());
  assert.notEqual(serializePinnedProjects(first, { now: start - 1000, previous: original }), original);
});

test("allows an intentionally empty list", () => {
  assert.deepEqual(normalizePinnedProjects(response([])).repositories, []);
});

test("rejects incomplete or failed GraphQL responses", () => {
  for (const input of [
    {}, { errors: [{ message: "failed" }], ...response([]) },
    { data: { user: null } }, { data: { user: { login: "someone-else", pinnedItems: { totalCount: 0, nodes: [] } } } },
    { data: { user: { login: "idy", pinnedItems: { totalCount: 2, nodes: [repository("idy/one")] } } } },
    response(Array.from({ length: 7 }, (_, i) => repository(`idy/repo-${i}`))),
  ]) assert.throws(() => normalizePinnedProjects(input));
});

test("rejects private, malformed, non-GitHub and mismatched repository links", () => {
  for (const item of [
    { ...repository("idy/private"), isPrivate: true },
    { ...repository("idy/missing-visibility"), isPrivate: undefined },
    { ...repository("idy/repo"), __typename: "Gist" },
    repository("../elsewhere"), repository("idy/repo/extra"),
    { ...repository("idy/repo"), url: "javascript:alert(1)" },
    { ...repository("idy/repo"), url: "https://github.com.evil.example/idy/repo" },
    { ...repository("idy/repo"), url: "https://github.com/other/repo" },
    { ...repository("idy/repo"), url: "https://github.com/idy/repo?next=evil" },
    { ...repository("idy/repo"), url: "https://name:secret@github.com/idy/repo" },
  ]) assert.throws(() => normalizePinnedProjects(response([item])));
});

test("rejects duplicate repositories regardless of case", () => {
  assert.throws(() => normalizePinnedProjects(response([repository("idy/Repo"), repository("idy/repo")])), /duplicate/);
});

test("the sync command preserves the last snapshot when GitHub or validation fails", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pinned-projects-"));
  const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../scripts");
  const scripts = path.join(root, "scripts");
  const bin = path.join(root, "bin");
  const snapshot = path.join(root, "pinned-projects.json");
  try {
    fs.mkdirSync(scripts);
    fs.mkdirSync(bin);
    for (const name of ["sync-pins.mjs", "pinned-projects.mjs"]) fs.copyFileSync(path.join(source, name), path.join(scripts, name));
    fs.writeFileSync(path.join(bin, "gh"), "#!/usr/bin/env node\nif (process.env.FAKE_GH_FAILURE) process.exit(1); process.stdout.write(process.env.FAKE_GH_RESPONSE || '');\n", { mode: 0o755 });
    fs.writeFileSync(snapshot, "previous snapshot\n");
    const run = (payload, args = [], failure = false) => spawnSync(process.execPath, [path.join(scripts, "sync-pins.mjs"), ...args], {
      encoding: "utf8", env: { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}`,
        FAKE_GH_FAILURE: failure ? "1" : "", FAKE_GH_RESPONSE: JSON.stringify(payload) },
    });
    assert.notEqual(run({}, [], true).status, 0);
    assert.notEqual(run({ data: { user: null } }).status, 0);
    assert.equal(fs.readFileSync(snapshot, "utf8"), "previous snapshot\n");
    const valid = response([repository("idy/project")]);
    assert.equal(run(valid).status, 0);
    const written = fs.readFileSync(snapshot, "utf8");
    assert.equal(written, serializePinnedProjects(valid, { previous: written }));
    assert.equal(run(valid, ["--check"]).status, 0);
    assert.notEqual(run(response([]), ["--check"]).status, 0);
    assert.equal(fs.readFileSync(snapshot, "utf8"), written);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
