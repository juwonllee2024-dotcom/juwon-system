import request from 'supertest';
import { afterEach, expect, test } from 'vitest';
import { createApp } from '../../src/server/app.js';
import { createDatabase } from '../../src/server/db.js';

let database: ReturnType<typeof createDatabase> | undefined;
afterEach(() => { database?.close(); database = undefined; });

test('does not reveal another user mission', async () => {
  database = createDatabase(':memory:');
  const ownerApp = createApp({ database, currentYear: 2026, testUserId: 'user-a' });
  await request(ownerApp).post('/api/profile').send({
    birthYear: 2011, isAtLeast13: true, guardianPermission: true, codeName: 'ALPHA', termsVersion: '2026-08-25'
  });
  const created = await request(ownerApp).post('/api/goals').send({
    type: 'ASSIGNMENT', subject: 'Science', goalText: 'Volcano presentation', deadline: '2026-09-01'
  });

  const otherApp = createApp({ database, currentYear: 2026, testUserId: 'user-b' });
  await request(otherApp).post('/api/profile').send({
    birthYear: 2011, isAtLeast13: true, guardianPermission: true, codeName: 'BETA', termsVersion: '2026-08-25'
  });
  const response = await request(otherApp).get(`/api/mission/${created.body.id}`);
  expect(response.status).toBe(404);
});
