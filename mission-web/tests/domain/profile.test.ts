import { describe, expect, test } from 'vitest';
import { classifyAge } from '../../src/domain/profile';

describe('classifyAge', () => {
  test('blocks a user who is twelve', () => {
    expect(classifyAge({ birthYear: 2014, isAtLeast13: false }, 2026)).toBe('UNDER_13');
  });

  test('requires boundary confirmation for a possible thirteen-year-old', () => {
    expect(classifyAge({ birthYear: 2013, isAtLeast13: false }, 2026)).toBe('UNDER_13');
    expect(classifyAge({ birthYear: 2013, isAtLeast13: true }, 2026)).toBe('TEEN');
  });

  test('accepts ages thirteen through seventeen only', () => {
    expect(classifyAge({ birthYear: 2010, isAtLeast13: true }, 2026)).toBe('TEEN');
    expect(classifyAge({ birthYear: 2008, isAtLeast13: true }, 2026)).toBe('OUT_OF_SCOPE');
  });
});
