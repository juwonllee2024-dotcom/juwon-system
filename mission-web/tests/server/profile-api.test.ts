import request from 'supertest';
import { describe, expect, test } from 'vitest';
import { createApp } from '../../src/server/app.js';

describe('profile API', () => {
  test('creates a teen profile with permission acknowledgement', async () => {
    const response = await request(createApp({ databasePath: ':memory:', currentYear: 2026 }))
      .post('/api/profile')
      .send({
        birthYear: 2011,
        isAtLeast13: true,
        guardianPermission: true,
        codeName: 'NOVA',
        termsVersion: '2026-08-25'
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ codeName: 'NOVA', ageBand: 'TEEN' });
    expect(response.body).not.toHaveProperty('birthYear');
  });

  test.each([
    { birthYear: 2014, isAtLeast13: false, guardianPermission: false },
    { birthYear: 2011, isAtLeast13: true, guardianPermission: false }
  ])('rejects under-thirteen or missing permission', async (ageInput) => {
    const response = await request(createApp({ databasePath: ':memory:', currentYear: 2026 }))
      .post('/api/profile')
      .send({
        ...ageInput,
        codeName: 'NOVA',
        termsVersion: '2026-08-25'
      });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe('AGE_OR_PERMISSION_REQUIRED');
  });

  test('rejects the wrong terms version', async () => {
    const response = await request(createApp({ databasePath: ':memory:', currentYear: 2026 }))
      .post('/api/profile')
      .send({
        birthYear: 2011,
        isAtLeast13: true,
        guardianPermission: true,
        codeName: 'NOVA',
        termsVersion: 'old'
      });

    expect(response.status).toBe(422);
  });
});
