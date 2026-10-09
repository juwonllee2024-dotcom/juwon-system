import type { DomainResult, QuestState } from './types';

const allowedQuestTransitions: Readonly<Record<QuestState, readonly QuestState[]>> = {
  OPEN: ['EVIDENCE_PENDING', 'REJECTED'],
  EVIDENCE_PENDING: ['REVISION_REQUIRED', 'COMPLETED', 'REJECTED'],
  REVISION_REQUIRED: ['EVIDENCE_PENDING', 'REJECTED'],
  COMPLETED: [],
  REJECTED: [],
};

export function assertQuestTransition(currentState: QuestState, nextState: QuestState): DomainResult<void> {
  if (!allowedQuestTransitions[currentState].includes(nextState)) {
    return {
      ok: false,
      code: 'QUEST_TRANSITION_INVALID',
      message: `Quest cannot move from ${currentState} to ${nextState}`,
    };
  }

  return { ok: true, value: undefined };
}
