import { describe, it, expect } from 'vitest';
import { measureParity, scoreCell } from '../../../scripts/lib/parity.mjs';

describe('scoreCell', () => {
  it('scores full, partial, and missing', () => {
    expect(scoreCell('✅ [src](x)')).toBe(1);
    expect(scoreCell('🟡 [src](x)')).toBe(0.5);
    expect(scoreCell('❌')).toBe(0);
    expect(scoreCell('—')).toBe(0);
  });
});

describe('measureParity', () => {
  const map = `| ID | Feature | Ours |
| --- | --- | --- |
| F1 | a | ✅ [src](x) |
| F2 | b | 🟡 [src](x) |
| F3 | c | ❌ |
| note | not a feature | ✅ |
`;

  it('counts only F-prefixed rows and halves partials', () => {
    expect(measureParity(map)).toEqual({ rows: 3, supported: 1, partial: 1, percent: 50 });
  });

  it('returns null for an empty map', () => {
    expect(measureParity('# empty')).toBeNull();
  });
});
