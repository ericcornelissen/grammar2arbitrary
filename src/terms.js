// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert";

import { Constraint, None } from "./constraints.js";

const secret = Symbol();

class Term {
  #constraint;

  constructor(password) {
    assert(password === secret);

    this.#constraint = new None();
  }

  get constraint() {
    return this.#constraint;
  }

  equals(that) {
    return this.#constraint.equals(that.#constraint);
  }

  join() {
    assert(false, "not implemented");
  }

  optimized() {
    assert(false, "not implemented");
  }

  withConstraint(constraint) {
    assert(constraint instanceof Constraint);

    this.#constraint = constraint;
    return this;
  }
}

export class Apply extends Term {
  #identifier;

  constructor(identifier) {
    super(secret);

    assert(typeof identifier === "string");

    this.#identifier = identifier;
  }

  get identifier() {
    return this.#identifier;
  }

  equals(that) {
    return (
      that instanceof Apply &&
      this.#identifier === that.#identifier &&
      super.equals(that)
    );
  }

  join() {
    return null;
  }

  optimized() {
    return this;
  }
}

export class ConstantFrom extends Term {
  #constants;

  constructor(constants) {
    super(secret);

    assert(Array.isArray(constants));
    assert(constants.length > 0);
    assert(constants.every((constant) => typeof constant === "string"));

    this.#constants = constants;
  }

  get constants() {
    return this.#constants;
  }

  equals(that) {
    return (
      that instanceof ConstantFrom &&
      this.#constants.length === that.#constants.length &&
      this.#constants.every(
        (constant, index) => constant === that.#constants[index],
      ) &&
      super.equals(that)
    );
  }

  join() {
    return null;
  }

  optimized() {
    return this;
  }
}

export class OneOf extends Term {
  #options;

  constructor(options) {
    super(secret);

    assert(Array.isArray(options));
    assert(options.length > 0);
    assert(options.every((option) => option instanceof Term));

    this.#options = options;
  }

  get options() {
    return this.#options;
  }

  equals(that) {
    return (
      that instanceof OneOf &&
      this.#options.length === that.#options.length &&
      this.#options.every((option, index) =>
        option.equals(that.#options[index]),
      ) &&
      super.equals(that)
    );
  }

  join() {
    return null;
  }

  optimized() {
    if (this.#options.every((option) => option instanceof Terminal)) {
      return new ConstantFrom(this.#options.map((terminal) => terminal.term));
    }

    return new OneOf(this.#options.map((option) => option.optimized()));
  }
}

export class Optional extends Term {
  #option;

  constructor(option) {
    super(secret);

    assert(option instanceof Term);

    this.#option = option;
  }

  get option() {
    return this.#option;
  }

  equals(that) {
    return (
      that instanceof Optional &&
      this.#option.equals(that.#option) &&
      super.equals(that)
    );
  }

  join() {
    return null;
  }

  optimized() {
    return new Optional(this.#option.optimized());
  }
}

export class Repeat extends Term {
  #min;
  #subject;

  constructor(subject, { min }) {
    super(secret);

    assert(subject instanceof Term);
    assert(typeof min === "number" && !Number.isNaN(min));

    this.#min = min;
    this.#subject = subject;
  }

  get parameters() {
    return { min: this.#min };
  }

  get subject() {
    return this.#subject;
  }

  equals(that) {
    return (
      that instanceof Repeat &&
      this.#min === that.#min &&
      this.#subject.equals(that.#subject) &&
      super.equals(that)
    );
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
}

export class Sequence extends Term {
  #subjects;

  constructor(subjects) {
    super(secret);

    assert(Array.isArray(subjects));
    assert(subjects.length > 0);
    assert(subjects.every((subject) => subject instanceof Term));

    this.#subjects = subjects;
  }

  get subjects() {
    return this.#subjects;
  }

  equals(that) {
    return (
      that instanceof Sequence &&
      this.#subjects.length === that.#subjects.length &&
      this.#subjects.every((option, index) =>
        option.equals(that.#subjects[index]),
      ) &&
      super.equals(that)
    );
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
}

export class Terminal extends Term {
  #term;

  constructor(term) {
    super(secret);

    assert(typeof term === "string");

    this.#term = term;
  }

  get term() {
    return this.#term;
  }

  equals(that) {
    return (
      that instanceof Terminal &&
      this.#term === that.#term &&
      super.equals(that)
    );
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
}
