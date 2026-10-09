import { describe, expect, it } from 'vitest';
import { assertQuestTransition } from '../../src/domain/quest-state';

describe('assertQuestTransition', () => {
  it('allows evidence submission for an open quest', () => {
    expect(assertQuestTransition('OPEN', 'EVIDENCE_PENDING')).toMatchObject({ ok: true });
  });

  it('rejects completing a quest before evidence review', () => {
    expect(assertQuestTransition('OPEN', 'COMPLETED')).toMatchObject({
      ok: false,
      code: 'QUEST_TRANSITION_INVALID',
    });
  });

  it('allows requested revision to return to evidence pending', () => {
    expect(assertQuestTransition('REVISION_REQUIRED', 'EVIDENCE_PENDING')).toMatchObject({ ok: true });
  });
});
