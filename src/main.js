// SPDX-License-Identifier: Apache-2.0

import { ohm2arbitrary } from "./ohm.js";

export function grammer2arbitrary({ baseRules, exportName, raw }) {
  const rules = parseGrammar(raw);
  validate({ baseRules, rules });
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

function generateSourceCode({ baseRules, exportName, rules }) {
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
