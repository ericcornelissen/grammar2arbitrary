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

import { ohm2arbitrary } from "../src/ohm.js";

suite("parseConstraint", () => {
  suite("valid", () => {
    const testdata = {
      "basic grammar": {
        input: `
          TestGrammar {
            Basic = "foo" | "bar"
          }
        `,
        want: new Map([
          ["Basic", new OneOf([new Terminal("foo"), new Terminal("bar")])],
        ]),
      },
      "multiple rules": {
        input: `
          TestGrammar {
            Base = Foobar
            Foobar = "foo" | "bar"
          }
        `,
        want: new Map([
          ["Base", new Apply("Foobar")],
          ["Foobar", new OneOf([new Terminal("foo"), new Terminal("bar")])],
        ]),
      },
      "complex rules": {
        input: `
          TestGrammar {
            Complex = Foo "-" Bar
            Foo = "foo"
            Bar = "bar" | "baz"
          }
        `,
        want: new Map([
          [
            "Complex",
            new Sequence([
              new Apply("Foo"),
              new Terminal("-"),
              new Apply("Bar"),
            ]),
          ],
          ["Foo", new Terminal("foo")],
          ["Bar", new OneOf([new Terminal("bar"), new Terminal("baz")])],
        ]),
      },
      "rule with optional": {
        input: `
          TestGrammar {
            Opt = "foo" "bar"?
          }
        `,
        want: new Map([
          [
            "Opt",
            new Sequence([
              new Terminal("foo"),
              new Optional(new Terminal("bar")),
            ]),
          ],
        ]),
      },
      "rule with repeat, 0-or-more": {
        input: `
          TestGrammar {
            Repeat = "foo" "bar"*
          }
        `,
        want: new Map([
          [
            "Repeat",
            new Sequence([
              new Terminal("foo"),
              new Repeat(new Terminal("bar"), { min: 0 }),
            ]),
          ],
        ]),
      },
      "rule with repeat, 1-or-more": {
        input: `
          TestGrammar {
            Repeat = "foo" "bar"+
          }
        `,
        want: new Map([
          [
            "Repeat",
            new Sequence([
              new Terminal("foo"),
              new Repeat(new Terminal("bar"), { min: 1 }),
            ]),
          ],
        ]),
      },
      "with a simple constaint": {
        input: `
          TestGrammar {
            Constrained (NOT "foo")
              = "foo" | "bar"
          }
        `,
        want: new Map([
          [
            "Constrained",
            new OneOf([
              new Terminal("foo"),
              new Terminal("bar"),
            ]).withConstraint(new Not(["foo"])),
          ],
        ]),
      },
      "with a complex constaint": {
        input: `
          TestGrammar {
            Constrained (NOT "foo", "baz")
              = "foo" | "bar"
          }
        `,
        want: new Map([
          [
            "Constrained",
            new OneOf([
              new Terminal("foo"),
              new Terminal("bar"),
            ]).withConstraint(new Not(["foo", "baz"])),
          ],
        ]),
      },
      "with a constaint, spacing": {
        input: `
          TestGrammar {
            Constrained (NOT "foo","baz")
              = "foo" | "bar"
          }
        `,
        want: new Map([
          [
            "Constrained",
            new OneOf([
              new Terminal("foo"),
              new Terminal("bar"),
            ]).withConstraint(new Not(["foo", "baz"])),
          ],
        ]),
      },
      "with a unrelated rule comment": {
        input: `
          TestGrammar {
            NotConstrained (Lorem ipsum dolor sit amet)
              = "foo" | "bar"
          }
        `,
        want: new Map([
          [
            "NotConstrained",
            new OneOf([new Terminal("foo"), new Terminal("bar")]),
          ],
        ]),
      },
    };

    for (const [name, testcase] of Object.entries(testdata)) {
      test(name, () => {
        const { input, want } = testcase;

        const got = ohm2arbitrary(input);
        assert.equal(got.size, want.size);
        for (const key of want.keys()) {
          assert.ok(got.get(key).equals(want.get(key)));
        }
      });
    }
  });

  suite("invalid", () => {
    const testdata = {
      "negative lookahead": {
        want: /^Error: generating a negative lookahead \(~\) is not supported$/,
        input: `
          TestGrammar {
            NegativeLookahead = ~ "n/a"
          }
        `,
      },
      "parameterized rule": {
        input: `
          TestGrammar {
            Repeat<x> = x x
          }
        `,
        want: /^Error: generating parameterized rules \(ruleName<arg>\) is not supported$/,
      },
      "invalid constaint, incomplete NOT list": {
        input: `
          TestGrammar {
            Constrained (NOT "incomplete)
              = "foo" | "bar"
          }
        `,
        want: /^Error: invalid 'NOT "a", "b", ...' modifier: 'NOT "incomplete'$/,
      },
      "invalid constaint, invalid NOT list": {
        input: `
          TestGrammar {
            Constrained (NOT "foo "bar)
              = "foo" | "bar"
          }
        `,
        want: /^Error: invalid 'NOT "a", "b", ...' modifier: 'NOT "foo "bar'$/,
      },
    };

    for (const [name, testcase] of Object.entries(testdata)) {
      test(name, () => {
        const { input, want } = testcase;

        assert.throws(() => {
          ohm2arbitrary(input);
        }, want);
      });
    }
  });
});
