// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert";

const secret = Symbol();

export class Constraint {
  constructor(password) {
    assert(password === secret);
  }

  equals() {
    return true;
  }
}

export class None extends Constraint {
  constructor() {
    super(secret);

    assert(arguments.length === 0);
  }

  equals(that) {
    return that instanceof None && super.equals(that);
  }
}

export class Not extends Constraint {
  #exclusions;

  constructor(exclusions) {
    super(secret);

    assert(Array.isArray(exclusions));
    assert(exclusions.length > 0);
    assert(exclusions.every((exclusion) => typeof exclusion === "string"));

    this.#exclusions = exclusions;
  }

  get exclusions() {
    return this.#exclusions;
  }

  equals(that) {
    return (
      that instanceof Not &&
      this.#exclusions.length === that.#exclusions.length &&
      this.#exclusions.every(
        (exclusion, index) => exclusion === that.#exclusions[index],
      ) &&
      super.equals(that)
    );
  }
}
