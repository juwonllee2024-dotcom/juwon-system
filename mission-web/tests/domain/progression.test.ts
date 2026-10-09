import { expect, test } from 'vitest';
import { levelForXp } from '../../src/domain/progression';

test.each([[0, 1], [99, 1], [100, 2], [299, 2], [300, 3]])('maps %i XP to level %i', (xp, level) => {
  expect(levelForXp(xp)).toBe(level);
});
