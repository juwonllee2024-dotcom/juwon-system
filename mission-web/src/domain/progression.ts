export function levelForXp(xp: number): number {
  let level = 1;
  while (50 * level * (level + 1) <= xp) level += 1;
  return level;
}

export interface ProgressDto {
  totalXp: number;
  playerLevel: number;
  abilities: { focus: number; knowledge: number; execution: number };
  lastAwardXp: number;
  newAward: boolean;
}
