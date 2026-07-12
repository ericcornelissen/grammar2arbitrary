<!-- SPDX-License-Identifier: CC0-1.0 -->

# Ohm Grammer

The [Ohm] language can be used to write grammars that `grammar2arbitrary` can
generate [fast-check] arbitraries for. This document describes how this can be
done and covers limitations and differences with Ohm for parsing.

[fast-check]: https://fast-check.dev/ "fast check"
[ohm]: https://ohmjs.org/

## Defining a Grammar

The following example demonstrates how to use Ohm to specify a grammar from
which a fast-check arbitrary can be generated. See the [Ohm Syntax Reference]
for more information but take note of our [caveats].

```ohm
// Start a grammar
Example {
  // Define a simple rule consisting of terminals.
  BaseRule = "a" | "b" | "c"
  // The resulting arbitrary generating instances of any one of these strings.


  // Rules can be used in other rules.
  Application = BaseRule "-" BaseRule
  // The resulting arbitrary generates strings consisting of two base strings
  // connected by a '-'.


  // Terms can be marked as optional.
  Optional = Application BaseRule?
  // The resulting arbitrary generates strings consisting of an instance of the
  // Application rule, optionally followed by an instance of BaseRule.


  // Terms can be repeated 0-n or 1-n times
  Repeat = BaseRule* | BaseRule+
  // The resulting arbitrary generates strings consisting of either 1) 0-or-more
  // instances of BaseRule, or 2) 1-or-more instances of BaseRule.


  // Alteration with different lengths require case names
  Cases = BaseRule                   -- case1
        | BaseRule Optional          -- case2
        | Application "-" Optional   -- case3
}
```

[ohm syntax reference]: https://ohmjs.org/docs/syntax-reference
[caveats]: #caveats

## Imposing Constraints

[Rule descriptions] can be used to impose additional constraints on the values
that will be generated for a rule. For example, when generating identifiers you
will typically want to avoid generating keywords. This is what the "NOT"
constraint in a rule description can be used for:

```ohm
Example {
  ident (NOT "if", "else", "etc.")
    = letter+

  // ...
}
```

which wich generate any word consisting of one or more letters, but not "if" or
"else" (or etc.).

[rule descriptions]: https://ohmjs.org/docs/syntax-reference#rule-descriptions

## Caveats

- No distinction is made between [Syntactic and Lexical] rules; Whitespace must
  be explicitly encoded in your grammar.
- [Built-in rules] are not supported.
- [Negative lookahead] (`~`) are not supported.
- [Parameterized rules] (`ruleName<arg>`) are not supported.

[negative lookahead]: https://ohmjs.org/docs/syntax-reference#negative-lookahead-
[parameterized rules]: https://ohmjs.org/docs/syntax-reference#parameterized-rules
[built-in rules]: https://ohmjs.org/docs/syntax-reference#built-in-rules
[Syntactic and Lexical]: https://ohmjs.org/docs/syntax-reference#syntactic-lexical
