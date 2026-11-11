// SPDX-License-Identifier: Apache-2.0

import { toArbitrary } from "./arbitraries.js";
import { ohm2arbitrary } from "./ohm.js";
import { optimize } from "./optimize.js";
import { External } from "./terms.js";

export function grammer2arbitrary({ baseRules, exportName, raw }) {
  const rules = parseGrammar(raw);
  validate({ baseRules, rules });
  optimizeRules(rules);
  const code = generateSourceCode({ baseRules, exportName, rules });
  return code;
}

function parseGrammar(raw) {
  return ohm2arbitrary(raw);
}

function validate({ baseRules, rules }) {
  if (!baseRules.every((baseRule) => rules.has(baseRule))) {
    throw new Error(`Not all bases are in the grammar.

Available rule(s): ${Array.from(rules.keys()).join(", ")}
Specified base(s): ${baseRules.join(", ")}`);
  }
}

function optimizeRules(rules) {
  for (const [name, rule] of rules.entries()) {
    const optimized = optimize(rule);
    rules.set(name, optimized);
  }
}

function generateSourceCode({ baseRules, exportName, rules }) {
  const internalRules = Array.from(rules.entries()).filter(
    ([, rule]) => !(rule instanceof External),
  );
  const externalRules = Array.from(rules.entries()).filter(
    ([, rule]) => rule instanceof External,
  );

  const bases = baseRules.map((baseRule) => `tie("${baseRule}")`);
  const internals = internalRules
    .map(([name, rule]) => [name, toArbitrary(rule)])
    .map(([name, arbitrary]) => `["${name}"]: ${arbitrary}`);
  const externals = externalRules.map(
    ([name, rule]) => `["${name}"]: ext[${rule.identifier}]`,
  );
  const externalMap = externalRules.map(
    ([name, rule]) => `[${rule.identifier}]: externals["${name}"]`,
  );

  const arbitrary =
    externalRules.length > 0
      ? `export function ${exportName}(opts=DEFAULT_OPTS, externals) {
	var ext = {
		${externalMap.join(",\n\t\t")}
	};
	return fc.letrec((tie) => {
		return {
			[arbitrary]: fc.oneof(
				{ depthSize: opts.size || DEFAULT_OPTS.size },
				${bases.join(",\n\t\t\t\t")}
			),
			${internals.join(",\n\t\t\t")},
			${externals.join(",\n\t\t\t")}
		};
	})[arbitrary];
}`
      : `export function ${exportName}(opts=DEFAULT_OPTS) {
	return fc.letrec((tie) => {
		return {
			[arbitrary]: fc.oneof(
				{ depthSize: opts.size || DEFAULT_OPTS.size },
				${bases.join(",\n\t\t\t\t")}
			),
			${internals.join(",\n\t\t\t")}
		};
	})[arbitrary];
}`;

  return `import * as fc from "fast-check";

var DEFAULT_OPTS = { size: "small" };
var arbitrary = Symbol();

${arbitrary}
`;
}
