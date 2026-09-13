// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert";

import { None } from "./constraints.js";
import {
  Apply,
  ConstantFrom,
  OneOf,
  Optional,
  Repeat,
  Sequence,
  Terminal,
} from "./terms.js";

export function optimize(rule) {
  switch (true) {
    case rule instanceof Apply: {
      return rule;
    }
    case rule instanceof ConstantFrom: {
      return rule;
    }
    case rule instanceof OneOf: {
      const constraint = rule.constraint;
      const optimized = rule.options.every((o) => o instanceof Terminal)
        ? new ConstantFrom(rule.options.map((terminal) => terminal.term))
        : new OneOf(rule.options.map((option) => optimize(option)));
      return optimized.withConstraint(constraint);
    }
    case rule instanceof Optional: {
      const constraint = rule.constraint;
      const subject = optimize(rule.option);
      return new Optional(subject).withConstraint(constraint);
    }
    case rule instanceof Repeat: {
      const constraint = rule.constraint;
      const parameters = rule.parameters;
      const subject = optimize(rule.subject);
      return new Repeat(subject, parameters).withConstraint(constraint);
    }
    case rule instanceof Sequence: {
      if (rule.subjects.length === 1) {
        return optimize(rule.subjects[0]);
      }

      const flattened = [];
      for (const subject of rule.subjects) {
        if (subject instanceof Sequence) {
          flattened.push(...subject.subjects);
        } else {
          flattened.push(subject);
        }
      }

      const subjects = [];
      let [previous, current] = [];
      for (current of flattened) {
        if (previous) {
          const merged = merge(previous, current);
          if (merged) {
            current = merged;
          } else {
            subjects.push(previous);
          }
        }

        previous = current;
      }
      subjects.push(current);

      const optimized = new Sequence(subjects);
      if (rule.equals(optimized)) {
        return rule;
      } else {
        return optimize(optimized);
      }
    }
    case rule instanceof Terminal: {
      return rule;
    }
    default:
      assert(false);
  }
}

function merge(a, b) {
  switch (true) {
    case a instanceof Apply: {
      return null;
    }
    case a instanceof ConstantFrom: {
      return null;
    }
    case a instanceof OneOf: {
      return null;
    }
    case a instanceof Optional: {
      return null;
    }
    case a instanceof Repeat: {
      if (b instanceof Repeat && a.subject.equals(b.subject)) {
        const parameters = {
          min: a.parameters.min + b.parameters.min,
        };
        return new Repeat(a.subject, parameters);
      }

      return null;
    }
    case a instanceof Sequence: {
      return null;
    }
    case a instanceof Terminal: {
      if (b instanceof Terminal) {
        return new Terminal(a.term + b.term);
      }

      return null;
    }
    default:
      assert(false);
  }
}
