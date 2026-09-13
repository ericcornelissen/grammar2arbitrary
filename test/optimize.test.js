// SPDX-License-Identifier: Apache-2.0

import * as assert from "node:assert/strict";
import { suite, test } from "node:test";

import { Not } from "../src/constraints.js";
import {
  Apply,
  OneOf,
  Optional,
  Repeat,
  Sequence,
  Terminal,
} from "../src/terms.js";

import { optimize } from "../src/optimize.js";

suite("optimize", () => {
  const testdata = {
    /* Apply */
    "Apply without constraint": {
      term: new Apply("Foobar"),
      want: new Apply("Foobar"),
    },
    "Apply with constraint": {
      term: new Apply("Foo").withConstraint(new Not(["bar"])),
      want: new Apply("Foo").withConstraint(new Not(["bar"])),
    },

    /* OneOf */
    "OneOf without constraint": {
      term: new OneOf([new Apply("Foo"), new Apply("Bar")]),
      want: new OneOf([new Apply("Foo"), new Apply("Bar")]),
    },
    "OneOf with constraint": {
      term: new OneOf([new Apply("Foo"), new Apply("Bar")]).withConstraint(
        new Not(["y"]),
      ),
      want: new OneOf([new Apply("Foo"), new Apply("Bar")]).withConstraint(
        new Not(["y"]),
      ),
    },
    "OneOf with an optimizable child": {
      term: new OneOf([
        new Apply("Foobar"),
        new Sequence([new Terminal("foo"), new Terminal("bar")]),
      ]),
      want: new OneOf([new Apply("Foobar"), new Terminal("foobar")]),
    },
    "OneOf with multiple optimizable children": {
      term: new OneOf([
        new Sequence([new Terminal("foo"), new Terminal("bar")]),
        new Sequence([new Terminal("Hello "), new Terminal("world!")]),
      ]),
      want: new OneOf([new Terminal("foobar"), new Terminal("Hello world!")]),
    },

    /* Optional */
    "Optional without constraint": {
      term: new Optional(new Terminal("foobar")),
      want: new Optional(new Terminal("foobar")),
    },
    "Optional with constraint": {
      term: new Optional(new Terminal("foo")).withConstraint(new Not(["bar"])),
      want: new Optional(new Terminal("foo")).withConstraint(new Not(["bar"])),
    },
    "Optional with optimizable child": {
      term: new Optional(
        new Sequence([new Terminal("foo"), new Terminal("bar")]),
      ),
      want: new Optional(new Terminal("foobar")),
    },
    "Optional of Optional": {
      term: new Optional(new Optional(new Terminal("foobar"))),
      want: new Optional(new Terminal("foobar")),
    },

    /* Repeat */
    "Repeat without constraint": {
      term: new Repeat(new Terminal("x"), { min: 1 }),
      want: new Repeat(new Terminal("x"), { min: 1 }),
    },
    "Repeat with constraint": {
      term: new Repeat(new Terminal("x"), { min: 1 }).withConstraint(
        new Not(["y"]),
      ),
      want: new Repeat(new Terminal("x"), { min: 1 }).withConstraint(
        new Not(["y"]),
      ),
    },
    "Repeat with optimizable child": {
      term: new Repeat(
        new Sequence([new Terminal("foo"), new Terminal("bar")]),
        { min: 1 },
      ),
      want: new Repeat(new Terminal("foobar"), { min: 1 }),
    },

    /* Sequence */
    "Sequence of one": {
      term: new Sequence([new Terminal("foobar")]),
      want: new Terminal("foobar"),
    },
    "Sequence of sequence of one": {
      term: new Sequence([new Sequence([new Terminal("foobar")])]),
      want: new Terminal("foobar"),
    },
    "Sequence of terminals": {
      term: new Sequence([
        new Terminal("Goodbye"),
        new Terminal(" cruel "),
        new Terminal("world"),
      ]),
      want: new Terminal("Goodbye cruel world"),
    },
    "Sequence of repetitions": {
      term: new Sequence([
        new Repeat(new Terminal("foobar"), { min: 0 }),
        new Repeat(new Terminal("foobar"), { min: 1 }),
      ]),
      want: new Repeat(new Terminal("foobar"), { min: 1 }),
    },
    "Sequence of sequences": {
      term: new Sequence([
        new Sequence([new Apply("ruleFoo"), new Apply("ruleBar")]),
        new Sequence([new Terminal("Hello"), new Terminal(" world!")]),
      ]),
      want: new Sequence([
        new Apply("ruleFoo"),
        new Apply("ruleBar"),
        new Terminal("Hello world!"),
      ]),
    },

    /* Terminal */
    "Terminal without constraint": {
      term: new Terminal("foobar"),
      want: new Terminal("foobar"),
    },
    "Terminal with constraint": {
      term: new Terminal("foo").withConstraint(new Not(["bar"])),
      want: new Terminal("foo").withConstraint(new Not(["bar"])),
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
