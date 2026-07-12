#!/usr/bin/env node

// SPDX-License-Identifier: Apache-2.0

import { readFileSync, writeFileSync } from "node:fs";
import { argv, exit, versions } from "node:process";
import { parseArgs } from "node:util";

import * as ohm from "ohm-js";

import manifest from "./package.json" with { type: "json" };

/* --- Args ----------------------------------------------------------------- */

const args = parseArgs({
  args: argv[0].endsWith("node") ? argv.slice(2) : argv.slice(1),
  options: {
    base: { type: "string", short: "b", multiple: true },
    export: { type: "string", short: "e" },
    help: { type: "boolean" },
    inFile: { type: "string", short: "i" },
    outFile: { type: "string", short: "o" },
    version: { type: "boolean" },
  },
  strict: true,
  allowPositionals: false,
  allowNegative: false,
  tokens: false,
});

const {
  base,
  export: exportName,
  help,
  inFile,
  outFile,
  version,
} = args.values;

if (version) {
  console.log(`grammar2arbitrary : v${manifest.version}`);
  console.log(`Node.js           : v${versions.node}`);
  exit(0);
}

if (help || !base || !exportName || !inFile || !outFile) {
  console.log(`grammar2arbitrary [--help] [--version] --base NAME
  --export NAME --inFile FILE.ohm --outFile FILE.js

Summary:
  Generate fast-check arbitraries from a grammar.

Flags:
  --help                Output this help message.
  --base <name>         The grammar identifier to start generation from.
  --export <name>       The name of the exported arbitrary.
  --inFile <file>       The grammar file to read from.
  --outFile <file>      The JavaScript file to write to.
  --version             Output version information.

Need more help? Found a bug? Missing something? See:
https://github.com/ericcornelissen/grammar2arbitrary`);
  exit(help ? 0 : 1);
}

/* --- Main ----------------------------------------------------------------- */

const raw = readFileSync(inFile, "utf-8");
const grammar = ohm.grammar(raw);

const rules = new Map();
for (const [name, rule] of Object.entries(grammar.rules)) {
  const arbitrary = termToArbitrary(rule.body);
  const modifier = parseModifier(rule.description);
  rules.set(name, `${arbitrary}${modifier}`);
}

if (!base.every((name) => rules.has(name))) {
  console.log(`Not all bases are in the grammar.

Available rule(s): ${Array.from(rules.keys()).join(", ")}
Specified base(s): ${base.join(", ")}`);
  exit(1);
}

const script = `// Generated with ${manifest.name}@${manifest.version}

import * as fc from "fast-check";

var DEFAULT_OPTS = { size: "small" };

export function ${exportName}(opts=DEFAULT_OPTS) {
	var arbitrary = Symbol();
	return fc.letrec((tie) => {
		return {
			[arbitrary]: fc.oneof(
				{ depthSize: opts.size || DEFAULT_OPTS.size },
				${base.map((name) => `tie("${name}")`).join(",\n\t\t\t\t")}
			),
			${Array.from(rules.entries())
        .map(([name, arbitrary]) => `["${name}"]: ${arbitrary}`)
        .join(",\n\t\t\t")}
		};
	})[arbitrary];
}
`;

writeFileSync(outFile, script);
exit(0);

/* --- Helpers -------------------------------------------------------------- */

function parseModifier(raw) {
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

function termToArbitrary(term) {
  switch (true) {
    case term instanceof ohm.pexprs.Alt: {
      const terms = [];
      for (const t of term.terms) {
        terms.push(termToArbitrary(t));
      }

      return `fc.oneof(${terms})`;
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
        ? `fc.tuple(${factors.join(",")}).map(a => a.join(""))`
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
