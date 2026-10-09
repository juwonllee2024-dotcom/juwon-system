import request from 'supertest';
import { beforeEach, describe, expect, test } from 'vitest';
import { createApp } from '../../src/server/app.js';

describe('account controls', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    app = createApp({ databasePath: ':memory:', currentYear: 2026 });
    await request(app).post('/api/profile').send({
      birthYear: 2011, isAtLeast13: true, guardianPermission: true, codeName: 'NOVA', termsVersion: '2026-08-25'
    });
  });

  test('exports only documented user-owned data', async () => {
    const response = await request(app).get('/api/account/export');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('profile.codeName', 'NOVA');
    expect(response.body).toHaveProperty('goals');
    expect(response.body).toHaveProperty('xpLedger');
    expect(JSON.stringify(response.body).toLowerCase()).not.toContain('guardian');
  });

  test('requires exact deletion confirmation', async () => {
    expect((await request(app).delete('/api/account').send({ confirmation: 'delete' })).status).toBe(422);
    expect((await request(app).delete('/api/account').send({ confirmation: 'DELETE MY MISSION DATA' })).status).toBe(204);
    expect((await request(app).get('/api/account/export')).status).toBe(404);
  });
});
