// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert";

import { None, Not } from "./constraints.js";
import { Apply, OneOf, Optional, Repeat, Sequence, Terminal } from "./terms.js";

export function toArbitrary(rule) {
  const arbitrary = ruleToArbitrary(rule);
  const constraint = constraintToArbitrary(rule.constraint);
  return `${arbitrary}${constraint}`;
}

function ruleToArbitrary(rule) {
  switch (true) {
    case rule instanceof Apply:
      const identifier = rule.identifier;
      return `tie("${identifier}")`;
    case rule instanceof OneOf:
      if (rule.options.every((option) => option instanceof Terminal)) {
        const options = rule.options
          .map((terminal) => terminal.term)
          .join('","');
        return `fc.constantFrom("${options}")`;
      } else {
        const options = rule.options
          .map((option) => toArbitrary(option))
          .join(",");
        return `fc.oneof(${options})`;
      }
    case rule instanceof Optional:
      const option = toArbitrary(rule.option);
      return `fc.option(${option},{nil:""})`;
    case rule instanceof Repeat:
      const { min } = rule.parameters;
      const subject = toArbitrary(rule.subject);
      return `fc.array(${subject},{minLength:${min}}).map(array=>array.join(""))`;
    case rule instanceof Sequence:
      const subjects = rule.subjects
        .map((subject) => toArbitrary(subject))
        .join(",");
      return `fc.tuple(${subjects}).map(array=>array.join(""))`;
    case rule instanceof Terminal:
      const value = rule.term
        .replaceAll(/(["\\])/g, "\\$1")
        .replace(/\n/g, "\\n")
        .replace(/\t/g, "\\t");
      return `fc.constant("${value}")`;
    default:
      assert(false);
  }
}

function constraintToArbitrary(constraint) {
  switch (true) {
    case constraint instanceof None:
      return "";
    case constraint instanceof Not:
      const exclusions = constraint.exclusions;
      const array = `["${exclusions.join('","')}"]`;
      return `.filter(string=>!${array}.includes(string))`;
    default:
      assert(false);
  }
}
