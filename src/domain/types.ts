export type Ability = 'youtube' | 'vibeCoding' | 'business';
export type ProjectState = 'LOCKED' | 'ACTIVE' | 'SHADOW' | 'CLEARED';
export type ProjectRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
export type QuestState = 'OPEN' | 'EVIDENCE_PENDING' | 'REVISION_REQUIRED' | 'COMPLETED' | 'REJECTED';
export type XpAllocation = Record<Ability, number>;

export type DomainResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: string; message: string };
