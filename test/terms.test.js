// SPDX-License-Identifier: Apache-2.0

import * as assert from "node:assert/strict";
import { suite, test } from "node:test";

import { None, Not } from "../src/constraints.js";

import {
  Apply,
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
      "Apply with constraint and Apply": {
        a: new Apply("Foo").withConstraint(new Not(["bar"])),
        b: new Apply("Foo"),
        want: false,
      },
      "Apply and Apply with constraint": {
        a: new Apply("Foo"),
        b: new Apply("Foo").withConstraint(new Not(["bar"])),
        want: false,
      },
      "Apply with constraint and Apply with constraint, identical": {
        a: new Apply("Foo").withConstraint(new Not(["bar"])),
        b: new Apply("Foo").withConstraint(new Not(["bar"])),
        want: true,
      },
      "Apply with constraint and Apply with constraint, different": {
        a: new Apply("Foo").withConstraint(new Not(["bar"])),
        b: new Apply("Foo").withConstraint(new Not(["baz"])),
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
      "OneOf with constraint and OneOf": {
        a: new OneOf([new Terminal("foo"), new Terminal("bar")]).withConstraint(
          new Not(["bar"]),
        ),
        b: new OneOf([new Terminal("foo"), new Terminal("bar")]),
        want: false,
      },
      "OneOf and OneOf with constraint": {
        a: new OneOf([new Terminal("foo"), new Terminal("bar")]),
        b: new OneOf([new Terminal("foo"), new Terminal("bar")]).withConstraint(
          new Not(["bar"]),
        ),
        want: false,
      },
      "OneOf with constraint and OneOf with constraint, identical": {
        a: new OneOf([new Terminal("foo"), new Terminal("bar")]).withConstraint(
          new Not(["bar"]),
        ),
        b: new OneOf([new Terminal("foo"), new Terminal("bar")]).withConstraint(
          new Not(["bar"]),
        ),
        want: true,
      },
      "OneOf with constraint and OneOf with constraint, different": {
        a: new OneOf([new Terminal("foo"), new Terminal("bar")]).withConstraint(
          new Not(["bar"]),
        ),
        b: new OneOf([new Terminal("foo"), new Terminal("bar")]).withConstraint(
          new Not(["baz"]),
        ),
        want: false,
      },
      "OneOf and Apply": {
        a: new OneOf([new Terminal("foo"), new Terminal("bar")]),
        b: new Apply("Foobar"),
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
      "Optional with constraint and Optional": {
        a: new Optional(new Terminal("foobar")).withConstraint(
          new Not(["bar"]),
        ),
        b: new Optional(new Terminal("foobar")),
        want: false,
      },
      "Optional and Optional with constraint": {
        a: new Optional(new Terminal("foobar")),
        b: new Optional(new Terminal("foobar")).withConstraint(
          new Not(["bar"]),
        ),
        want: false,
      },
      "Optional with constraint and Optional with constraint, identical": {
        a: new Optional(new Terminal("foobar")).withConstraint(
          new Not(["bar"]),
        ),
        b: new Optional(new Terminal("foobar")).withConstraint(
          new Not(["bar"]),
        ),
        want: true,
      },
      "Optional with constraint and Optional with constraint, different": {
        a: new Optional(new Terminal("foobar")).withConstraint(
          new Not(["bar"]),
        ),
        b: new Optional(new Terminal("foobar")).withConstraint(
          new Not(["baz"]),
        ),
        want: false,
      },
      "Optional and Apply": {
        a: new Optional(new Terminal("foobar")),
        b: new Apply("Foobar"),
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
      "Repeat with constraint and Repeat": {
        a: new Repeat(new Terminal("foobar"), { min: 0 }).withConstraint(
          new Not(["bar"]),
        ),
        b: new Repeat(new Terminal("foobar"), { min: 0 }),
        want: false,
      },
      "Repeat and Repeat with constraint": {
        a: new Repeat(new Terminal("foobar"), { min: 0 }),
        b: new Repeat(new Terminal("foobar"), { min: 0 }).withConstraint(
          new Not(["bar"]),
        ),
        want: false,
      },
      "Repeat with constraint and Repeat with constraint, identical": {
        a: new Repeat(new Terminal("foobar"), { min: 0 }).withConstraint(
          new Not(["bar"]),
        ),
        b: new Repeat(new Terminal("foobar"), { min: 0 }).withConstraint(
          new Not(["bar"]),
        ),
        want: true,
      },
      "Repeat with constraint and Repeat with constraint, different": {
        a: new Repeat(new Terminal("foobar"), { min: 0 }).withConstraint(
          new Not(["bar"]),
        ),
        b: new Repeat(new Terminal("foobar"), { min: 0 }).withConstraint(
          new Not(["baz"]),
        ),
        want: false,
      },
      "Repeat and Apply": {
        a: new Repeat(new Terminal("foobar"), { min: 0 }),
        b: new Apply("Foobar"),
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
      "Sequence with constraint and Sequence": {
        a: new Sequence([
          new Terminal("foo"),
          new Terminal("bar"),
        ]).withConstraint(new Not(["bar"])),
        b: new Sequence([new Terminal("foo"), new Terminal("bar")]),
        want: false,
      },
      "Sequence and Sequence with constraint": {
        a: new Sequence([new Terminal("foo"), new Terminal("bar")]),
        b: new Sequence([
          new Terminal("foo"),
          new Terminal("bar"),
        ]).withConstraint(new Not(["bar"])),
        want: false,
      },
      "Sequence with constraint and Sequence with constraint, identical": {
        a: new Sequence([
          new Terminal("foo"),
          new Terminal("bar"),
        ]).withConstraint(new Not(["bar"])),
        b: new Sequence([
          new Terminal("foo"),
          new Terminal("bar"),
        ]).withConstraint(new Not(["bar"])),
        want: true,
      },
      "Sequence with constraint and Sequence with constraint, different": {
        a: new Sequence([
          new Terminal("foo"),
          new Terminal("bar"),
        ]).withConstraint(new Not(["bar"])),
        b: new Sequence([
          new Terminal("foo"),
          new Terminal("bar"),
        ]).withConstraint(new Not(["baz"])),
        want: false,
      },
      "Sequence and Apply": {
        a: new Sequence([new Terminal("foo"), new Terminal("bar")]),
        b: new Apply("Foobar"),
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
      "Terminal with constraint and Terminal": {
        a: new Terminal("foobar").withConstraint(new Not(["bar"])),
        b: new Terminal("foobar"),
        want: false,
      },
      "Terminal and Terminal with constraint": {
        a: new Terminal("foobar"),
        b: new Terminal("foobar").withConstraint(new Not(["bar"])),
        want: false,
      },
      "Terminal with constraint and Terminal with constraint, identical": {
        a: new Terminal("foobar").withConstraint(new Not(["bar"])),
        b: new Terminal("foobar").withConstraint(new Not(["bar"])),
        want: true,
      },
      "Terminal with constraint and Terminal with constraint, different": {
        a: new Terminal("foobar").withConstraint(new Not(["bar"])),
        b: new Terminal("foobar").withConstraint(new Not(["baz"])),
        want: false,
      },
      "Terminal and Apply": {
        a: new Terminal("foobar"),
        b: new Apply("Foobar"),
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

  suite("properties", () => {
    suite("get", () => {
      const testdata = {
        /* Apply */
        "Apply#constraint, default": {
          subject: new Apply("Foobar"),
          property: "constraint",
          assert: (got) => assert.ok(got.equals(new None())),
        },
        "Apply#constraint, set": {
          subject: new Apply("Foobar").withConstraint(new Not(["foobar"])),
          property: "constraint",
          assert: (got) => assert.ok(got.equals(new Not(["foobar"]))),
        },
        "Apply#identifier": {
          subject: new Apply("Foobar"),
          property: "identifier",
          assert: (got) => assert.equal(got, "Foobar"),
        },

        /* OneOf */
        "OneOf#constraint, default": {
          subject: new OneOf([new Terminal("foo"), new Terminal("bar")]),
          property: "constraint",
          assert: (got) => assert.ok(got.equals(new None())),
        },
        "OneOf#constraint, set": {
          subject: new OneOf([
            new Terminal("foo"),
            new Terminal("bar"),
          ]).withConstraint(new Not(["foobar"])),
          property: "constraint",
          assert: (got) => assert.ok(got.equals(new Not(["foobar"]))),
        },
        "OneOf#constants": {
          subject: new OneOf([new Terminal("foo"), new Terminal("bar")]),
          property: "options",
          assert: (got) =>
            assert.ok(
              got.length === 2 &&
                got[0].equals(new Terminal("foo")) &&
                got[1].equals(new Terminal("bar")),
            ),
        },

        /* Optional */
        "Optional#constraint, default": {
          subject: new Optional(new Terminal("foobar")),
          property: "constraint",
          assert: (got) => assert.ok(got.equals(new None())),
        },
        "Optional#constraint, default": {
          subject: new Optional(new Terminal("foobar")).withConstraint(
            new Not(["foobar"]),
          ),
          property: "constraint",
          assert: (got) => assert.ok(got.equals(new Not(["foobar"]))),
        },
        "Optional#constant": {
          subject: new Optional(new Terminal("foobar")),
          property: "option",
          assert: (got) => assert.ok(got.equals(new Terminal("foobar"))),
        },

        /* Repeat */
        "Repeat#constraint, default": {
          subject: new Repeat(new Terminal("foobar"), { min: 0 }),
          property: "constraint",
          assert: (got) => assert.ok(got.equals(new None())),
        },
        "Repeat#constraint, set": {
          subject: new Repeat(new Terminal("foobar"), {
            min: 0,
          }).withConstraint(new Not(["foobar"])),
          property: "constraint",
          assert: (got) => assert.ok(got.equals(new Not(["foobar"]))),
        },
        "Repeat#parameters": {
          subject: new Repeat(new Terminal("foobar"), { min: 1 }),
          property: "parameters",
          assert: (got) => assert.deepEqual(got, { min: 1 }),
        },
        "Repeat#subject": {
          subject: new Repeat(new Terminal("foobar"), { min: 2 }),
          property: "subject",
          assert: (got) => assert.ok(got.equals(new Terminal("foobar"))),
        },

        /* Sequence */
        "Sequence#constraint, default": {
          subject: new Sequence([new Terminal("foo"), new Terminal("bar")]),
          property: "constraint",
          assert: (got) => assert.ok(got.equals(new None())),
        },
        "Sequence#constraint, set": {
          subject: new Sequence([
            new Terminal("foo"),
            new Terminal("bar"),
          ]).withConstraint(new Not(["foobar"])),
          property: "constraint",
          assert: (got) => assert.ok(got.equals(new Not(["foobar"]))),
        },
        "Sequence#subjects": {
          subject: new Sequence([new Terminal("foo"), new Terminal("bar")]),
          property: "subjects",
          assert: (got) =>
            assert.ok(
              got.length === 2 &&
                got[0].equals(new Terminal("foo")) &&
                got[1].equals(new Terminal("bar")),
            ),
        },

        /* Terminal */
        "Terminal#constraint, default": {
          subject: new Terminal("foobar"),
          property: "constraint",
          assert: (got) => assert.ok(got.equals(new None())),
        },
        "Terminal#constraint, set": {
          subject: new Terminal("foobar").withConstraint(new Not(["foobar"])),
          property: "constraint",
          assert: (got) => assert.ok(got.equals(new Not(["foobar"]))),
        },
        "Terminal#subjects": {
          subject: new Terminal("foobar"),
          property: "term",
          assert: (got) => assert.equal(got, "foobar"),
        },
      };

      for (const [name, testcase] of Object.entries(testdata)) {
        test(name, () => {
          const { assert, property, subject } = testcase;
          assert(subject[property]);
        });
      }
    });

    suite("set", () => {
      const testdata = {
        /* Apply */
        "Apply#constraint": {
          subject: new Apply("Foobar"),
          property: "constraint",
          value: new None(),
          want: /^TypeError: Cannot set property constraint /,
        },
        "Apply#identifier": {
          subject: new Apply("Foobar"),
          property: "identifier",
          value: "Foobaz",
          want: /^TypeError: Cannot set property identifier /,
        },

        /* OneOf */
        "OneOf#constraint": {
          subject: new OneOf([new Terminal("foo"), new Terminal("bar")]),
          property: "constraint",
          value: new None(),
          want: /^TypeError: Cannot set property constraint /,
        },
        "OneOf#options": {
          subject: new OneOf([new Terminal("foo"), new Terminal("bar")]),
          property: "options",
          value: [new Terminal("foo"), new Terminal("baz")],
          want: /^TypeError: Cannot set property options /,
        },

        /* Optional */
        "Optional#constraint": {
          subject: new Optional(new Terminal("foobar")),
          property: "constraint",
          value: new None(),
          want: /^TypeError: Cannot set property constraint /,
        },
        "Optional#option": {
          subject: new Optional(new Terminal("foobar")),
          property: "option",
          value: new Terminal("foobaz"),
          want: /^TypeError: Cannot set property option /,
        },

        /* Repeat */
        "Repeat#constraint": {
          subject: new Repeat(new Terminal("foobar"), { min: 0 }),
          property: "constraint",
          value: new None(),
          want: /^TypeError: Cannot set property constraint /,
        },
        "Repeat#parameters": {
          subject: new Repeat(new Terminal("foobar"), { min: 1 }),
          property: "parameters",
          value: { min: 0 },
          want: /^TypeError: Cannot set property parameters /,
        },
        "Repeat#subject": {
          subject: new Repeat(new Terminal("foobar"), { min: 2 }),
          property: "subject",
          value: new Terminal("foobaz"),
          want: /^TypeError: Cannot set property subject /,
        },

        /* Terminal */
        "Terminal#constraint": {
          subject: new Terminal("foobar"),
          property: "constraint",
          value: new None(),
          want: /^TypeError: Cannot set property constraint /,
        },
        "Terminal#term": {
          subject: new Terminal("foobar"),
          property: "term",
          value: "foobaz",
          want: /^TypeError: Cannot set property term /,
        },
      };

      for (const [name, testcase] of Object.entries(testdata)) {
        test(name, () => {
          const { property, subject, value, want } = testcase;
          assert.throws(() => {
            subject[property] = value;
          }, want);
        });
      }
    });
  });
});
