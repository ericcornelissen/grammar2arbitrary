// SPDX-License-Identifier: Apache-2.0

import * as assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import { test } from "node:test";

import * as ohm from "ohm-js";

import { grammer2arbitrary, parseModifier, termToArbitrary } from "./main.js";

test("grammer2arbitrary", async (t) => {
  const raw = await fs.readFile("./testdata/example.ohm");
  const exportName = "Example";

  await t.test("valid", async () => {
    const baseRules = ["Expression"];
    const exportName = "Example";

    const script = grammer2arbitrary({ baseRules, exportName, raw });
    assert.match(script, /export function Example\(/);
    assert.match(script, /tie\("Expression"\)\s*\)/);
  });

  await t.test("invalid", async () => {
    const baseRules = ["not actually rule"];

    assert.throws(() => {
      grammer2arbitrary({ baseRules, exportName, raw });
    }, /^Error: Not all bases are in the grammar.\n/);
  });
});

test("parseModifier", async (t) => {
  await t.test("valid", async (t) => {
    const testdata = {
      "unknown criteria/random comment": {
        input: `Lorem ipsum dolor sit amet`,
        want: "",
      },
      "NOT, one exclusion criteria": {
        input: `NOT "foobar"`,
        want: `.filter(s => !["foobar"].includes(s))`,
      },
      "NOT, two exclusion criteria": {
        input: `NOT "foo", "bar"`,
        want: `.filter(s => !["foo", "bar"].includes(s))`,
      },
      "NOT, multiple exclusion criteria withouth spaces": {
        input: `NOT "foo","bar"`,
        want: `.filter(s => !["foo","bar"].includes(s))`,
      },
    };

    for (const [name, testcase] of Object.entries(testdata)) {
      await t.test(name, () => {
        const got = parseModifier(testcase.input);
        assert.equal(got, testcase.want);
      });
    }
  });

  await t.test("invalid", async (t) => {
    const testdata = {
      "NOT, no list": {
        input: `NOT `,
        want: /^Error: invalid 'NOT "a", "b", ...' modifier: 'NOT '$/,
      },
      "NOT, incomplete list": {
        input: `NOT "foo", `,
        want: /^Error: invalid 'NOT "a", "b", ...' modifier: 'NOT "foo", '$/,
      },
      "NOT, invalid list": {
        input: `NOT "foo "bar `,
        want: /^Error: invalid 'NOT "a", "b", ...' modifier: 'NOT "foo "bar '$/,
      },
    };

    for (const [name, testcase] of Object.entries(testdata)) {
      await t.test(name, () => {
        assert.throws(() => {
          parseModifier(testcase.input);
        }, testcase.want);
      });
    }
  });
});

test("termToArbitrary", async (t) => {
  await t.test("valid", async (t) => {
    const testdata = {
      terminal: {
        term: new ohm.pexprs.Terminal("foobar"),
        want: `fc.constant("foobar")`,
      },
      "rule application": {
        term: new ohm.pexprs.Apply("ruleFoobar"),
        want: `tie("ruleFoobar")`,
      },
      "sequence of terminals": {
        term: new ohm.pexprs.Seq([
          new ohm.pexprs.Terminal("foo"),
          new ohm.pexprs.Terminal("bar"),
        ]),
        want: `fc.tuple(fc.constant("foo"), fc.constant("bar")).map(array => array.join(""))`,
      },
      "sequence of rules": {
        term: new ohm.pexprs.Seq([
          new ohm.pexprs.Apply("ruleFoo"),
          new ohm.pexprs.Apply("ruleBar"),
        ]),
        want: `fc.tuple(tie("ruleFoo"), tie("ruleBar")).map(array => array.join(""))`,
      },
      "sequence of rules and terminals": {
        term: new ohm.pexprs.Seq([
          new ohm.pexprs.Apply("foo"),
          new ohm.pexprs.Terminal("-"),
          new ohm.pexprs.Apply("bar"),
        ]),
        want: `fc.tuple(tie("foo"), fc.constant("-"), tie("bar")).map(array => array.join(""))`,
      },
      "alteration of terminals": {
        term: new ohm.pexprs.Alt([
          new ohm.pexprs.Terminal("foo"),
          new ohm.pexprs.Terminal("bar"),
        ]),
        want: `fc.oneof(fc.constant("foo"), fc.constant("bar"))`,
      },
      "alteration of rules": {
        term: new ohm.pexprs.Alt([
          new ohm.pexprs.Apply("ruleFoo"),
          new ohm.pexprs.Apply("ruleBar"),
        ]),
        want: `fc.oneof(tie("ruleFoo"), tie("ruleBar"))`,
      },
      "alteration of rules and terminals": {
        term: new ohm.pexprs.Alt([
          new ohm.pexprs.Apply("foo"),
          new ohm.pexprs.Terminal("-"),
          new ohm.pexprs.Apply("bar"),
        ]),
        want: `fc.oneof(tie("foo"), fc.constant("-"), tie("bar"))`,
      },
      "0-or-1 terminal": {
        term: new ohm.pexprs.Opt(new ohm.pexprs.Terminal("foobar")),
        want: `fc.option(fc.constant("foobar"), { nil: "" })`,
      },
      "0-or-1 rule application": {
        term: new ohm.pexprs.Opt(new ohm.pexprs.Apply("ruleFoobar")),
        want: `fc.option(tie("ruleFoobar"), { nil: "" })`,
      },
      "0-or-more of terminals": {
        term: new ohm.pexprs.Star(new ohm.pexprs.Terminal("foobar")),
        want: `fc.array(fc.constant("foobar"), { minLength: 0 }).map(array => array.join(""))`,
      },
      "0-or-more of rule applications": {
        term: new ohm.pexprs.Star(new ohm.pexprs.Apply("ruleFoo")),
        want: `fc.array(tie("ruleFoo"), { minLength: 0 }).map(array => array.join(""))`,
      },
      "1-or-more of terminal": {
        term: new ohm.pexprs.Plus(new ohm.pexprs.Terminal("foobar")),
        want: `fc.array(fc.constant("foobar"), { minLength: 1 }).map(array => array.join(""))`,
      },
      "1-or-more of terminal": {
        term: new ohm.pexprs.Plus(new ohm.pexprs.Apply("ruleBar")),
        want: `fc.array(tie("ruleBar"), { minLength: 1 }).map(array => array.join(""))`,
      },
    };

    for (const [name, testcase] of Object.entries(testdata)) {
      await t.test(name, () => {
        const got = termToArbitrary(testcase.term);
        assert.equal(got, testcase.want);
      });
    }
  });

  await t.test("invalid", async (t) => {
    const testdata = {
      "negative lookahead": {
        term: new ohm.pexprs.Not(new ohm.pexprs.Terminal("foobar")),
        want: /^Error: generating a negative lookahead \(~\) is not supported$/,
      },
      "parameterized rule": {
        term: new ohm.pexprs.Param("foobar"),
        want: /^Error: generating parameterized rules \(ruleName<arg>\) is not supported$/,
      },
      "unknown term": {
        term: new Map(),
        want: /^Error: unknown term$/,
      },
    };

    for (const [name, testcase] of Object.entries(testdata)) {
      await t.test(name, () => {
        assert.throws(() => {
          termToArbitrary(testcase.term);
        }, testcase.want);
      });
    }
  });
});
