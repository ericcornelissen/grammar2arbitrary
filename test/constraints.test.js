// SPDX-License-Identifier: Apache-2.0

import * as assert from "node:assert/strict";
import { suite, test } from "node:test";

import { Not, None } from "../src/constraints.js";

suite("constraints", () => {
  suite("equals", () => {
    const testdata = {
      /* None */
      "None and None": {
        a: new None(),
        b: new None(),
        want: true,
      },
      "None and Not": {
        a: new None(),
        b: new Not(["foo", "bar"]),
        want: false,
      },

      /* Not */
      "Not and Not, identical": {
        a: new Not(["foo", "bar"]),
        b: new Not(["foo", "bar"]),
        want: true,
      },
      "Not and Not, different values": {
        a: new Not(["foo", "bar"]),
        b: new Not(["foo", "baz"]),
        want: false,
      },
      "Not and Not, different arity": {
        a: new Not(["foo", "bar"]),
        b: new Not(["foo", "bar", "baz"]),
        want: false,
      },
      "Not and None": {
        a: new Not(["foo", "bar"]),
        b: new None(),
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

  suite("toString", () => {
    const testdata = {
      none: {
        term: new None(),
        want: ``,
      },
      not: {
        term: new Not(["foo", "bar"]),
        want: `.filter(string => !["foo", "bar"].includes(string))`,
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
