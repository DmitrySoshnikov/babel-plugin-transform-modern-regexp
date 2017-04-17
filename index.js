/**
 * The MIT License (MIT)
 * Copyright (c) 2017-present Dmitry Soshnikov <dmitry.soshnikov@gmail.com>
 */

'use strict';

const regexpTree = require('regexp-tree');

/**
 * This plugin applies `compat-transpiler` translation from `regexp-tree`,
 * which enables usage of ES2018+ RegExp features in JavaScript.
 *
 * Note: `x` non-standard flag is currently not supported by Babylon parser
 * in RegExp literals, and `new RegExp(...)` notation should be used.
 *
 * Example:
 *
 *   /
 *     # A regular expression for date.
 *
 *     (?<year>\d{4})-    # year part of a date
 *     (?<month>\d{2})-   # month part of a date
 *     (?<day>\d{2})      # day part of a date
 *
 *   /x
 *
 * Is translated into:
 *
 *   /(\d{4})-(\d{2})-(\d{2})/
 *
 * Note: if `includeRuntime` option is passed, this is transalted into:
 *
 *   const RegExpTree = require('regexp-tree-runtime');
 *
 *   ...
 *
 *   new RegExpTree(/(\d{4})-(\d{2})-(\d{2})/, {
 *     flags: 'x',
 *     source: <original-source>,
 *     groups: {
 *       year: 1,
 *       month: 2,
 *       day: 3,
 *     },
 *   });
 *
 * The `RegExpTree` class is a thin wrapper on top of original regexp, and
 * has identical to native RegExp API (e.g. you can call `exec` method, etc).
 * Matching such regexp enables access to `result.groups.year`, etc.
 *
 * In case of using runtime, it should be included as a dependency in your
 * package.json.
 *
 * If group names are used mostly for readability, `includeRuntime` may be
 * omitted.
 */
module.exports = ({types: t}) => {
  return {
    pre(state) {
      if (state.opts.includeRuntime) {
        throw new Error(`includeRuntime is not implemented yet.`);
      }
    },

    visitor: {

      // Handle `/foo/i`.
      RegExpLiteral({node}, state) {
        Object.assign(node, getTranslatedData(node.extra.raw, state));
      },

      // Handle `new RegExp('foo', 'i')`.
      NewExpression({node}, state) {
        if (!isNewRegExp(node)) {
          return;
        }

        let origPattern;

        if (node.arguments[0].type === 'StringLiteral') {
          origPattern = node.arguments[0].value;
        } else if (node.arguments[0].type === 'TemplateLiteral') {
          origPattern = node.arguments[0].quasis[0].value.cooked;
        }

        let origFlags = '';

        if (node.arguments[1]) {
          if (node.arguments[1].type === 'StringLiteral') {
            origFlags = node.arguments[1].value;
          } else if (node.arguments[1].type === 'TemplateLiteral') {
            origFlags = node.arguments[1].quasis[0].value.cooked;
          }
        }

        const origRe = `/${origPattern}/${origFlags}`;
        const {pattern, flags} = getTranslatedData(origRe, state);

        node.arguments[0] = t.stringLiteral(pattern);
        node.arguments[1] = t.stringLiteral(flags);
      }
    },
  };
};

// Returns transalted pattern, and flags.
function getTranslatedData(regexp, state) {
  let whitelist = undefined;

  if (Array.isArray(state.opts.features) && state.opts.features.length > 0) {
    whitelist = state.opts.features;
  }

  const compat = regexpTree.compatTranspile(regexp, whitelist);

  return {
    pattern: compat.getSource(),
    flags: compat.getFlags(),
  };
}

// Support only string/template literals in
// `new RegExp('string-literal', 'flags')`.
//
// TODO: support variables (rewrite the var contents).
//
function isNewRegExp(node) {
  return (
    node.callee.type === 'Identifier' &&
    node.callee.name === 'RegExp' &&
    node.arguments[0] && (
      node.arguments[0].type === 'StringLiteral' ||
      (node.arguments[0].type === 'TemplateLiteral' &&
       node.arguments[0].expressions.length === 0 &&
       node.arguments[0].quasis.length === 1)
    )
  );
}