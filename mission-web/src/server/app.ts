import express, { type Express } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import { ZodError } from 'zod';
import { CoachInputSchema, GoalInputSchema, ProfileInputSchema } from '../domain/contracts.js';
import { DomainError } from '../domain/mission.js';
import { classifyAge } from '../domain/profile.js';
import { createDatabase } from './db.js';
import { localCoach } from './coach.js';
import { MissionService } from './mission-service.js';
import { ProgressionService } from './progression-service.js';
import { MissionRepository } from './repository.js';
import { localUserId } from './session.js';

export interface AppOptions {
  databasePath?: string;
  database?: DatabaseSync;
  currentYear?: number;
  testUserId?: string;
}

export function createApp(options: AppOptions = {}): Express {
  const app = express();
  const repository = new MissionRepository(options.database ?? createDatabase(options.databasePath ?? ':memory:'));
  const missionService = new MissionService(repository, localCoach);
  const progressionService = new ProgressionService(repository);
  const currentYear = options.currentYear ?? new Date().getUTCFullYear();
  const userId = process.env.NODE_ENV === 'test' && options.testUserId ? options.testUserId : localUserId;
  app.use(express.json({ limit: '32kb' }));
  app.get('/api/health', (_request, response) => {
    response.json({ ok: true, service: 'mission-web' });
  });
  app.post('/api/profile', (request, response) => {
    try {
      const input = ProfileInputSchema.parse(request.body);
      const ageBand = classifyAge(input, currentYear);
      if (ageBand !== 'TEEN') {
        return response.status(422).json({
          code: 'AGE_OR_PERMISSION_REQUIRED',
          message: '이 준비 단계는 허락받은 13–17세만 이용할 수 있습니다.'
        });
      }
      const profile = repository.upsertProfile(userId, {
        ageBand,
        codeName: input.codeName,
        termsVersion: input.termsVersion
      });
      return response.status(201).json(profile);
    } catch (error) {
      if (error instanceof ZodError) {
        const permissionIssue = error.issues.some((issue) => issue.path[0] === 'guardianPermission');
        return response.status(422).json({
          code: permissionIssue ? 'AGE_OR_PERMISSION_REQUIRED' : 'INVALID_PROFILE',
          message: '입력 내용을 확인해 주세요.'
        });
      }
      throw error;
    }
  });
  app.post('/api/goals', async (request, response) => {
    try {
      const input = GoalInputSchema.parse(request.body);
      const mission = await missionService.createGoalAndMission(userId, input);
      return response.status(201).json(mission);
    } catch (error) {
      if (error instanceof DomainError) {
        const status = error.code === 'ACTIVE_GOAL_EXISTS' ? 409 : 422;
        return response.status(status).json({ code: error.code, message: '현재 목표를 먼저 완료해 주세요.' });
      }
      if (error instanceof ZodError) {
        return response.status(422).json({ code: 'INVALID_GOAL', message: '목표 입력을 확인해 주세요.' });
      }
      throw error;
    }
  });
  app.get('/api/mission/current', (_request, response) => {
    const mission = repository.getCurrentMission(userId);
    if (!mission) return response.status(404).json({ code: 'MISSION_NOT_FOUND' });
    return response.json(mission);
  });
  app.post('/api/mission/:id/start', (request, response) => {
    try {
      return response.json(missionService.startMission(userId, request.params.id));
    } catch (error) {
      if (error instanceof DomainError) {
        return response.status(error.code === 'MISSION_NOT_FOUND' ? 404 : 409).json({ code: error.code });
      }
      throw error;
    }
  });
  app.post('/api/mission/:id/coach', async (request, response) => {
    try {
      const input = CoachInputSchema.parse(request.body);
      return response.json(await missionService.coachMission(userId, request.params.id, input.action, input.studentText));
    } catch (error) {
      if (error instanceof DomainError) return response.status(404).json({ code: error.code });
      if (error instanceof ZodError) return response.status(422).json({ code: 'INVALID_COACH_ACTION' });
      throw error;
    }
  });
  app.post('/api/mission/:id/complete', (request, response) => {
    try {
      return response.json(progressionService.complete(userId, request.params.id, request.body));
    } catch (error) {
      if (error instanceof DomainError) {
        return response.status(error.code === 'MISSION_NOT_FOUND' ? 404 : 409).json({ code: error.code });
      }
      if (error instanceof ZodError) return response.status(422).json({ code: 'EVIDENCE_REVISION_REQUIRED' });
      throw error;
    }
  });
  app.get('/api/progress', (_request, response) => response.json(repository.getProgress(userId)));
  app.get('/api/mission/:id', (request, response) => {
    const mission = repository.getMissionDto(userId, request.params.id);
    return mission ? response.json(mission) : response.status(404).json({ code: 'MISSION_NOT_FOUND' });
  });
  app.get('/api/bootstrap', (_request, response) => response.json({
    profile: repository.getProfile(userId) ?? null,
    mission: repository.getCurrentMission(userId) ?? null,
    progress: repository.getProgress(userId)
  }));
  app.get('/api/account/export', (_request, response) => {
    const exported = repository.exportAccount(userId);
    return exported ? response.json(exported) : response.status(404).json({ code: 'PROFILE_NOT_FOUND' });
  });
  app.delete('/api/account', (request, response) => {
    if (request.body?.confirmation !== 'DELETE MY MISSION DATA') {
      return response.status(422).json({ code: 'DELETE_CONFIRMATION_REQUIRED' });
    }
    repository.deleteAccount(userId);
    return response.status(204).send();
  });
  app.use((error: unknown, _request: express.Request, response: express.Response, next: express.NextFunction) => {
    if (error instanceof SyntaxError && 'type' in error && error.type === 'entity.too.large') {
      return response.status(413).json({ code: 'PAYLOAD_TOO_LARGE' });
    }
    return next(error);
  });
  return app;
}
