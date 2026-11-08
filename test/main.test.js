// SPDX-License-Identifier: Apache-2.0

import * as assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import { suite, test } from "node:test";

import { grammer2arbitrary } from "../src/main.js";

suite("grammer2arbitrary", async () => {
  const raw = await fs.readFile("./testdata/example.ohm");
  const exportName = "Example";

  test("valid", async () => {
    const baseRules = ["Expression"];
    const exportName = "Example";

    const script = grammer2arbitrary({ baseRules, exportName, raw });
    assert.match(script, /export function Example\(/);
    assert.match(script, /tie\("Expression"\)\s*\)/);
  });

  test("invalid", async () => {
    const baseRules = ["not actually rule"];

    assert.throws(() => {
      grammer2arbitrary({ baseRules, exportName, raw });
    }, /^Error: Not all bases are in the grammar.\n/);
  });
});
