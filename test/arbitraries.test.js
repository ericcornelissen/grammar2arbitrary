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

import { toArbitrary } from "../src/arbitraries.js";

suite("toArbitrary", () => {
  const testdata = {
    terminal: {
      term: new Terminal("foobar"),
      want: `fc.constant("foobar")`,
    },
    "terminal with backslash": {
      term: new Terminal("a\\b"),
      want: `fc.constant("a\\\\b")`,
    },
    "terminal with double quote": {
      term: new Terminal('a"b'),
      want: `fc.constant("a\\"b")`,
    },
    "terminal with line feed": {
      term: new Terminal("a\nb"),
      want: `fc.constant("a\\nb")`,
    },
    "terminal with carriage return": {
      term: new Terminal("a\rb"),
      want: `fc.constant("a\\rb")`,
    },
    "terminal with horizontal tab": {
      term: new Terminal("a\tb"),
      want: `fc.constant("a\\tb")`,
    },
    "rule application": {
      term: new Apply("ruleFoobar"),
      want: `tie("ruleFoobar")`,
    },
    "sequence of terminals": {
      term: new Sequence([new Terminal("foo"), new Terminal("bar")]),
      want: `fc.tuple(fc.constant("foo"),fc.constant("bar")).map(array=>array.join(""))`,
    },
    "sequence of rules": {
      term: new Sequence([new Apply("ruleFoo"), new Apply("ruleBar")]),
      want: `fc.tuple(tie("ruleFoo"),tie("ruleBar")).map(array=>array.join(""))`,
    },
    "sequence of rules and terminals": {
      term: new Sequence([
        new Apply("foo"),
        new Terminal("-"),
        new Apply("bar"),
      ]),
      want: `fc.tuple(tie("foo"),fc.constant("-"),tie("bar")).map(array=>array.join(""))`,
    },
    "alteration of terminals": {
      term: new OneOf([new Terminal("foo"), new Terminal("bar")]),
      want: `fc.constantFrom("foo","bar")`,
    },
    "alteration of terminals with special characters": {
      term: new OneOf([
        new Terminal("a\\b"),
        new Terminal('a"b'),
        new Terminal("a\nb"),
        new Terminal("a\rb"),
        new Terminal("a\tb"),
      ]),
      want: `fc.constantFrom("a\\\\b","a\\"b","a\\nb","a\\rb","a\\tb")`,
    },
    "alteration of rules": {
      term: new OneOf([new Apply("ruleFoo"), new Apply("ruleBar")]),
      want: `fc.oneof(tie("ruleFoo"),tie("ruleBar"))`,
    },
    "alteration of rules and terminals": {
      term: new OneOf([new Apply("foo"), new Terminal("-"), new Apply("bar")]),
      want: `fc.oneof(tie("foo"),fc.constant("-"),tie("bar"))`,
    },
    "0-or-1 terminal": {
      term: new Optional(new Terminal("foobar")),
      want: `fc.option(fc.constant("foobar"),{nil:""})`,
    },
    "0-or-1 rule application": {
      term: new Optional(new Apply("ruleFoobar")),
      want: `fc.option(tie("ruleFoobar"),{nil:""})`,
    },
    "0-or-more of terminals": {
      term: new Repeat(new Terminal("foobar"), { min: 0 }),
      want: `fc.array(fc.constant("foobar"),{minLength:0}).map(array=>array.join(""))`,
    },
    "0-or-more of rule applications": {
      term: new Repeat(new Apply("ruleFoo"), { min: 0 }),
      want: `fc.array(tie("ruleFoo"),{minLength:0}).map(array=>array.join(""))`,
    },
    "1-or-more of terminal": {
      term: new Repeat(new Terminal("foobar"), { min: 1 }),
      want: `fc.array(fc.constant("foobar"),{minLength:1}).map(array=>array.join(""))`,
    },
    "1-or-more of terminal": {
      term: new Repeat(new Apply("ruleBar"), { min: 1 }),
      want: `fc.array(tie("ruleBar"),{minLength:1}).map(array=>array.join(""))`,
    },
    "with constraint": {
      term: new Repeat(new Terminal("a"), { min: 0 }).withConstraint(
        new Not(["aa"]),
      ),
      want: `fc.array(fc.constant("a"),{minLength:0}).map(array=>array.join("")).filter(string=>!["aa"].includes(string))`,
    },
    "with nested constraint": {
      term: new Optional(
        new Repeat(new Terminal("a"), { min: 0 }).withConstraint(
          new Not(["aa"]),
        ),
      ),
      want: `fc.option(fc.array(fc.constant("a"),{minLength:0}).map(array=>array.join("")).filter(string=>!["aa"].includes(string)),{nil:""})`,
    },
  };

  for (const [name, testcase] of Object.entries(testdata)) {
    test(name, () => {
      const { term, want } = testcase;

      const got = toArbitrary(term);
      assert.equal(got, want);
    });
  }
});
