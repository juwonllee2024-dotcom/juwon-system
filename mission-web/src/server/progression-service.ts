import { CompletionInputSchema } from '../domain/contracts.js';
import { DomainError } from '../domain/mission.js';
import type { ProgressDto } from '../domain/progression.js';
import type { MissionRepository } from './repository.js';

export class ProgressionService {
  constructor(private readonly repository: MissionRepository) {}

  complete(userId: string, missionId: string, rawEvidence: unknown): ProgressDto {
    const existing = this.repository.findAward(userId, missionId);
    if (existing) return this.repository.getProgress(userId, existing.total_xp, false);
    const evidence = CompletionInputSchema.parse(rawEvidence);
    return this.repository.transaction(() => {
      const mission = this.repository.getMissionDto(userId, missionId);
      if (!mission) throw new DomainError('MISSION_NOT_FOUND');
      if (mission.state !== 'ACTIVE') throw new DomainError('MISSION_NOT_COMPLETABLE');
      this.repository.insertCompletion(missionId, evidence);
      this.repository.completeMissionAndGoal(missionId);
      this.repository.insertAward(userId, mission);
      return this.repository.getProgress(userId, mission.rewardXp, true);
    });
  }
}
