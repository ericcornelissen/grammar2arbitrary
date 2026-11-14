// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert";

import * as ohm from "ohm-js";

import { None, Not } from "./constraints.js";
import {
  Apply,
  External,
  OneOf,
  Optional,
  Repeat,
  Sequence,
  Terminal,
} from "./terms.js";

export function ohm2arbitrary(raw) {
  const grammar = ohm.grammar(raw);

  const rules = new Map();
  for (const [name, rule] of Object.entries(grammar.rules)) {
    const term = processRule(rule);
    rules.set(name, term);
  }

  return rules;
}

function processRule(rule) {
  const term = ohmTermToAbstractTerm(rule.body);
  const constraint = parseConstraint(rule.description);
  return term.withConstraint(constraint);
}

function ohmTermToAbstractTerm(term) {
  switch (true) {
    case term instanceof ohm.pexprs.Alt: {
      return new OneOf(term.terms.map(ohmTermToAbstractTerm));
    }
    case term instanceof ohm.pexprs.Apply: {
      return new Apply(term.ruleName);
    }
    case term instanceof ohm.pexprs.Not: {
      throw new Error("generating a negative lookahead (~) is not supported");
    }
    case term instanceof ohm.pexprs.Opt: {
      return new Optional(ohmTermToAbstractTerm(term.expr));
    }
    case term instanceof ohm.pexprs.Param: {
      throw new Error(
        "generating parameterized rules (ruleName<arg>) is not supported",
      );
    }
    case term instanceof ohm.pexprs.Plus: {
      return new Repeat(ohmTermToAbstractTerm(term.expr), { min: 1 });
    }
    case term instanceof ohm.pexprs.Range: {
      // `term.from.length == 1` and `term.to.length == 1` are enforced by Ohm

      const start = term.from.charCodeAt(0);
      const end = term.to.charCodeAt(0);
      if (start >= end) {
        throw new Error(`Cannot range from '${term.from}' to '${term.to}'`);
      }

      const options = [];
      for (let charCode = start; charCode <= end; charCode++) {
        const character = String.fromCharCode(charCode);
        options[charCode - start] = new Terminal(character);
      }

      return new OneOf(options);
    }
    case term instanceof ohm.pexprs.Seq: {
      if (term.factors.length === 0) {
        return new External(term.source.startIdx);
      }

      return new Sequence(term.factors.map(ohmTermToAbstractTerm));
    }
    case term instanceof ohm.pexprs.Star: {
      return new Repeat(ohmTermToAbstractTerm(term.expr), { min: 0 });
    }
    case term instanceof ohm.pexprs.Terminal: {
      return new Terminal(term.obj);
    }
    default: {
      assert(false, `unknown term: ${term}`);
    }
  }
}

function parseConstraint(raw) {
  switch (true) {
    case /^NOT /.test(raw): {
      const exclude = raw.replace(/^NOT\s+/, "");
      if (!/^"\w+"(,\s*"\w+")*$/.test(exclude)) {
        throw new Error(`invalid 'NOT "a", "b", ...' modifier: '${raw}'`);
      }

      const list = [...exclude.matchAll(/"(\w+)"/g).map((match) => match[1])];
      return new Not(list);
    }
    default: {
      return new None();
    }
  }
}
