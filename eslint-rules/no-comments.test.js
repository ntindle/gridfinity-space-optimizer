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
