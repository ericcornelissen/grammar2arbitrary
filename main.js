// SPDX-License-Identifier: Apache-2.0

import * as ohm from "ohm-js";

export function grammer2arbitrary({ baseRules, exportName, raw }) {
  const grammar = ohm.grammar(raw);

  const rules = new Map();
  let firstRule = null;
  for (const [name, rule] of Object.entries(grammar.rules)) {
    const arbitrary = termToArbitrary(rule.body).optimized();
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

  join() {
    return null;
  }

  optimized() {
    return this;
  }

  toString() {
    const identifier = this.#identifier;
    return `tie("${identifier}")`;
  }

  equals(that) {
    return that instanceof Apply && this.#identifier === that.#identifier;
  }
}

export class ConstantFrom {
  #constants;

  constructor(constants) {
    this.#constants = constants;
  }

  join() {
    return null;
  }

  optimized() {
    return this;
  }

  toString() {
    const constants = this.#constants.join('", "');
    return `fc.constantFrom("${constants}")`;
  }

  equals(that) {
    return (
      that instanceof ConstantFrom &&
      this.#constants.length === that.#constants.length &&
      this.#constants.every(
        (constant, index) => constant === that.#constants[index],
      )
    );
  }
}

export class OneOf {
  #options;

  constructor(options) {
    this.#options = options;
  }

  join() {
    return null;
  }

  optimized() {
    if (this.#options.every((option) => option instanceof Terminal)) {
      return new ConstantFrom(this.#options.map((terminal) => terminal.term()));
    }

    return new OneOf(this.#options.map((option) => option.optimized()));
  }

  toString() {
    const options = this.#options.map((option) => option.toString()).join(", ");
    return `fc.oneof(${options})`;
  }

  equals(that) {
    return (
      that instanceof OneOf &&
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

  join() {
    return null;
  }

  optimized() {
    return new Optional(this.#option.optimized());
  }

  toString() {
    const option = this.#option;
    return `fc.option(${option}, { nil: "" })`;
  }

  equals(that) {
    return that instanceof Optional && this.#option.equals(that.#option);
  }
}

export class Repeat {
  #min;
  #subject;

  constructor(subject, { min }) {
    this.#min = min;
    this.#subject = subject;
  }

  join(that) {
    if (that instanceof Repeat && this.#subject.equals(that.#subject)) {
      return new Repeat(this.#subject, { min: this.#min + that.#min });
    } else {
      return null;
    }
  }

  optimized() {
    return new Repeat(this.#subject.optimized(), { min: this.#min });
  }

  toString() {
    const min = this.#min;
    const subject = this.#subject;
    return `fc.array(${subject}, { minLength: ${min} }).map(array => array.join(""))`;
  }

  equals(that) {
    return (
      that instanceof Repeat &&
      this.#min === that.#min &&
      this.#subject.equals(that.#subject)
    );
  }
}

export class Sequence {
  #subjects;

  constructor(subjects) {
    this.#subjects = subjects;
  }

  optimized() {
    if (this.#subjects.length === 1) {
      return this.#subjects[0].optimized();
    }

    const flattened = [];
    for (const subject of this.#subjects) {
      if (subject instanceof Sequence) {
        flattened.push(...subject.#subjects);
      } else {
        flattened.push(subject);
      }
    }

    const subjects = [];

    let [previous, current] = [];
    for (current of flattened) {
      if (previous) {
        const joined = previous.join(current);
        if (joined) {
          current = joined;
        } else {
          subjects.push(previous);
        }
      }

      previous = current;
    }
    subjects.push(current);

    const that = new Sequence(subjects);
    if (this.equals(that)) {
      return this;
    } else {
      return that.optimized();
    }
  }

  toString() {
    const subjects = this.#subjects;
    return `fc.tuple(${subjects.join(", ")}).map(array => array.join(""))`;
  }

  equals(that) {
    return (
      that instanceof Sequence &&
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

  join(that) {
    if (that instanceof Terminal) {
      return new Terminal(this.#term + that.#term);
    } else {
      return null;
    }
  }

  optimized() {
    return this;
  }

  term() {
    return this.#term;
  }

  toString() {
    const term = this.#term
      .replaceAll(/(["\\])/g, "\\$1")
      .replace(/\n/g, "\\n")
      .replace(/\t/g, "\\t");
    return `fc.constant("${term}")`;
  }

  equals(that) {
    return that instanceof Terminal && this.#term === that.#term;
  }
}
