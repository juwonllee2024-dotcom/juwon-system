import { describe, expect, test } from 'vitest';
import { assertCanCreateMission, validateAllocation } from '../../src/domain/mission';
import { localCoach } from '../../src/server/coach';

describe('mission rules', () => {
  test('rejects a second current mission for the same goal', () => {
    expect(() => assertCanCreateMission([{ id: 'm1', state: 'READY' }])).toThrow('CURRENT_MISSION_EXISTS');
  });

  test('declares a bounded first mission', async () => {
    const proposal = await localCoach.planFirstMission({
      type: 'ASSIGNMENT', subject: 'Science', goalText: 'Build a volcano presentation', deadline: '2026-09-01'
    });
    expect(proposal).toMatchObject({
      objective: '과제 요구사항을 읽고 완료 조건 3개 적기',
      estimatedMinutes: 15,
      rewardXp: 10,
      allocation: { focus: 3, knowledge: 2, execution: 5 }
    });
  });

  test('requires the declared XP to equal its allocation', () => {
    expect(validateAllocation(10, { focus: 3, knowledge: 2, execution: 5 })).toBe(true);
    expect(validateAllocation(10, { focus: 3, knowledge: 2, execution: 4 })).toBe(false);
  });
});
