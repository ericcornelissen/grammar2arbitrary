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

suite("terms", () => {
  suite("equals", () => {
    const testdata = {
      /* Apply */
      "Apply and Apply, identical": {
        a: new Apply("Foobar"),
        b: new Apply("Foobar"),
        want: true,
      },
      "Apply and Apply, different": {
        a: new Apply("Foo"),
        b: new Apply("Bar"),
        want: false,
      },
      "Apply and ConstantFrom": {
        a: new Apply("Foobar"),
        b: new ConstantFrom(["Foobar"]),
        want: false,
      },
      "Apply and OneOf": {
        a: new Apply("Foobar"),
        b: new OneOf([new Apply("Foo"), new Apply("Bar")]),
        want: false,
      },
      "Apply and Optional": {
        a: new Apply("Foobar"),
        b: new Optional(new Apply("Foobar")),
        want: false,
      },
      "Apply and Repeat": {
        a: new Apply("Foobar"),
        b: new Repeat(new Apply("Foobar"), { min: 1 }),
        want: false,
      },
      "Apply and Sequence": {
        a: new Apply("Foobar"),
        b: new Sequence([new Apply("Foo"), new Apply("Bar")]),
        want: false,
      },
      "Apply and Terminal": {
        a: new Apply("Foobar"),
        b: new Terminal("Foobar"),
        want: false,
      },

      /* ConstantFrom */
      "ConstantFrom and ConstantFrom, identical": {
        a: new ConstantFrom(["foo", "bar"]),
        b: new ConstantFrom(["foo", "bar"]),
        want: true,
      },
      "ConstantFrom and ConstantFrom, different": {
        a: new ConstantFrom(["foo", "bar"]),
        b: new ConstantFrom(["foo", "baz"]),
        want: false,
      },
      "ConstantFrom and Apply": {
        a: new ConstantFrom(["foo", "bar"]),
        b: new Apply("Foobar"),
        want: false,
      },
      "ConstantFrom and OneOf": {
        a: new ConstantFrom(["foo", "bar"]),
        b: new OneOf([
          new ConstantFrom(["foo", "bar"]),
          new ConstantFrom(["foo", "baz"]),
        ]),
        want: false,
      },
      "ConstantFrom and Optional": {
        a: new ConstantFrom(["foo", "bar"]),
        b: new Optional(new ConstantFrom(["foo", "bar"])),
        want: false,
      },
      "ConstantFrom and Repeat": {
        a: new ConstantFrom(["foo", "bar"]),
        b: new Repeat(new ConstantFrom(["foo", "bar"]), { min: 1 }),
        want: false,
      },
      "ConstantFrom and Sequence": {
        a: new ConstantFrom(["foo", "bar"]),
        b: new Sequence([
          new ConstantFrom(["foo", "bar"]),
          new ConstantFrom(["foo", "baz"]),
        ]),
        want: false,
      },
      "ConstantFrom and Terminal": {
        a: new ConstantFrom(["foo", "bar"]),
        b: new Terminal("foobar"),
        want: false,
      },

      /* OneOf */
      "OneOf and OneOf, identical": {
        a: new OneOf([new Terminal("foo"), new Terminal("bar")]),
        b: new OneOf([new Terminal("foo"), new Terminal("bar")]),
        want: true,
      },
      "OneOf and OneOf, different": {
        a: new OneOf([new Terminal("foo"), new Terminal("bar")]),
        b: new OneOf([new Terminal("foo"), new Terminal("baz")]),
        want: false,
      },
      "OneOf and Apply": {
        a: new OneOf([new Terminal("foo"), new Terminal("bar")]),
        b: new Apply("Foobar"),
        want: false,
      },
      "OneOf and ConstantFrom": {
        a: new OneOf([new Terminal("foo"), new Terminal("bar")]),
        b: new ConstantFrom(["foo", "bar"]),
        want: false,
      },
      "OneOf and Optional": {
        a: new OneOf([new Terminal("foo"), new Terminal("bar")]),
        b: new Optional(new Terminal("foobar")),
        want: false,
      },
      "OneOf and Repeat": {
        a: new OneOf([new Terminal("foo"), new Terminal("bar")]),
        b: new Repeat(new Terminal("foobar"), { min: 1 }),
        want: false,
      },
      "OneOf and Sequence": {
        a: new OneOf([new Terminal("foo"), new Terminal("bar")]),
        b: new Sequence([new Terminal("foo"), new Terminal("bar")]),
        want: false,
      },
      "OneOf and Terminal": {
        a: new OneOf([new Terminal("foo"), new Terminal("bar")]),
        b: new Terminal("foobar"),
        want: false,
      },

      /* Optional */
      "Optional and Optional, identical": {
        a: new Optional(new Terminal("foobar")),
        b: new Optional(new Terminal("foobar")),
        want: true,
      },
      "Optional and Optional, different": {
        a: new Optional(new Terminal("foobar")),
        b: new Optional(new Terminal("foobaz")),
        want: false,
      },
      "Optional and Apply": {
        a: new Optional(new Terminal("foobar")),
        b: new Apply("Foobar"),
        want: false,
      },
      "Optional and ConstantFrom": {
        a: new Optional(new Terminal("foobar")),
        b: new ConstantFrom(["foo", "bar"]),
        want: false,
      },
      "Optional and OneOf": {
        a: new Optional(new Terminal("foobar")),
        b: new OneOf([new Terminal("foo"), new Terminal("bar")]),
        want: false,
      },
      "Optional and Repeat": {
        a: new Optional(new Terminal("foobar")),
        b: new Repeat(new Terminal("foobar"), { min: 1 }),
        want: false,
      },
      "Optional and Sequence": {
        a: new Optional(new Terminal("foobar")),
        b: new Sequence([new Terminal("foo"), new Terminal("bar")]),
        want: false,
      },
      "Optional and Terminal": {
        a: new Optional(new Terminal("foobar")),
        b: new Terminal("foobar"),
        want: false,
      },

      /* Repeat */
      "Repeat and Repeat, identical": {
        a: new Repeat(new Terminal("foobar"), { min: 0 }),
        b: new Repeat(new Terminal("foobar"), { min: 0 }),
        want: true,
      },
      "Repeat and Repeat, different subject same parameters": {
        a: new Repeat(new Terminal("foobar"), { min: 0 }),
        b: new Repeat(new Terminal("foobaz"), { min: 0 }),
        want: false,
      },
      "Repeat and Repeat, same subject different parameters": {
        a: new Repeat(new Terminal("foobar"), { min: 0 }),
        b: new Repeat(new Terminal("foobar"), { min: 1 }),
        want: false,
      },
      "Repeat and Repeat, different subject and parameters": {
        a: new Repeat(new Terminal("foobar"), { min: 0 }),
        b: new Repeat(new Terminal("foobaz"), { min: 1 }),
        want: false,
      },
      "Repeat and Apply": {
        a: new Repeat(new Terminal("foobar"), { min: 0 }),
        b: new Apply("Foobar"),
        want: false,
      },
      "Repeat and ConstantFrom": {
        a: new Repeat(new Terminal("foobar"), { min: 0 }),
        b: new ConstantFrom(["foo", "bar"]),
        want: false,
      },
      "Repeat and OneOf": {
        a: new Repeat(new Terminal("foobar"), { min: 0 }),
        b: new OneOf([new Terminal("foo"), new Terminal("bar")]),
        want: false,
      },
      "Repeat and Optional": {
        a: new Repeat(new Terminal("foobar"), { min: 0 }),
        b: new Optional(new Terminal("foobar")),
        want: false,
      },
      "Repeat and Sequence": {
        a: new Repeat(new Terminal("foobar"), { min: 0 }),
        b: new Sequence([new Terminal("foo"), new Terminal("bar")]),
        want: false,
      },
      "Repeat and Terminal": {
        a: new Repeat(new Terminal("foobar"), { min: 0 }),
        b: new Terminal("foobar"),
        want: false,
      },

      /* Sequence */
      "Sequence and Sequence, identical": {
        a: new Sequence([new Terminal("foo"), new Terminal("bar")]),
        b: new Sequence([new Terminal("foo"), new Terminal("bar")]),
        want: true,
      },
      "Sequence and Sequence, different": {
        a: new Sequence([new Terminal("foo"), new Terminal("bar")]),
        b: new Sequence([new Terminal("foo"), new Terminal("baz")]),
        want: false,
      },
      "Sequence and Apply": {
        a: new Sequence([new Terminal("foo"), new Terminal("bar")]),
        b: new Apply("Foobar"),
        want: false,
      },
      "Sequence and ConstantFrom": {
        a: new Sequence([new Terminal("foo"), new Terminal("bar")]),
        b: new ConstantFrom(["foo", "bar"]),
        want: false,
      },
      "Sequence and OneOf": {
        a: new Sequence([new Terminal("foo"), new Terminal("bar")]),
        b: new OneOf([new Terminal("foo"), new Terminal("bar")]),
        want: false,
      },
      "Sequence and Optional": {
        a: new Sequence([new Terminal("foo"), new Terminal("bar")]),
        b: new Optional(new Terminal("foobar")),
        want: false,
      },
      "Sequence and Repeat": {
        a: new Sequence([new Terminal("foo"), new Terminal("bar")]),
        b: new Repeat(new Terminal("foobar"), { min: 1 }),
        want: false,
      },
      "Sequence and Terminal": {
        a: new Sequence([new Terminal("foo"), new Terminal("bar")]),
        b: new Terminal("foobar"),
        want: false,
      },

      /* Terminal */
      "Terminal and Terminal, identical": {
        a: new Terminal("foobar"),
        b: new Terminal("foobar"),
        want: true,
      },
      "Terminal and Terminal, different": {
        a: new Terminal("foobar"),
        b: new Terminal("foobaz"),
        want: false,
      },
      "Terminal and Apply": {
        a: new Terminal("foobar"),
        b: new Apply("Foobar"),
        want: false,
      },
      "Terminal and ConstantFrom": {
        a: new Terminal("foobar"),
        b: new ConstantFrom(["foo", "bar"]),
        want: false,
      },
      "Terminal and OneOf": {
        a: new Terminal("foobar"),
        b: new OneOf([new Terminal("foo"), new Terminal("bar")]),
        want: false,
      },
      "Terminal and Optional": {
        a: new Terminal("foobar"),
        b: new Optional(new Terminal("foobar")),
        want: false,
      },
      "Terminal and Repeat": {
        a: new Terminal("foobar"),
        b: new Repeat(new Terminal("foobar"), { min: 1 }),
        want: false,
      },
      "Terminal and Sequence": {
        a: new Terminal("foobar"),
        b: new Sequence([new Terminal("foo"), new Terminal("bar")]),
        want: false,
      },
    };

    for (const [name, testcase] of Object.entries(testdata)) {
      test(name, () => {
        const { a, b, want } = testcase;
        assert.equal(a.equals(b), want);
      });
    }
  });

  suite("optimized", () => {
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

        const got = term.optimized();
        assert.ok(got.equals(want));
      });
    }
  });

  suite("toString", () => {
    const testdata = {
      terminal: {
        term: new Terminal("foobar"),
        want: `fc.constant("foobar")`,
      },
      "rule application": {
        term: new Apply("ruleFoobar"),
        want: `tie("ruleFoobar")`,
      },
      "sequence of terminals": {
        term: new Sequence([new Terminal("foo"), new Terminal("bar")]),
        want: `fc.tuple(fc.constant("foo"), fc.constant("bar")).map(array => array.join(""))`,
      },
      "sequence of rules": {
        term: new Sequence([new Apply("ruleFoo"), new Apply("ruleBar")]),
        want: `fc.tuple(tie("ruleFoo"), tie("ruleBar")).map(array => array.join(""))`,
      },
      "sequence of rules and terminals": {
        term: new Sequence([
          new Apply("foo"),
          new Terminal("-"),
          new Apply("bar"),
        ]),
        want: `fc.tuple(tie("foo"), fc.constant("-"), tie("bar")).map(array => array.join(""))`,
      },
      "alteration of terminals": {
        term: new OneOf([new Terminal("foo"), new Terminal("bar")]),
        want: `fc.oneof(fc.constant("foo"), fc.constant("bar"))`,
      },
      "alteration of rules": {
        term: new OneOf([new Apply("ruleFoo"), new Apply("ruleBar")]),
        want: `fc.oneof(tie("ruleFoo"), tie("ruleBar"))`,
      },
      "alteration of rules and terminals": {
        term: new OneOf([
          new Apply("foo"),
          new Terminal("-"),
          new Apply("bar"),
        ]),
        want: `fc.oneof(tie("foo"), fc.constant("-"), tie("bar"))`,
      },
      "0-or-1 terminal": {
        term: new Optional(new Terminal("foobar")),
        want: `fc.option(fc.constant("foobar"), { nil: "" })`,
      },
      "0-or-1 rule application": {
        term: new Optional(new Apply("ruleFoobar")),
        want: `fc.option(tie("ruleFoobar"), { nil: "" })`,
      },
      "0-or-more of terminals": {
        term: new Repeat(new Terminal("foobar"), { min: 0 }),
        want: `fc.array(fc.constant("foobar"), { minLength: 0 }).map(array => array.join(""))`,
      },
      "0-or-more of rule applications": {
        term: new Repeat(new Apply("ruleFoo"), { min: 0 }),
        want: `fc.array(tie("ruleFoo"), { minLength: 0 }).map(array => array.join(""))`,
      },
      "1-or-more of terminal": {
        term: new Repeat(new Terminal("foobar"), { min: 1 }),
        want: `fc.array(fc.constant("foobar"), { minLength: 1 }).map(array => array.join(""))`,
      },
      "1-or-more of terminal": {
        term: new Repeat(new Apply("ruleBar"), { min: 1 }),
        want: `fc.array(tie("ruleBar"), { minLength: 1 }).map(array => array.join(""))`,
      },
      "with constraint": {
        term: new Repeat(new Terminal("a"), { min: 0 }).withConstraint(
          new Not(["aa"]),
        ),
        want: `fc.array(fc.constant("a"), { minLength: 0 }).map(array => array.join("")).filter(string => !["aa"].includes(string))`,
      },
    };

    for (const [name, testcase] of Object.entries(testdata)) {
      test(name, () => {
        const { term, want } = testcase;

        const got = term.toString();
        assert.equal(got, want);
      });
    }
  });
});
