import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const script = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../scripts/sync-guard.sh");

test("refresh guard retries advanced main and fails closed on GitHub or remote errors", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pin-guard-"));
  const remote = path.join(root, "remote.git");
  const work = path.join(root, "work");
  const bin = path.join(root, "bin");
  const log = path.join(root, "gh.log");
  const output = path.join(root, "output");
  const git = (...args) => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  try {
    fs.mkdirSync(bin);
    fs.writeFileSync(path.join(bin, "gh"), "#!/usr/bin/env node\nrequire('node:fs').appendFileSync(process.env.FAKE_GH_LOG, JSON.stringify(process.argv.slice(2)) + '\\n'); if (process.env.FAKE_GH_FAILURE) process.exit(1);\n", { mode: 0o755 });
    git("init", "--bare", remote);
    git("init", "--initial-branch=main", work);
    git("-C", work, "config", "user.name", "Test");
    git("-C", work, "config", "user.email", "test@example.invalid");
    fs.writeFileSync(path.join(work, "README.md"), "fixture\n");
    git("-C", work, "add", "README.md");
    git("-C", work, "commit", "-m", "fixture", "-m", "Co-Authored-By: Claude Code <noreply@anthropic.com>");
    git("-C", work, "remote", "add", "origin", remote);
    git("-C", work, "push", "origin", "main");
    const original = git("-C", work, "rev-parse", "HEAD");
    const run = (mode, extra = {}) => {
      fs.writeFileSync(output, "");
      return spawnSync("bash", [script, mode], { cwd: work, encoding: "utf8", env: {
        ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}`, GITHUB_SHA: original,
        GITHUB_REPOSITORY: "idy/idy", GITHUB_OUTPUT: output, FAKE_GH_LOG: log, ...extra,
      } });
    };
    assert.equal(run("check").status, 0);
    assert.equal(fs.readFileSync(output, "utf8"), "current=true\n");
    assert.equal(fs.existsSync(log), false);
    assert.notEqual(run("after-failed-push").status, 0);

    git("-C", work, "commit", "--allow-empty", "-m", "advance", "-m", "Co-Authored-By: Claude Code <noreply@anthropic.com>");
    git("-C", work, "push", "origin", "main");
    assert.equal(run("check").status, 0);
    assert.equal(fs.readFileSync(output, "utf8"), "current=false\n");
    assert.deepEqual(JSON.parse(fs.readFileSync(log, "utf8").trim()), ["workflow", "run", "sync-pins.yml", "--repo", "idy/idy", "--ref", "main"]);
    assert.equal(run("after-failed-push").status, 0);
    assert.notEqual(run("check", { FAKE_GH_FAILURE: "1" }).status, 0);
    assert.equal(fs.readFileSync(output, "utf8"), "");

    git("-C", work, "remote", "set-url", "origin", path.join(root, "missing.git"));
    assert.notEqual(run("check").status, 0);
    assert.equal(fs.readFileSync(output, "utf8"), "");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
