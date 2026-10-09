import request from 'supertest';
import { beforeEach, describe, expect, test } from 'vitest';
import { createApp } from '../../src/server/app.js';

const profile = {
  birthYear: 2011,
  isAtLeast13: true,
  guardianPermission: true,
  codeName: 'NOVA',
  termsVersion: '2026-08-25'
};
const goal = {
  type: 'ASSIGNMENT',
  subject: 'Science',
  goalText: 'Volcano presentation',
  deadline: '2026-09-01'
};

describe('mission API', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    app = createApp({ databasePath: ':memory:', currentYear: 2026 });
    await request(app).post('/api/profile').send(profile);
  });

  test('creates one goal with one ready mission', async () => {
    const response = await request(app).post('/api/goals').send(goal);
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ state: 'READY', rewardXp: 10 });
    expect(response.body.steps).toHaveLength(3);
  });

  test('refuses a second active goal', async () => {
    await request(app).post('/api/goals').send(goal);
    const response = await request(app).post('/api/goals').send(goal);
    expect(response.status).toBe(409);
    expect(response.body.code).toBe('ACTIVE_GOAL_EXISTS');
  });

  test('returns the current mission', async () => {
    const created = await request(app).post('/api/goals').send(goal);
    const response = await request(app).get('/api/mission/current');
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(created.body.id);
  });
});
