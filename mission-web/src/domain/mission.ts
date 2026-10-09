export type MissionState = 'READY' | 'ACTIVE' | 'REVISION' | 'COMPLETED';

export interface XpAllocation {
  focus: number;
  knowledge: number;
  execution: number;
}

export interface MissionProposal {
  title: string;
  objective: string;
  completionCondition: string;
  steps: string[];
  estimatedMinutes: number;
  rewardXp: number;
  allocation: XpAllocation;
}

export class DomainError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

export function assertCanCreateMission(missions: Array<{ state: MissionState }>): void {
  if (missions.some((mission) => mission.state !== 'COMPLETED')) {
    throw new DomainError('CURRENT_MISSION_EXISTS');
  }
}

export function validateAllocation(rewardXp: number, allocation: XpAllocation): boolean {
  return allocation.focus >= 0 && allocation.knowledge >= 0 && allocation.execution >= 0 &&
    allocation.focus + allocation.knowledge + allocation.execution === rewardXp;
}

export function startMission<T extends { state: MissionState }>(mission: T): T & { state: 'ACTIVE' } {
  if (mission.state !== 'READY' && mission.state !== 'REVISION') {
    throw new DomainError('MISSION_NOT_STARTABLE');
  }
  return { ...mission, state: 'ACTIVE' };
}
