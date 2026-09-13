// SPDX-License-Identifier: Apache-2.0

import * as assert from "node:assert/strict";
import { suite, test } from "node:test";

import { None, Not } from "../src/constraints.js";

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

  suite("properties", () => {
    suite("get", () => {
      const testdata = {
        /* Not */
        "Not#exclusions": {
          subject: new Not(["foo", "bar"]),
          property: "exclusions",
          want: ["foo", "bar"],
        },
      };

      for (const [name, testcase] of Object.entries(testdata)) {
        test(name, () => {
          const { property, subject, want } = testcase;
          assert.deepEqual(subject[property], want);
        });
      }
    });

    suite("set", () => {
      const testdata = {
        /* Not */
        "Not#exclusions": {
          subject: new Not(["foo", "bar"]),
          property: "exclusions",
          value: ["foo", "bar"],
          want: /^TypeError: Cannot set property exclusions /,
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
