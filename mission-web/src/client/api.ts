import { z } from 'zod';
import {
  BootstrapDtoSchema, GoalInputSchema, MissionDtoSchema, ProfileDtoSchema, ProgressDtoSchema,
  type BootstrapDto, type GoalInput, type MissionDto, type ProfileDto, type ProfileInput
} from '../domain/contracts';
import type { CoachAction, CoachResponse } from '../server/coach';
import type { ProgressDto } from '../domain/progression';

export interface ReadyState { profile: ProfileDto; mission: MissionDto }
export interface MissionApi {
  getBootstrap(): Promise<BootstrapDto>;
  createProfile(input: ProfileInput): Promise<ProfileDto>;
  createGoal(input: GoalInput): Promise<MissionDto>;
  startMission(id: string): Promise<MissionDto>;
  coachMission(id: string, input: { action: CoachAction; studentText?: string }): Promise<CoachResponse>;
  completeMission(id: string, evidence: { summary: string; verification: string }): Promise<ProgressDto>;
  getProgress(): Promise<ProgressDto>;
  exportAccount(): Promise<unknown>;
  deleteAccount(confirmation: string): Promise<void>;
}

const ApiErrorSchema = z.object({ code: z.string(), message: z.string().optional() });
const CoachResponseSchema = z.union([
  z.object({ kind: z.literal('MESSAGE'), text: z.string() }),
  z.object({ kind: z.literal('SPLIT'), steps: z.array(z.object({ text: z.string(), estimatedMinutes: z.number() })) })
]);

async function call<T>(path: string, init: RequestInit, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: init.body ? { 'content-type': 'application/json', ...init.headers } : init.headers
  });
  const body: unknown = response.status === 204 ? undefined : await response.json();
  if (!response.ok) throw ApiErrorSchema.parse(body);
  return schema.parse(body);
}

export const browserApi: MissionApi = {
  getBootstrap: () => call('/api/bootstrap', { method: 'GET' }, BootstrapDtoSchema),
  createProfile: (input) => call('/api/profile', { method: 'POST', body: JSON.stringify(input) }, ProfileDtoSchema),
  createGoal: (input) => call('/api/goals', { method: 'POST', body: JSON.stringify(GoalInputSchema.parse(input)) }, MissionDtoSchema),
  startMission: (id) => call(`/api/mission/${id}/start`, { method: 'POST' }, MissionDtoSchema),
  coachMission: (id, input) => call(`/api/mission/${id}/coach`, { method: 'POST', body: JSON.stringify(input) }, CoachResponseSchema),
  completeMission: (id, evidence) => call(`/api/mission/${id}/complete`, { method: 'POST', body: JSON.stringify(evidence) }, ProgressDtoSchema),
  getProgress: () => call('/api/progress', { method: 'GET' }, ProgressDtoSchema),
  exportAccount: () => call('/api/account/export', { method: 'GET' }, z.unknown()),
  async deleteAccount(confirmation) {
    const response = await fetch('/api/account', {
      method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ confirmation })
    });
    if (!response.ok) throw ApiErrorSchema.parse(await response.json());
  }
};
