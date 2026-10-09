import type { XpAllocation } from './types';

export function xpRequiredForLevel(level: number): number {
  if (!Number.isInteger(level) || level < 1) throw new RangeError('level must be a positive integer');
  return 50 * (level - 1) * level;
}

export function levelForXp(xp: number): number {
  if (!Number.isInteger(xp) || xp < 0) throw new RangeError('xp must be a non-negative integer');
  let level = 1;
  while (xpRequiredForLevel(level + 1) <= xp) level += 1;
  return level;
}

export function validateAllocation(rewardXp: number, allocation: XpAllocation) {
  const values = Object.values(allocation);
  if (!Number.isInteger(rewardXp) || rewardXp < 0 || values.some((value) => !Number.isInteger(value) || value < 0)) {
    return { ok: false as const, code: 'ALLOCATION_INVALID' };
  }
  return values.reduce((sum, value) => sum + value, 0) === rewardXp
    ? { ok: true as const }
    : { ok: false as const, code: 'ALLOCATION_TOTAL_MISMATCH' };
}
