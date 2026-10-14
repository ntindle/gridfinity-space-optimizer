import { describe, it, expect } from 'vitest';
import { Linter } from 'eslint';
import rule from './no-comments.js';

const linter = new Linter();
linter.defineRule('no-comments', rule);
linter.defineRule('react-refresh/only-export-components', { create: () => ({}) });
linter.defineRule('react-hooks/exhaustive-deps', { create: () => ({}) });
linter.defineRule('@typescript-eslint/no-unused-vars', { create: () => ({}) });

const config = {
  parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
  rules: { 'no-comments': 'error' },
};

const errorCount = (code) => linter.verify(code, config).length;
const noCommentCount = (code) =>
  linter.verify(code, config).filter((m) => m.ruleId === 'no-comments').length;

describe('no-comments rule', () => {
  it('allows real eslint directives', () => {
    expect(errorCount('// eslint-disable-next-line react-refresh/only-export-components\nconst x = 1;')).toBe(0);
    expect(errorCount('const x = 1; // eslint-disable-line react-hooks/exhaustive-deps')).toBe(0);
    expect(errorCount('/* eslint-disable no-console */\nconst x = 1;')).toBe(0);
    expect(errorCount('/* global foo, bar */\nconst x = 1;')).toBe(0);
    expect(errorCount('/* global foo: readonly */\nconst x = 1;')).toBe(0);
    expect(errorCount('/* exported foo */\nconst x = 1;')).toBe(0);
    expect(errorCount('/* eslint-env node */\nconst x = 1;')).toBe(0);
  });

  it('allows real TypeScript directives', () => {
    expect(errorCount('// @ts-ignore\nconst x = 1;')).toBe(0);
    expect(errorCount('// @ts-expect-error\nconst x = 1;')).toBe(0);
    expect(errorCount('// @ts-check\nconst x = 1;')).toBe(0);
    expect(errorCount('// @ts-nocheck\nconst x = 1;')).toBe(0);
  });

  it('allows license headers only in the leading block', () => {
    expect(errorCount('// Copyright (c) 2026 Example\nconst x = 1;')).toBe(0);
    expect(errorCount('/*\n * Copyright (c) 2026 Example\n * All rights reserved.\n */\nconst x = 1;')).toBe(0);
    expect(errorCount('// SPDX-License-Identifier: MIT\nconst x = 1;')).toBe(0);
    expect(errorCount('// License: MIT\nconst x = 1;')).toBe(0);
    expect(errorCount('const x = 1;\n// Copyright (c) 2026 Example')).toBe(1);
    expect(errorCount('const x = 1;\n// License: MIT')).toBe(1);
  });

  it('allows JSDoc type tags', () => {
    expect(errorCount("/** @type {import('tailwindcss').Config} */\nconst x = {};")).toBe(0);
    expect(errorCount('/**\n * @param {number} x\n * @returns {number}\n */\nfunction f(x) { return x; }')).toBe(0);
    expect(errorCount('/**\n * @typedef {Object} Foo\n * @property {string} bar\n */\nconst x = 1;')).toBe(0);
  });

  it('allows vitest environment and triple-slash references', () => {
    expect(errorCount('/**\n * @vitest-environment jsdom\n */\nconst x = 1;')).toBe(0);
    expect(errorCount('/// <reference path="./foo.d.ts" />\nconst x = 1;')).toBe(0);
  });

  it('rejects trailing prose after type-only JSDoc tags', () => {
    expect(errorCount('/** @type {number} HACK do not touch this fragile workaround */\nconst x = 1;')).toBe(1);
    expect(errorCount('/** @satisfies {Foo} TODO fix this later it is broken */\nconst x = 1;')).toBe(1);
    expect(errorCount('/**\n * @type {number} HACK do not touch\n */\nconst x = 1;')).toBe(1);
    expect(errorCount('/** @type {Foo Bar} */\nconst x = 1;')).toBe(1);
    expect(errorCount('/** @type {Foo} | Bar */\nconst x = 1;')).toBe(1);
    expect(errorCount('/** @type {Foo} */\nconst x = 1;')).toBe(0);
    expect(errorCount('/** @type {Foo | Bar} */\nconst x = 1;')).toBe(0);
    expect(errorCount('/** @type {{ a: string; b: number }} */\nconst x = 1;')).toBe(0);
    expect(errorCount('/** @type {Foo<Bar>} */\nconst x = 1;')).toBe(0);
    expect(errorCount('/** @param {number} x - a description is standard JSDoc */\nfunction f(x) { return x; }')).toBe(0);
  });

  it('rejects operator-per-word prose in JSDoc continuations', () => {
    expect(errorCount('/**\n * @param {number} x\n * This: is: a: long: prose: explanation: of: the: hack:\n */\nfunction f(x) { return x; }')).toBe(1);
    expect(errorCount('/**\n * @param {number} x\n * Do, not, touch, this, fragile, hack,\n */\nfunction f(x) { return x; }')).toBe(1);
    expect(errorCount('/**\n * @param {number} x\n * Do | not | touch | this | hack\n */\nfunction f(x) { return x; }')).toBe(1);
    expect(errorCount("/**\n * @type {import('foo').Bar |\n * Baz}\n */\nconst x = 1;")).toBe(0);
    expect(errorCount('/**\n * @type {{\n * a: string;\n * b: number;\n * }}\n */\nconst x = 1;')).toBe(0);
    expect(errorCount("/**\n * @param {import('foo').Bar |\n * Baz} x\n */\nfunction f(x) { return x; }")).toBe(0);
    expect(errorCount('/**\n * @type {Foo\n * | Bar}\n */\nconst x = 1;')).toBe(0);
    expect(errorCount('/**\n * @type {Foo\n * | Bar} tail\n */\nconst x = 1;')).toBe(1);
  });

  it('rejects prose lines inside license blocks', () => {
    expect(errorCount('/* Copyright (c) 2026 X\nTODO: this is a fragile hack do not touch\nFIXME: rewrite this later\n*/\nconst x = 1;')).toBe(1);
    expect(errorCount('/* License: MIT\nTODO: this is a fragile hack\n*/\nconst x = 1;')).toBe(1);
    expect(errorCount('/* SPDX-License-Identifier: MIT\nSome prose about the hack\n*/\nconst x = 1;')).toBe(1);
    expect(errorCount('// SPDX-License-Identifier: MIT and stuff\nconst x = 1;')).toBe(1);
    expect(errorCount('// License: do not touch this\nconst x = 1;')).toBe(1);
    expect(errorCount('// copyright: do not touch this, it is fragile\nconst x = 1;')).toBe(1);
    expect(errorCount('/*\n * Copyright (c) 2026 Example\n * All rights reserved.\n */\nconst x = 1;')).toBe(0);
    expect(errorCount('// SPDX-License-Identifier: MIT\nconst x = 1;')).toBe(0);
    expect(errorCount('// SPDX-License-Identifier: MIT OR Apache-2.0\nconst x = 1;')).toBe(0);
  });

  it('rejects prose after block ts-ignore and expect-error directives', () => {
    expect(errorCount('/* @ts-ignore\nDo not touch this fragile hack */\nconst x = 1;')).toBe(1);
    expect(errorCount('/* @ts-expect-error\nDo not touch this fragile hack */\nconst x = 1;')).toBe(1);
    expect(errorCount('// @ts-ignore a reason on the same line\nconst x = 1;')).toBe(0);
    expect(errorCount('/* @ts-ignore */\nconst x = 1;')).toBe(0);
  });

  it('rejects prose on the next line of block eslint directives', () => {
    expect(errorCount('/* eslint-disable\nno-console */\nconst x = 1;')).toBe(1);
    expect(noCommentCount('/* eslint-disable no-console\nprose */\nconst x = 1;')).toBe(1);
    expect(errorCount('/* eslint-env node\nprose */\nconst x = 1;')).toBe(1);
    expect(noCommentCount('/* eslint no-console: 0\nprose */\nconst x = 1;')).toBe(1);
    expect(errorCount('/* eslint-disable no-console -- a reason */\nconst x = 1;')).toBe(0);
  });

  it('rejects prose before the type group on descriptive tags', () => {
    expect(errorCount('/** @param do not touch this fragile hack {number} x */\nconst x = 1;')).toBe(1);
    expect(errorCount('/** @returns do not touch this hack {!!!} x */\nconst x = 1;')).toBe(1);
    expect(errorCount('/** @typedef do not touch this hack {Foo} */\nconst x = 1;')).toBe(1);
    expect(errorCount('/** @param x - use {Foo} for this */\nconst x = 1;')).toBe(0);
    expect(errorCount('/** @param {number} x */\nfunction f(x) { return x; }')).toBe(0);
  });

  it('rejects separator-glued prose inside type groups', () => {
    expect(errorCount('/** @type {Do-not-touch-this-hack} */\nconst x = 1;')).toBe(1);
    expect(errorCount('/** @type {Do + not + touch + this + hack} */\nconst x = 1;')).toBe(1);
    expect(errorCount('/** @type {Do = not = touch = this + hack} */\nconst x = 1;')).toBe(1);
    expect(errorCount('/** @type {Do, not, touch, this, hack} */\nconst x = 1;')).toBe(1);
    expect(errorCount('/** @type {Do; not; touch; this; hack} */\nconst x = 1;')).toBe(1);
    expect(errorCount('/** @type {Do / not / touch / this / hack} */\nconst x = 1;')).toBe(1);
    expect(errorCount('/** @type {Do * not * touch} */\nconst x = 1;')).toBe(1);
    expect(errorCount('/** @type {*} */\nconst x = 1;')).toBe(0);
    expect(errorCount('/** @type {(a: string, b: number) => void} */\nconst x = 1;')).toBe(0);
    expect(errorCount('/** @type {Foo<T = Bar>} */\nconst x = 1;')).toBe(0);
    expect(errorCount('/** @type {-readonly [K in T]: U} */\nconst x = 1;')).toBe(0);
    expect(errorCount('/** @type {[string, number]} */\nconst x = 1;')).toBe(0);
    expect(errorCount('/** @type {a: string, b: number} */\nconst x = 1;')).toBe(0);
  });

  it('rejects prose appended to license lines', () => {
    expect(errorCount('// Copyright (c) 2026 Example do not touch this fragile hack\nconst x = 1;')).toBe(1);
    expect(errorCount('// Licensed under MIT do not touch this hack\nconst x = 1;')).toBe(1);
    expect(errorCount('// MIT License do not touch this hack\nconst x = 1;')).toBe(1);
    expect(errorCount('// Copyright (c) 2026 Example\nconst x = 1;')).toBe(0);
    expect(errorCount('// Licensed under the MIT License\nconst x = 1;')).toBe(0);
    expect(errorCount('// Licensed under the Apache License, Version 2.0\nconst x = 1;')).toBe(0);
  });

  it('allows a verbatim MIT license block', () => {
    const mit = '/*\n * MIT License\n *\n * Copyright (c) 2026 Example Corp\n *\n * Permission is hereby granted, free of charge, to any person obtaining a copy\n * of this software and associated documentation files (the "Software"), to deal\n * in the Software without restriction, including without limitation the rights\n * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n * copies of the Software, and to permit persons to whom the Software is\n * furnished to do so, subject to the following conditions:\n *\n * The above copyright notice and this permission notice shall be included in all\n * copies or substantial portions of the Software.\n *\n * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\n * SOFTWARE.\n */\nconst x = 1;';
    expect(errorCount(mit)).toBe(0);
    expect(errorCount(mit.replace('SOFTWARE.', 'SOFTWARE. Do not touch this hack.'))).toBe(1);
  });

  it('rejects malformed global and exported declarations', () => {
    expect(noCommentCount('/* global foo: bogus */\nconst x = 1;')).toBe(1);
    expect(noCommentCount('/* global foo, */\nconst x = 1;')).toBe(1);
    expect(noCommentCount('/* global */\nconst x = 1;')).toBe(1);
    expect(noCommentCount('/* global foo bar */\nconst x = 1;')).toBe(1);
    expect(noCommentCount('/* exported foo, */\nconst x = 1;')).toBe(1);
    expect(noCommentCount('/* exported foo bar */\nconst x = 1;')).toBe(1);
    expect(errorCount('/* global foo: readonly, bar: writable */\nconst x = 1;')).toBe(0);
    expect(errorCount('/* exported foo, bar */\nconst x = 1;')).toBe(0);
  });

  it('parses long global declaration lists in linear time', () => {
    const longValid = `/* global ${Array.from({ length: 200 }, () => '$').join(', ')} */\nconst x = 1;`;
    const validStart = Date.now();
    expect(errorCount(longValid)).toBe(0);
    expect(Date.now() - validStart).toBeLessThan(1000);
    const longInvalid = `/* global ${Array.from({ length: 200 }, () => '$').join(', ')} garbage */\nconst x = 1;`;
    const invalidStart = Date.now();
    expect(noCommentCount(longInvalid)).toBe(1);
    expect(Date.now() - invalidStart).toBeLessThan(1000);
  });

  it('rejects inline eslint config with trailing prose', () => {
    const prose = linter.verify('/* eslint no-console: 0 this is a whole paragraph of prose */\nconst x = 1;', config);
    expect(prose.filter((m) => m.ruleId === 'no-comments')).toHaveLength(1);
    expect(errorCount('/* eslint no-console: 0, no-alert: 2 */\nconst x = 1;')).toBe(0);
    expect(errorCount('/* eslint no-console: [2, {allow: ["warn"]}] */\nconst x = 1;')).toBe(0);
  });

  it('rejects malformed triple-slash references', () => {
    expect(errorCount('/// <reference path="./foo.d.ts" /> and now my essay\nconst x = 1;')).toBe(1);
    expect(errorCount('/// <reference path=hello world\nconst x = 1;')).toBe(1);
    expect(errorCount('/// <reference types="node" />\nconst x = 1;')).toBe(0);
  });

  it('rejects tag-prefixed prose outside JSDoc blocks', () => {
    expect(errorCount('// @param x this is a prose comment about the hack\nconst x = 1;')).toBe(1);
    expect(errorCount('// @type {number} TODO fix this\nconst x = 1;')).toBe(1);
    expect(errorCount('/* @type {number} prose */\nconst x = 1;')).toBe(1);
  });

  it('rejects prose continuation lines inside JSDoc blocks', () => {
    expect(errorCount('/**\n * @param {number} x\n * Note: this is fragile do not touch it\n */\nfunction f(x) { return x; }')).toBe(1);
    expect(errorCount('/**\n * @param {number} x\n * (this is prose in parens)\n */\nfunction f(x) { return x; }')).toBe(1);
    expect(errorCount('/**\n * @param {number} x\n * Why does this exist?\n */\nfunction f(x) { return x; }')).toBe(1);
    expect(errorCount('/**\n * @param {number} x\n * foo = bar baz\n */\nfunction f(x) { return x; }')).toBe(1);
  });

  it('allows multi-line type fragments inside JSDoc blocks', () => {
    expect(errorCount("/**\n * @type {import('foo').Bar |\n *   Baz}\n */\nconst x = 1;")).toBe(0);
    expect(errorCount('/**\n * @type {{\n *   a: string;\n *   b: number;\n * }}\n */\nconst x = 1;')).toBe(0);
  });

  it('rejects word-prefix bypasses', () => {
    expect(errorCount('// eslint is great\nconst x = 1;')).toBe(1);
    expect(errorCount('// global state is messy\nconst x = 1;')).toBe(1);
    expect(errorCount('const x = 1;\n// copyright: do not touch this, it is fragile')).toBe(1);
    expect(errorCount('// @ts-check out this hack\nconst x = 1;')).toBe(1);
    expect(errorCount('// @preserve do not delete this comment\nconst x = 1;')).toBe(1);
    expect(errorCount('const x = 1;\n// @ts-check')).toBe(1);
    expect(errorCount('const x = 1;\n// @ts-nocheck')).toBe(1);
  });

  it('rejects plain comments and prose JSDoc', () => {
    expect(errorCount('// just a regular comment\nconst x = 1;')).toBe(1);
    expect(errorCount('/**\n * Does something useful\n * @param {number} x\n */\nfunction f(x) { return x; }')).toBe(1);
    expect(errorCount('const x = 1; // trailing note')).toBe(1);
  });

  it('fixes a trailing comment', () => {
    const result = linter.verifyAndFix('const x = 1; // hello\n', config);
    expect(result.fixed).toBe(true);
    expect(result.output).toBe('const x = 1;\n');
  });

  it('fixes an inline comment without joining identifiers', () => {
    const result = linter.verifyAndFix('const x = typeof/*c*/y;\n', config);
    expect(result.fixed).toBe(true);
    expect(result.output).toBe('const x = typeof y;\n');
  });

  it('fixes a comment-only JSX container', () => {
    const result = linter.verifyAndFix('const el = <div>{/* hi */}</div>;\n', config);
    expect(result.fixed).toBe(true);
    expect(result.output).toBe('const el = <div></div>;\n');
  });
});
