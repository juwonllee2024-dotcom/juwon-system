import { expect, test } from 'vitest';
import { startMission } from '../../src/domain/mission';
import { localCoach } from '../../src/server/coach';

test('starts only a ready or revision mission', () => {
  expect(startMission({ state: 'READY' })).toMatchObject({ state: 'ACTIVE' });
  expect(startMission({ state: 'REVISION' })).toMatchObject({ state: 'ACTIVE' });
  expect(() => startMission({ state: 'COMPLETED' })).toThrow('MISSION_NOT_STARTABLE');
});

test('split never creates a step above thirty minutes', async () => {
  const response = await localCoach.respond({
    action: 'SPLIT',
    mission: { title: '요구사항 해독', objective: '완료 조건 3개 적기' },
    studentText: '너무 커요'
  });
  expect(response.kind).toBe('SPLIT');
  if (response.kind === 'SPLIT') {
    expect(response.steps.every((step) => step.estimatedMinutes <= 30)).toBe(true);
  }
});
