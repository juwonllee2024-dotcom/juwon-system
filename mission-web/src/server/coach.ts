import type { GoalInput } from '../domain/contracts.js';
import type { MissionProposal } from '../domain/mission.js';

export interface Coach {
  planFirstMission(goal: GoalInput): Promise<MissionProposal>;
  respond(input: CoachInput): Promise<CoachResponse>;
}

export type CoachAction = 'HINT' | 'EXPLAIN' | 'SPLIT';
export interface CoachInput {
  action: CoachAction;
  mission: Pick<MissionProposal, 'title' | 'objective'>;
  studentText: string;
}
export type CoachResponse =
  | { kind: 'MESSAGE'; text: string }
  | { kind: 'SPLIT'; steps: Array<{ text: string; estimatedMinutes: number }> };

export const localCoach: Coach = {
  async planFirstMission() {
    return {
      title: '요구사항 해독',
      objective: '과제 요구사항을 읽고 완료 조건 3개 적기',
      completionCondition: '완료 조건 3개를 자신의 말로 기록함',
      steps: ['과제 지시문 읽기', '제출물 형태 찾기', '완료 조건 3개 적기'],
      estimatedMinutes: 15,
      rewardXp: 10,
      allocation: { focus: 3, knowledge: 2, execution: 5 }
    };
  },
  async respond(input) {
    if (input.action === 'HINT') {
      return { kind: 'MESSAGE', text: '제출물에서 반드시 보여줘야 하는 것은 무엇인가요?' };
    }
    if (input.action === 'EXPLAIN') {
      return { kind: 'MESSAGE', text: '먼저 제출물 형태를 찾고, 평가 조건을 자신의 말로 바꿔 적습니다.' };
    }
    return {
      kind: 'SPLIT',
      steps: [
        { text: '지시문에서 제출물 형태 찾기', estimatedMinutes: 5 },
        { text: '평가 조건 표시하기', estimatedMinutes: 5 },
        { text: '완료 조건 3개 적기', estimatedMinutes: 5 }
      ]
    };
  }
};
