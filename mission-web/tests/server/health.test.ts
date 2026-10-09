import request from 'supertest';
import { describe, expect, test } from 'vitest';
import { createApp } from '../../src/server/app.js';

describe('health API', () => {
  test('reports local slice readiness', async () => {
    const response = await request(createApp()).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, service: 'mission-web' });
  });
});
