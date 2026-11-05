import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../scripts");

test("publishes a new snapshot and retries without overwriting an advanced main", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pin-publish-"));
  const remote = path.join(root, "remote.git");
  const work = path.join(root, "work");
  const rival = path.join(root, "rival");
  const bin = path.join(root, "bin");
  const log = path.join(root, "gh.log");
  const output = path.join(root, "output");
  const git = (...args) => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  try {
    fs.mkdirSync(bin);
    fs.writeFileSync(path.join(bin, "gh"), "#!/usr/bin/env node\nrequire('node:fs').appendFileSync(process.env.FAKE_GH_LOG, JSON.stringify(process.argv.slice(2)) + '\\n');\n", { mode: 0o755 });
    git("init", "--bare", remote);
    git("init", "--initial-branch=main", work);
    git("-C", work, "config", "user.name", "Test");
    git("-C", work, "config", "user.email", "test@example.invalid");
    fs.mkdirSync(path.join(work, "scripts"));
    for (const file of ["sync-guard.sh", "publish-snapshot.sh"]) fs.copyFileSync(path.join(source, file), path.join(work, "scripts", file));
    fs.writeFileSync(path.join(work, "README.md"), "fixture\n");
    git("-C", work, "add", ".");
    git("-C", work, "commit", "-m", "fixture", "-m", "Co-Authored-By: Claude Code <noreply@anthropic.com>");
    git("-C", work, "remote", "add", "origin", remote);
    git("-C", work, "push", "origin", "main");
    git("-C", remote, "symbolic-ref", "HEAD", "refs/heads/main");
    const run = (eventSha) => spawnSync("bash", ["scripts/publish-snapshot.sh"], { cwd: work, encoding: "utf8", env: {
      ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}`, GITHUB_SHA: eventSha,
      GITHUB_REPOSITORY: "idy/.github", GITHUB_OUTPUT: output, FAKE_GH_LOG: log,
    } });

    const initial = git("-C", work, "rev-parse", "HEAD");
    fs.writeFileSync(path.join(work, "pinned-projects.json"), "first snapshot\n");
    assert.equal(run(initial).status, 0);
    assert.equal(git("-C", remote, "show", "main:pinned-projects.json"), "first snapshot");
    const published = git("-C", work, "rev-parse", "HEAD");
    assert.equal(run(published).status, 0);
    assert.equal(git("-C", work, "rev-parse", "HEAD"), published);
    assert.equal(fs.existsSync(log), false);

    git("clone", remote, rival);
    git("-C", rival, "config", "user.name", "Test");
    git("-C", rival, "config", "user.email", "test@example.invalid");
    fs.writeFileSync(path.join(rival, "README.md"), "newer main\n");
    git("-C", rival, "add", "README.md");
    git("-C", rival, "commit", "-m", "advance", "-m", "Co-Authored-By: Claude Code <noreply@anthropic.com>");
    git("-C", rival, "push", "origin", "main");
    fs.writeFileSync(path.join(work, "pinned-projects.json"), "new snapshot\n");
    assert.equal(run(published).status, 0);
    assert.equal(git("-C", remote, "show", "main:pinned-projects.json"), "first snapshot");
    assert.deepEqual(JSON.parse(fs.readFileSync(log, "utf8").trim()), ["workflow", "run", "sync-pins.yml", "--repo", "idy/.github", "--ref", "main"]);

    git("-C", work, "remote", "set-url", "origin", path.join(root, "missing.git"));
    fs.writeFileSync(path.join(work, "pinned-projects.json"), "another snapshot\n");
    assert.notEqual(run(published).status, 0);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
