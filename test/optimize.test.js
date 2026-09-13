// SPDX-License-Identifier: Apache-2.0

import * as assert from "node:assert/strict";
import { suite, test } from "node:test";

import { Not } from "../src/constraints.js";
import {
  Apply,
  ConstantFrom,
  OneOf,
  Optional,
  Repeat,
  Sequence,
  Terminal,
} from "../src/terms.js";

import { optimize } from "../src/optimize.js";

suite("optimize", () => {
  const testdata = {
    "sequence of one": {
      term: new Sequence([new Terminal("foobar")]),
      want: new Terminal("foobar"),
    },
    "sequence of sequence of one": {
      term: new Sequence([new Sequence([new Terminal("foobar")])]),
      want: new Terminal("foobar"),
    },
    "sequence of terminals": {
      term: new Sequence([
        new Terminal("Goodbye"),
        new Terminal(" cruel "),
        new Terminal("world"),
      ]),
      want: new Terminal("Goodbye cruel world"),
    },
    "sequence of repetitions": {
      term: new Sequence([
        new Repeat(new Terminal("foobar"), { min: 0 }),
        new Repeat(new Terminal("foobar"), { min: 1 }),
      ]),
      want: new Repeat(new Terminal("foobar"), { min: 1 }),
    },
    "sequence of sequences": {
      term: new Sequence([
        new Sequence([new Apply("ruleFoo"), new Apply("ruleBar")]),
        new Sequence([new Terminal("Hello"), new Terminal("world")]),
      ]),
      want: new Sequence([
        new Apply("ruleFoo"),
        new Apply("ruleBar"),
        new Terminal("Helloworld"),
      ]),
    },
    "oneof terminals": {
      term: new OneOf([new Terminal("Hello"), new Terminal("world")]),
      want: new ConstantFrom(["Hello", "world"]),
    },
  };

  for (const [name, testcase] of Object.entries(testdata)) {
    test(name, () => {
      const { term, want } = testcase;

      const got = optimize(term);
      assert.ok(got.equals(want));
    });
  }
});
