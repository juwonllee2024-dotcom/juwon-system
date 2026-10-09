import type { GoalInput, MissionDto } from '../domain/contracts.js';
import { MissionProposalSchema } from '../domain/contracts.js';
import { DomainError, startMission, validateAllocation } from '../domain/mission.js';
import type { CoachAction, CoachResponse } from './coach.js';
import type { Coach } from './coach.js';
import type { MissionRepository } from './repository.js';

export class MissionService {
  constructor(private readonly repository: MissionRepository, private readonly coach: Coach) {}

  async createGoalAndMission(userId: string, input: GoalInput): Promise<MissionDto> {
    if (this.repository.findActiveGoal(userId)) throw new DomainError('ACTIVE_GOAL_EXISTS');
    const proposal = MissionProposalSchema.parse(await this.coach.planFirstMission(input));
    if (!validateAllocation(proposal.rewardXp, proposal.allocation)) {
      throw new DomainError('INVALID_XP_ALLOCATION');
    }
    return this.repository.transaction(() => {
      const goal = this.repository.insertGoal(userId, input);
      const mission = this.repository.insertMission(goal.id, proposal);
      this.repository.insertMissionSteps(mission.id, proposal.steps);
      const dto = this.repository.getMissionDto(userId, mission.id);
      if (!dto) throw new DomainError('MISSION_NOT_FOUND');
      return dto;
    });
  }

  startMission(userId: string, missionId: string): MissionDto {
    const mission = this.repository.getMissionDto(userId, missionId);
    if (!mission) throw new DomainError('MISSION_NOT_FOUND');
    const started = startMission(mission);
    const updated = this.repository.updateMissionState(userId, missionId, started.state);
    if (!updated) throw new DomainError('MISSION_NOT_FOUND');
    return updated;
  }

  async coachMission(userId: string, missionId: string, action: CoachAction, studentText: string): Promise<CoachResponse> {
    const mission = this.repository.getMissionDto(userId, missionId);
    if (!mission) throw new DomainError('MISSION_NOT_FOUND');
    return this.coach.respond({ action, mission, studentText });
  }
}
