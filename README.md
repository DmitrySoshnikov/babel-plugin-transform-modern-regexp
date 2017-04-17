# babel-plugin-transform-modern-regexp

[![Build Status](https://travis-ci.org/DmitrySoshnikov/babel-plugin-transform-modern-regexp.svg?branch=master)](https://travis-ci.org/DmitrySoshnikov/babel-plugin-transform-modern-regexp) [![npm version](https://badge.fury.io/js/babel-plugin-transform-modern-regexp.svg)](https://badge.fury.io/js/babel-plugin-transform-modern-regexp)

Enables modern RegExp features in JavaScript.

### Table of Contents

- [Features](#features)
  - [dotAll s-flag](#dotall-s-flag)
  - [Named capturing groups](#named-capturing-groups)
  - [Extended x-flag](#extended-x-flag)
- [Plugin options](#plugin-options)
  - [`includeRuntime` option](#includeruntime-option)
  - [`features` option](#features-option)
- [Usage](#usage)
  - [Via `.babelrc`](#via-babelrc)
  - [Via CLI](#via-cli)
  - [Via Node.js API](#via-nodejs-api)

## Features

The plugin enables the following features for JS regular expressions:

* "dotAll" `s`-flag (stage 3 proposal)
* Named capturing groups (stage 3 proposal)
* Extended `x`-flag (non-standard)

See also examples in [compat-transpile](https://www.npmjs.com/package/regexp-tree#using-compat-transpiler-api), and [regexp extensions](https://www.npmjs.com/package/regexp-tree#regexp-extensions) secions of [regexp-tree](https://www.npmjs.com/package/regexp-tree).

### dotAll s-flag

By default the `.` symbol matches all symbols _but_ new lines. The "dotAll" `s` flag enables matching `\n` with the `.` symbol:

```js
// Simple.
/./s;

// With unicode `u` flag.
/./su;
```

It is translated into:

```js
// Simple.
/[\0-\uFFFF]/;

// With unicode `u` flag.
/[\0-\u{10FFFF}]/u;
```

### Named capturing groups

See details in the [proposal](https://github.com/tc39/proposal-regexp-named-groups).

Capturing groups in JS regexes until recent supported only numbered-matching.

For example, given `/(\d{4})-(\d{2})-(\d{2})/` that matches a date, one cannot be sure which group corresponds to the month and which one is the day without examining the surrounding code. Also, if one wants to swap the order of the month and the day, the group references should also be updated.

Named capture groups provide a nice solution for these issues.

```js
/(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/
```

To backreference a named group, we can use `\k<name>` notation:

```js
/(?<value>a)\k<value>\1/
```

The above regexp is transalted into:

```js
/(a)\1\1/
```

### Extended x-flag

> Note: `x`-flag is not yet standardized by ES spec. It's a standard flag in PCRE, Python, and other regexes.

Some features, like `x`-flag currently can only be used via `new RegExp(...)` pattern, since are not suppored yet by JavaScript parsers for regexp literals:

```js
new RegExp(`

  # A regular expression for date.

  (?<year>\d{4})-    # year part of a date
  (?<month>\d{2})-   # month part of a date
  (?<day>\d{2})      # day part of a date

`, 'x');
```

Translated into:

```js
new RegExp('(\\d{4})-(\\d{2})-(\\d{2})', '');
```

## Plugin options

The plugin supports the following options.

### `includeRuntime` option

> NOTE: the `includeRuntime` option is not implemented yet. Track [issue #3](https://github.com/DmitrySoshnikov/babel-plugin-transform-modern-regexp/issues/3) for details.

> NOTE: `includeRuntime` is not required: if e.g. named groups are used mostly for readability, the `includeRuntime` can be omitted. If you need to access actual group names on the matched results, the runtime support should be used.

This option enables usage of a supporting runtime for the transformed regexes. The `RegExpTree` class is a thin wrapper on top of a native regexp, and has identical API.

> NOTE: `regexp-tree-runtime` should be in your dependencies list.

E.g. the date expression is translated into:

```js
const RegExpTree = require('regexp-tree-runtime');

...

const re = new RegExpTree(/(\d{4})-(\d{2})-(\d{2})/, {
  flags: 'x',
  source: <original-source>,
  groups: {
    year: 1,
    month: 2,
    day: 3,
  },
});

const result = re.exec('2017-04-17');

// Can access `result.groups`:

console.log(result.groups.year); // 2017
```

### `features` option

This options allows choosing which specific transformations to apply. Available features are:

- `dotAll`
- `namedCapturingGroups`
- `xFlag`

which can be specified as an extra object for the plugin:

```json
{
  "plugins": ["transform-modern-regexp", {
    features: [
      'namedCapturingGroups',
      'xFlag'
    ]
  }]
}
```

> NOTE: if omitted, all features are used by default.

## Usage

### Via `.babelrc`

`.babelrc`

```json
{
  "plugins": ["transform-modern-regexp"]
}
```

### Via CLI

```sh
$ babel --plugins transform-modern-regexp script.js
```

### Via Node.js API

```js
require('babel-core').transform(code, {
  plugins: ['transform-modern-regexp']
});
```
