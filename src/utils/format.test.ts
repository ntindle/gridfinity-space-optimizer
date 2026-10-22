import { describe, it, expect } from 'vitest';
import {
  drawerSizeMm,
  formatDrawerSize,
  formatLength,
  formatSize,
  parseDecimal,
  pluralize,
} from './format';

describe('format', () => {
  it('formats a millimetre length in either unit', () => {
    expect(formatLength(252, true)).toBe('252 mm');
    expect(formatLength(252, false)).toBe('9.92 in');
    expect(formatLength(25.55, true)).toBe('25.6 mm');
  });

  it('formats a size pair with one trailing unit', () => {
    expect(formatSize(252, 21, true)).toBe('252 × 21 mm');
    expect(formatSize(252, 21, false)).toBe('9.92 × 0.83 in');
  });

  it('converts and formats a drawer size stored in inches', () => {
    expect(drawerSizeMm({ width: 22.5, height: 16.5 })).toEqual({ width: 571.5, height: 419.1 });
    expect(formatDrawerSize({ width: 22.5, height: 16.5 }, false)).toBe('22.5 × 16.5 in');
    expect(formatDrawerSize({ width: 22.5, height: 16.5 }, true)).toBe('571.5 × 419.1 mm');
  });

  it('pluralizes by count', () => {
    expect(pluralize(1, 'label')).toBe('1 label');
    expect(pluralize(0, 'label')).toBe('0 labels');
    expect(pluralize(6, 'label')).toBe('6 labels');
    expect(pluralize(3000, 'label')).toBe('3,000 labels');
  });

  it('parses decimal input with a comma or a dot', () => {
    expect(parseDecimal('22,5')).toBe(22.5);
    expect(parseDecimal(' 22.5 ')).toBe(22.5);
    expect(parseDecimal('400')).toBe(400);
    expect(parseDecimal('22.5 in')).toBe(22.5);
    expect(parseDecimal('571,5')).toBe(571.5);
    expect(parseDecimal('0,125')).toBe(0.125);
    expect(parseDecimal('1,200')).toBe(1200);
    expect(parseDecimal('1,234.5')).toBe(1234.5);
    expect(parseDecimal('abc')).toBeNaN();
    expect(parseDecimal('')).toBeNaN();
  });
});
