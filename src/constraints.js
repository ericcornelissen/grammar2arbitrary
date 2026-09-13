// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert";

export class Constraint {
  equals() {
    assert(false, "not implemented");
  }

  toString() {
    assert(false, "not implemented");
  }
}

export class None extends Constraint {
  constructor() {
    super();

    assert(arguments.length === 0);
  }

  equals(that) {
    return that instanceof None;
  }

  toString() {
    return "";
  }
}

export class Not extends Constraint {
  #exclusions;

  constructor(exclusions) {
    super();

    assert(Array.isArray(exclusions));
    assert(exclusions.length > 0);
    assert(exclusions.every((exclusion) => typeof exclusion === "string"));

    this.#exclusions = exclusions;
  }

  equals(that) {
    return (
      that instanceof Not &&
      this.#exclusions.length === that.#exclusions.length &&
      this.#exclusions.every(
        (exclusion, index) => exclusion === that.#exclusions[index],
      )
    );
  }

  toString() {
    const exclusions = this.#exclusions;
    const array = `["${exclusions.join('", "')}"]`;
    return `.filter(string => !${array}.includes(string))`;
  }
}
