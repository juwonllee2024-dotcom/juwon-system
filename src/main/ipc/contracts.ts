import { z } from 'zod';
import type { Ability, ProjectRank, ProjectState, QuestState, XpAllocation } from '../../domain/types';

export interface ProjectDto {
  id: string;
  name: string;
  description: string;
  state: ProjectState;
  rank: ProjectRank;
  abilityFocus: Ability | null;
  createdAt: number;
  updatedAt: number;
}

export interface QuestStepDto {
  id: string;
  position: number;
  text: string;
  completedAt: number | null;
}

export interface QuestDto {
  id: string;
  projectId: string;
  title: string;
  objective: string;
  state: QuestState;
  rewardXp: number;
  allocation: XpAllocation;
  deadline: number | null;
  createdAt: number;
  updatedAt: number;
  steps: QuestStepDto[];
}

export interface EvidenceDto {
  id: string;
  questId: string;
  type: 'FILE' | 'URL' | 'GIT_COMMIT' | 'SCREENSHOT' | 'METRIC';
  normalizedLocator: string;
  contentHash: string;
  metadata: Record<string, string | number | boolean | null>;
  createdAt: number;
}

const boundedId = z.string().min(1).max(200);
const metadataValue = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const metadata = z.record(z.string().max(200), metadataValue)
  .refine((value) => Object.keys(value).length <= 20, 'metadata has too many keys');

export const getQuestRequest = z.object({ questId: boundedId }).strict();
export const submitEvidenceRequest = z.object({
  questId: boundedId,
  evidence: z.object({
    type: z.enum(['FILE', 'URL', 'GIT_COMMIT', 'SCREENSHOT', 'METRIC']),
    locator: z.string().min(1).max(2048),
    metadata,
  }).strict(),
}).strict();
export const reviewQuestRequest = z.object({
  questId: boundedId,
  review: z.object({
    decision: z.enum(['complete', 'revise', 'reject']),
    reason: z.string().min(1).max(1000),
    actor: z.enum(['codex', 'user']),
  }).strict(),
}).strict();

export type SubmitEvidenceRequest = z.infer<typeof submitEvidenceRequest>;
export type ReviewQuestRequest = z.infer<typeof reviewQuestRequest>;

export const ipcChannels = {
  getStatus: 'system:get-status',
  getQuest: 'quest:get',
  listProjects: 'project:list',
  pickEvidenceFile: 'evidence:pick-file',
  submitEvidence: 'quest:submit-evidence',
  reviewQuest: 'quest:review',
} as const;

export type IpcResponse<T> =
  | { ok: true; value: T }
  | { ok: false; code: string; message: string };

export interface SystemStatus {
  playerXp: number;
  playerLevel: number;
  abilities: {
    youtube: { xp: number; level: number };
    vibeCoding: { xp: number; level: number };
    business: { xp: number; level: number };
  };
  activeGate: ProjectDto | null;
  currentQuest: QuestDto | null;
}

export interface JuwonSystemApi {
  getStatus(): Promise<IpcResponse<SystemStatus>>;
  getQuest(questId: string): Promise<IpcResponse<QuestDto>>;
  listProjects(): Promise<IpcResponse<ProjectDto[]>>;
  pickEvidenceFile(): Promise<IpcResponse<{ path: string } | null>>;
  submitEvidence(request: SubmitEvidenceRequest): Promise<IpcResponse<EvidenceDto>>;
  reviewQuest(request: ReviewQuestRequest): Promise<IpcResponse<QuestDto>>;
}
