import { describe, expect, it } from 'vitest';
import { levelForXp, validateAllocation, xpRequiredForLevel } from '../../src/domain/progression';

describe('progression', () => {
  it.each([[1, 0], [2, 100], [3, 300], [4, 600], [5, 1000]])(
    'requires the approved cumulative XP for level %i',
    (level, xp) => expect(xpRequiredForLevel(level)).toBe(xp),
  );

  it.each([[0, 1], [99, 1], [100, 2], [299, 2], [300, 3]])(
    'maps %i XP to level %i',
    (xp, level) => expect(levelForXp(xp)).toBe(level),
  );

  it('accepts an exact mixed ability allocation', () => {
    expect(validateAllocation(25, { youtube: 15, vibeCoding: 10, business: 0 })).toEqual({ ok: true });
  });

  it('rejects allocations that do not equal the declared reward', () => {
    expect(validateAllocation(25, { youtube: 10, vibeCoding: 10, business: 0 })).toEqual({
      ok: false,
      code: 'ALLOCATION_TOTAL_MISMATCH',
    });
  });
});
