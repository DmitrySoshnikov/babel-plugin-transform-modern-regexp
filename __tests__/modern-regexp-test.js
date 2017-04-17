/**
 * The MIT License (MIT)
 * Copyright (c) 2017-present Dmitry Soshnikov <dmitry.soshnikov@gmail.com>
 */

'use strict';

const fs = require('fs');
const path = require('path');
const plugin = require('..');

const {transformFileSync} = require('babel-core');

describe('modern-regexp-test', () => {
  const fixturesDir = path.join(__dirname, 'fixtures');

  fs.readdirSync(fixturesDir).map(caseName => {
    it(caseName, () => {
      const fixtureDir = path.join(fixturesDir, caseName);
      const inputPath = path.join(fixtureDir, 'input.js');

      const actual = transformFileSync(inputPath, {
        'plugins': [
          plugin
        ]
      }).code;

      const expected = fs.readFileSync(
        path.join(fixtureDir, 'expected.js')
      ).toString();

      expect(actual.trim()).toBe(expected.trim());
    });
  });
});