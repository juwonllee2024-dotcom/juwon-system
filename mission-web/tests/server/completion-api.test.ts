import request from 'supertest';
import { beforeEach, describe, expect, test } from 'vitest';
import { createApp } from '../../src/server/app.js';

describe('completion API', () => {
  let app: ReturnType<typeof createApp>;
  let missionId: string;

  beforeEach(async () => {
    app = createApp({ databasePath: ':memory:', currentYear: 2026 });
    await request(app).post('/api/profile').send({
      birthYear: 2011, isAtLeast13: true, guardianPermission: true,
      codeName: 'NOVA', termsVersion: '2026-08-25'
    });
    const created = await request(app).post('/api/goals').send({
      type: 'ASSIGNMENT', subject: 'Science', goalText: 'Volcano presentation', deadline: '2026-09-01'
    });
    missionId = created.body.id;
    await request(app).post(`/api/mission/${missionId}/start`);
  });

  test('awards declared XP exactly once', async () => {
    const evidence = { summary: '완료 조건 세 가지를 제 말로 적었습니다.', verification: '슬라이드 설명을 제출했습니다.' };
    const first = await request(app).post(`/api/mission/${missionId}/complete`).send(evidence);
    const second = await request(app).post(`/api/mission/${missionId}/complete`).send(evidence);
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ totalXp: 10, newAward: true, abilities: { focus: 3, knowledge: 2, execution: 5 } });
    expect(second.body).toMatchObject({ totalXp: 10, newAward: false });
  });

  test('rejects evidence that cannot verify completion', async () => {
    const response = await request(app).post(`/api/mission/${missionId}/complete`).send({ summary: '짧음', verification: '' });
    expect(response.status).toBe(422);
    expect((await request(app).get('/api/progress')).body.totalXp).toBe(0);
  });
});
