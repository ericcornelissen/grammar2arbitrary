// SPDX-License-Identifier: MIT-0

import process from "node:process";

const configModule = await import("../.eslint.js");
const configArray = configModule.default;

const all = new Set();
const docs = new Map();
const configured = new Set();

for (const config of configArray) {
  for (const pluginName in config.plugins) {
    const plugin = config.plugins[pluginName];
    for (const ruleName in plugin.rules) {
      const rule = plugin.rules[ruleName];
      if (!rule?.meta?.deprecated) {
        const ruleId = pluginName ? `${pluginName}/${ruleName}` : ruleName;
        all.add(ruleId);

        const documentation = rule?.meta?.docs?.url;
        if (documentation) {
          docs.set(ruleId, documentation);
        }
      }
    }
  }

  for (const ruleId in config.rules) {
    configured.add(ruleId);
  }
}

const unconfigured = all.difference(configured);
if (unconfigured.size > 0) {
  for (const rule of unconfigured) {
    const text = `'${rule}'`;
    const documentation = docs.has(rule)
      ? `(\u001B]8;;${docs.get(rule)}\u001B\\docs\u001B]8;;\u001B\\)`
      : "";
    console.log(text, documentation);
  }
  console.log("");
  console.log(
    unconfigured.size,
    "missing rule(s) found.",
    "Explicitly configure each of them.",
  );

  process.exit(1);
} else {
  console.log("No problems detected");
}
