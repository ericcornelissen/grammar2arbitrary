#!/usr/bin/env node

// SPDX-License-Identifier: Apache-2.0

import console from "node:console";
import { readFileSync, writeFileSync } from "node:fs";
import { argv, exit, versions } from "node:process";
import { parseArgs } from "node:util";

import { grammer2arbitrary } from "./main.js";
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
  base: baseRules,
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

if (help || !baseRules || !exportName || !inFile || !outFile) {
  console.log(`grammar2arbitrary [--help] [--version] --base NAME
  --export NAME --inFile FILE.ohm --outFile FILE.js

Summary:
  Generate fast-check arbitraries from a grammar.

Flags:
  --help                Output this help message.
  --base <name>         The grammar rule to start generation from. Can be repeated.
  --export <name>       The name of the exported arbitrary.
  --inFile <file>       The grammar file to read from.
  --outFile <file>      The JavaScript file to write to.
  --version             Output version information.

Need more help? Found a bug? Missing something? See:
https://github.com/ericcornelissen/grammar2arbitrary`);
  exit(help ? 0 : 1);
}

/* --- Main ----------------------------------------------------------------- */

try {
  const raw = readFileSync(inFile, "utf-8");
  const arbitrary = grammer2arbitrary({ raw, exportName, baseRules });
  const out = `// Generated with ${manifest.name}@${manifest.version}

${arbitrary}`;
  writeFileSync(outFile, out);
  exit(0);
} catch (error) {
  console.error(error);
  exit(1);
}
