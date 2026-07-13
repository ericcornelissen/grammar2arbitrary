<!-- SPDX-License-Identifier: CC0-1.0 -->

# grammar2arbitrary

Generate [fast-check] arbitraries from a grammar

[fast-check]: https://fast-check.dev/ "fast check"

## Installation

```shell
npm install --save-dev @ericcornelissen/grammar2arbitrary
```

## Usage

Put a [grammar] to generate form in a file and invoke `grammar2arbitrary`

```shell
grammar2arbitrary --inFile grammar.ohm --outFile dist.js --base Bar --export foo
```

For more information

```shell
grammar2arbitrary --help
```

[grammar]: #grammars

## Grammars

The only supported grammer is [Ohm], read more in [our Ohm docs].

[ohm]: https://ohmjs.org/
[our ohm docs]: ./docs/ohm.md

## License

The source code is licensed under the `Apache-2.0` license, see [LICENSE] for
the full license text.

[license]: ./LICENSE
