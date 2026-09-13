// SPDX-License-Identifier: Apache-2.0

import { execSync } from "node:child_process";
import * as console from "node:console";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { exit } from "node:process";
import { join } from "node:path";

const canaryDir = await mkdtemp(join(tmpdir(), "canary-"));
const subject = "https://gitlab.com/ericcornelissen/arbitrary-bash.git";

function execCanary(command) {
  execSync(command, { cwd: canaryDir, stdio: "inherit" });
}

function execHere(command) {
  execSync(command, { cwd: import.meta.dirname, stdio: "inherit" });
}

let didError;
try {
  execHere(`git clone ${subject} ${canaryDir}`);
  execCanary("npm clean-install");
  execCanary("npm run test");
  execHere("npm link");
  execCanary("npm link @ericcornelissen/grammar2arbitrary");
  execCanary("npm run test");
} catch {
  didError = true;
} finally {
  await rm(canaryDir, { recursive: true, force: true });
}

if (didError) {
  exit(1);
} else {
  console.log("Ok");
}
