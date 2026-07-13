// SPDX-License-Identifier: Apache-2.0

import * as assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { rmSync as rm } from "node:fs";
import { test } from "node:test";

import * as fc from "fast-check";

test("testdata/example.ohm", async () => {
  rm("testdata/example.js", { force: true });
  spawnSync("./bin.js", [
    "--base",
    "Expression",
    "--export",
    "example",
    "--inFile",
    "testdata/example.ohm",
    "--outFile",
    "testdata/example.js",
  ]);

  const { example } = await import("./testdata/example.js");
  fc.assert(
    fc.property(example(), (expression) => {
      assert.equal(typeof eval(expression), "number");
    }),
  );
});
