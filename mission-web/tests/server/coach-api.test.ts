import request from 'supertest';
import { beforeEach, describe, expect, test } from 'vitest';
import { createApp } from '../../src/server/app.js';

describe('mission coaching API', () => {
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
  });

  test('starts a ready mission', async () => {
    const response = await request(app).post(`/api/mission/${missionId}/start`);
    expect(response.status).toBe(200);
    expect(response.body.state).toBe('ACTIVE');
  });

  test('returns bounded process help', async () => {
    const response = await request(app).post(`/api/mission/${missionId}/coach`).send({ action: 'SPLIT', studentText: '너무 커요' });
    expect(response.status).toBe(200);
    expect(response.body.kind).toBe('SPLIT');
    expect(response.body.steps.every((step: { estimatedMinutes: number }) => step.estimatedMinutes <= 30)).toBe(true);
  });

  test('does not coach a missing mission', async () => {
    const response = await request(app).post('/api/mission/missing/coach').send({ action: 'HINT' });
    expect(response.status).toBe(404);
  });

  test('rejects unsupported coaching actions', async () => {
    const response = await request(app).post(`/api/mission/${missionId}/coach`).send({ action: 'ANSWER' });
    expect(response.status).toBe(422);
  });

  test('rejects a payload above 32KB', async () => {
    const response = await request(app).post(`/api/mission/${missionId}/coach`).send({ action: 'HINT', studentText: 'x'.repeat(33 * 1024) });
    expect(response.status).toBe(413);
  });
});
