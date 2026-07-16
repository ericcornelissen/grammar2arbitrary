// SPDX-License-Identifier: Apache-2.0

import * as ohm from "ohm-js";

export function grammer2arbitrary({ baseRules, exportName, raw }) {
  const grammar = ohm.grammar(raw);

  const rules = new Map();
  for (const [name, rule] of Object.entries(grammar.rules)) {
    const arbitrary = termToArbitrary(rule.body);
    const modifier = parseModifier(rule.description);
    rules.set(name, `${arbitrary}${modifier}`);
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
      return new OneOf(term.terms.map(termToArbitrary));
    }
    case term instanceof ohm.pexprs.Apply: {
      return new Apply(term.ruleName);
    }
    case term instanceof ohm.pexprs.Not: {
      throw new Error("generating a negative lookahead (~) is not supported");
    }
    case term instanceof ohm.pexprs.Opt: {
      return new Optional(termToArbitrary(term.expr));
    }
    case term instanceof ohm.pexprs.Param: {
      throw new Error(
        "generating parameterized rules (ruleName<arg>) is not supported",
      );
    }
    case term instanceof ohm.pexprs.Plus: {
      return new Repeat(termToArbitrary(term.expr), { min: 1 });
    }
    case term instanceof ohm.pexprs.Seq: {
      return new Sequence(term.factors.map(termToArbitrary));
    }
    case term instanceof ohm.pexprs.Star: {
      return new Repeat(termToArbitrary(term.expr), { min: 0 });
    }
    case term instanceof ohm.pexprs.Terminal: {
      return new Terminal(term.obj);
    }
    default: {
      console.debug(term);
      throw new Error("unknown term");
    }
  }
}

export class Apply {
  #identifier;

  constructor(identifier) {
    this.#identifier = identifier;
  }

  toString() {
    const identifier = this.#identifier;
    return `tie("${identifier}")`;
  }

  equals(that) {
    return this.#identifier === that.#identifier;
  }
}

export class OneOf {
  #options;

  constructor(options) {
    this.#options = options;
  }

  toString() {
    const options = this.#options.map((option) => option.toString()).join(", ");
    return `fc.oneof(${options})`;
  }

  equals(that) {
    return (
      this.#options.length === that.#options.length &&
      this.#options.every((option, index) =>
        option.equals(that.#options[index]),
      )
    );
  }
}

export class Optional {
  #option;

  constructor(option) {
    this.#option = option;
  }

  toString() {
    const option = this.#option;
    return `fc.option(${option}, { nil: "" })`;
  }

  equals(that) {
    return this.#option.equals(that.#option);
  }
}

export class Repeat {
  #min;
  #subject;

  constructor(subject, { min }) {
    this.#min = min;
    this.#subject = subject;
  }

  toString() {
    const min = this.#min;
    const subject = this.#subject;
    return `fc.array(${subject}, { minLength: ${min} }).map(array => array.join(""))`;
  }

  equals(that) {
    return this.#min === that.#min && this.#subject.equals(that.#subject);
  }
}

export class Sequence {
  #subjects;

  constructor(subjects) {
    this.#subjects = subjects;
  }

  toString() {
    const subjects = this.#subjects;
    return `fc.tuple(${subjects.join(", ")}).map(array => array.join(""))`;
  }

  equals(that) {
    return (
      this.#subjects.length === that.#subjects.length &&
      this.#subjects.every((option, index) =>
        option.equals(that.#subjects[index]),
      )
    );
  }
}

export class Terminal {
  #term;

  constructor(term) {
    this.#term = term;
  }

  toString() {
    const term = this.#term;
    return `fc.constant("${term}")`;
  }

  equals(that) {
    return this.#term === that.#term;
  }
}
