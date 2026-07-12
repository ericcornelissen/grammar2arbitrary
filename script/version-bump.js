// SPDX-License-Identifier: Apache-2.0

import { execSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { argv, exit } from "node:process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { inc } from "semver";

if (argv[0].endsWith("/node")) argv.shift();

const type = argv[1];
if (!["patch", "minor", "major"].includes(type)) {
  console.log("usage: `npm run version-bump <patch|minor|major>`");
  exit(1);
}

const currentBranch = execSync("git branch --show-current").toString().trim();
if (currentBranch !== "main") {
  console.log("must be run from the default branch, 'main'");
  exit(1);
}

const status = execSync("git status --porcelain").toString().trim();
if (status !== "") {
  console.log("work space is dirty, commit or stash changes first");
  exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = resolve(root, "package.json");
const packageLockJson = resolve(root, "package-lock.json");
const manDotOne = resolve(root, "man.1");

const manifest = JSON.parse(await readFile(packageJson));
manifest.version = inc(manifest.version, type);
await writeFile(packageJson, JSON.stringify(manifest, null, 2) + "\n");

const lockfile = JSON.parse(await readFile(packageLockJson));
lockfile.version = manifest.version;
lockfile.packages[""].version = manifest.version;
await writeFile(packageLockJson, JSON.stringify(lockfile, null, 2) + "\n");

const manfile = await readFile(manDotOne, { encoding: "utf-8" });
const lines = manfile.split("\n");
const date = Temporal.Now.plainDateISO().toLocaleString("en-US", {
  month: "long",
  year: "numeric",
});
lines[0] = `.TH "grammar2arbitrary" "1" "${date}" "v${manifest.version}" "User Commands"`;
await writeFile(manDotOne, lines.join("\n"));

execSync("git commit --all --message 'version bump'");
execSync(`git tag v${manifest.version}`);
execSync(`git push origin main v${manifest.version}`);
