// SPDX-License-Identifier: Apache-2.0

import * as ohm from "ohm-js";

export function grammer2arbitrary({ baseRules, exportName, raw }) {
  const grammar = ohm.grammar(raw);

  const rules = new Map();
  let firstRule = null;
  for (const [name, rule] of Object.entries(grammar.rules)) {
    const arbitrary = termToArbitrary(rule.body);
    const modifier = parseModifier(rule.description);
    rules.set(name, `${arbitrary}${modifier}`);
    if (!firstRule && rule.description !== null) {
      firstRule = name;
    }
  }

  if (!baseRules) {
    baseRules = [firstRule];
  }

  if (!baseRules.every((baseRule) => rules.has(baseRule))) {
    throw new Error(`Not all bases are in the grammar.

Available rule(s): ${Array.from(rules.keys()).join(", ")}
Specified base(s): ${baseRules.join(", ")}`);
  }

  return `import * as fc from "fast-check";

var DEFAULT_OPTS = { size: "small" };

export function ${exportName}(opts=DEFAULT_OPTS) {
	var arbitrary = Symbol();
	return fc.letrec((tie) => {
		return {
			[arbitrary]: fc.oneof(
				{ depthSize: opts.size || DEFAULT_OPTS.size },
				${baseRules.map((baseRule) => `tie("${baseRule}")`).join(",\n\t\t\t\t")}
			),
			${Array.from(rules.entries())
        .map(([name, arbitrary]) => `["${name}"]: ${arbitrary}`)
        .join(",\n\t\t\t")}
		};
	})[arbitrary];
}
`;
}

export function parseModifier(raw) {
  switch (true) {
    case /^NOT /.test(raw): {
      const exclude = raw.replace(/^NOT\s+/, "");
      if (!/^"\w+"(,\s*"\w+")*$/.test(exclude)) {
        throw new Error(`invalid 'NOT "a", "b", ...' modifier: '${raw}'`);
      }

      return `.filter(s => ![${exclude}].includes(s))`;
    }
    default: {
      return "";
    }
  }
}

export function termToArbitrary(term) {
  switch (true) {
    case term instanceof ohm.pexprs.Alt: {
      const terms = [];
      for (const t of term.terms) {
        terms.push(termToArbitrary(t));
      }

      return `fc.oneof(${terms.join(", ")})`;
    }
    case term instanceof ohm.pexprs.Apply: {
      return `tie("${term.ruleName}")`;
    }
    case term instanceof ohm.pexprs.Not: {
      throw new Error("generating a negative lookahead (~) is not supported");
    }
    case term instanceof ohm.pexprs.Opt: {
      const arbitrary = termToArbitrary(term.expr);
      return `fc.option(${arbitrary}, { nil: "" })`;
    }
    case term instanceof ohm.pexprs.Param: {
      throw new Error(
        "generating parameterized rules (ruleName<arg>) is not supported",
      );
    }
    case term instanceof ohm.pexprs.Plus: {
      const arbitrary = termToArbitrary(term.expr);
      return `fc.array(${arbitrary}, { minLength: 1 }).map(array => array.join(""))`;
    }
    case term instanceof ohm.pexprs.Seq: {
      const factors = [];
      for (const t of term.factors) {
        factors.push(termToArbitrary(t));
      }

      return factors.length > 1
        ? `fc.tuple(${factors.join(", ")}).map(array => array.join(""))`
        : factors[0];
    }
    case term instanceof ohm.pexprs.Star: {
      const expr = termToArbitrary(term.expr);
      return `fc.array(${expr}, { minLength: 0 }).map(array => array.join(""))`;
    }
    case term instanceof ohm.pexprs.Terminal: {
      return `fc.constant(${term})`;
    }
    default: {
      console.debug(term);
      throw new Error("unknown term");
    }
  }
}
