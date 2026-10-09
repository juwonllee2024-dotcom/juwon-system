import { createHash } from 'node:crypto';
import path from 'node:path';
import { z } from 'zod';
import { validateAllocation } from '../../domain/progression';
import { assertQuestTransition } from '../../domain/quest-state';
import type { DomainResult, XpAllocation } from '../../domain/types';
import type { SystemDatabase } from '../db/database';
import { createActivityRepository } from '../repositories/activity';
import { createEvidenceRepository, type EvidenceRecord, type EvidenceType } from '../repositories/evidence';
import { createInventoryRepository } from '../repositories/inventory';
import { createProgressRepository } from '../repositories/progress';
import { createProjectRepository } from '../repositories/projects';
import { createQuestRepository, type QuestRecord } from '../repositories/quests';
import { createReviewRepository, type ReviewActor, type ReviewDecision } from '../repositories/reviews';

const allocationSchema = z.object({
  youtube: z.number().int().nonnegative(),
  vibeCoding: z.number().int().nonnegative(),
  business: z.number().int().nonnegative(),
}).strict();

const createQuestSchema = z.object({
  id: z.string().min(1).max(200),
  projectId: z.string().min(1).max(200),
  title: z.string().min(1).max(200),
  objective: z.string().min(1).max(2000),
  rewardXp: z.number().int().positive(),
  allocation: allocationSchema,
  steps: z.array(z.string().min(1).max(500)).min(1).max(100),
  deadline: z.number().int().nonnegative().nullable().optional(),
}).strict();

const primitiveMetadata = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const evidenceSchema = z.object({
  type: z.enum(['FILE', 'URL', 'GIT_COMMIT', 'SCREENSHOT', 'METRIC']),
  locator: z.string().min(1).max(2048),
  metadata: z.record(z.string(), primitiveMetadata).refine((value) => Object.keys(value).length <= 20),
}).strict();

const reviewSchema = z.object({
  decision: z.enum(['complete', 'revise', 'reject']),
  reason: z.string().min(1).max(1000),
  actor: z.enum(['codex', 'user']),
}).strict();

export interface CreateQuestInput {
  id: string;
  projectId: string;
  title: string;
  objective: string;
  rewardXp: number;
  allocation: XpAllocation;
  steps: string[];
  deadline?: number | null;
}

export interface EvidenceInput {
  type: EvidenceType;
  locator: string;
  metadata: Record<string, string | number | boolean | null>;
}

export interface ReviewInput {
  decision: ReviewDecision;
  reason: string;
  actor: ReviewActor;
}

function invalid<T>(code: string, message: string): DomainResult<T> {
  return { ok: false, code, message };
}

function normalizeLocator(type: EvidenceType, locator: string): string {
  if (type === 'FILE' || type === 'SCREENSHOT') return path.win32.resolve(locator).toLocaleLowerCase('en-US');
  if (type === 'URL') {
    const url = new URL(locator);
    url.hash = '';
    url.searchParams.sort();
    return url.toString();
  }
  return locator.trim().toLocaleLowerCase('en-US');
}

function evidenceSetHash(evidence: readonly EvidenceRecord[]): string {
  return createHash('sha256').update(evidence.map((item) => item.id).sort().join('\n')).digest('hex');
}

function isUniqueConstraint(error: unknown): boolean {
  return error instanceof Error && 'code' in error && String(error.code).startsWith('SQLITE_CONSTRAINT_UNIQUE');
}

export function createQuestService(
  systemDb: SystemDatabase,
  clock: () => number,
  hasher: (locator: string) => Promise<string>,
) {
  const projects = createProjectRepository(systemDb);
  const quests = createQuestRepository(systemDb);
  const evidence = createEvidenceRepository(systemDb);
  const reviews = createReviewRepository(systemDb);
  const progress = createProgressRepository(systemDb);
  const inventory = createInventoryRepository(systemDb);
  const activity = createActivityRepository(systemDb);

  return {
    get: quests.get,
    listForProject: quests.listForProject,
    create(input: CreateQuestInput): DomainResult<QuestRecord> {
      const parsed = createQuestSchema.safeParse(input);
      if (!parsed.success) return invalid('QUEST_INPUT_INVALID', 'Quest input is invalid');
      if (!validateAllocation(input.rewardXp, input.allocation).ok) {
        return invalid('ALLOCATION_TOTAL_MISMATCH', 'Ability allocation must equal reward XP');
      }
      const project = projects.get(input.projectId);
      if (!project) return invalid('PROJECT_NOT_FOUND', 'Project does not exist');
      if (project.state !== 'ACTIVE' && project.state !== 'SHADOW') {
        return invalid('PROJECT_NOT_AVAILABLE', 'Only active or shadow projects can receive quests');
      }

      const now = clock();
      return systemDb.withTransaction(() => ({
        ok: true,
        value: quests.insert({
          id: input.id,
          projectId: input.projectId,
          title: input.title,
          objective: input.objective,
          state: 'OPEN',
          rewardXp: input.rewardXp,
          allocation: input.allocation,
          deadline: input.deadline ?? null,
          createdAt: now,
          updatedAt: now,
        }, input.steps),
      }));
    },
    async submitEvidence(questId: string, input: EvidenceInput): Promise<DomainResult<EvidenceRecord>> {
      const parsed = evidenceSchema.safeParse(input);
      if (!parsed.success) return invalid('EVIDENCE_INPUT_INVALID', 'Evidence input is invalid');
      const quest = quests.get(questId);
      if (!quest) return invalid('QUEST_NOT_FOUND', 'Quest does not exist');
      const transition = assertQuestTransition(quest.state, 'EVIDENCE_PENDING');
      if (!transition.ok) return transition;

      let normalizedLocator: string;
      try {
        normalizedLocator = normalizeLocator(input.type, input.locator);
      } catch {
        return invalid('EVIDENCE_LOCATOR_INVALID', 'Evidence locator is invalid');
      }
      const contentHash = (await hasher(normalizedLocator)).toLocaleLowerCase('en-US');
      if (!/^[a-f0-9]{64}$/.test(contentHash)) return invalid('EVIDENCE_HASH_INVALID', 'Evidence hash must be SHA-256');

      try {
        return systemDb.withTransaction(() => {
          const now = clock();
          const record = evidence.insert({
            questId,
            type: input.type,
            normalizedLocator,
            contentHash,
            metadata: input.metadata,
            createdAt: now,
          });
          quests.updateState(questId, 'EVIDENCE_PENDING', now);
          activity.append({
            actor: 'user', command: 'quest.submit-evidence', inputSummary: { questId, type: input.type },
            result: { ok: true, evidenceId: record.id }, createdAt: now,
          });
          return { ok: true, value: record };
        });
      } catch (error) {
        if (isUniqueConstraint(error)) return invalid('EVIDENCE_DUPLICATE', 'Evidence was already submitted');
        throw error;
      }
    },
    review(questId: string, input: ReviewInput): DomainResult<QuestRecord> {
      const parsed = reviewSchema.safeParse(input);
      if (!parsed.success) return invalid('REVIEW_INPUT_INVALID', 'Review input is invalid');
      const quest = quests.get(questId);
      if (!quest) return invalid('QUEST_NOT_FOUND', 'Quest does not exist');
      if (quest.state === 'COMPLETED') return invalid('QUEST_ALREADY_COMPLETED', 'Quest is already completed');

      const submittedEvidence = evidence.listForQuest(questId);
      if (submittedEvidence.length === 0) return invalid('QUEST_EVIDENCE_REQUIRED', 'Quest has no evidence');
      const nextState = input.decision === 'complete'
        ? 'COMPLETED'
        : input.decision === 'revise' ? 'REVISION_REQUIRED' : 'REJECTED';
      const transition = assertQuestTransition(quest.state, nextState);
      if (!transition.ok) return transition;
      const setHash = evidenceSetHash(submittedEvidence);

      try {
        return systemDb.withTransaction(() => {
          const now = clock();
          reviews.insert(questId, setHash, input.decision, input.reason, input.actor, now);
          if (input.decision === 'complete') {
            progress.award(questId, setHash, quest.allocation, now);
            inventory.addQuestOutput(quest.projectId, quest.id, quest.title, now);
          }
          quests.updateState(questId, nextState, now);
          activity.append({
            actor: input.actor, command: 'quest.review', inputSummary: { questId, decision: input.decision },
            result: { ok: true, state: nextState }, createdAt: now,
          });
          const updated = quests.get(questId);
          if (!updated) throw new Error('Quest update did not persist');
          return { ok: true, value: updated };
        });
      } catch (error) {
        if (isUniqueConstraint(error)) return invalid('XP_ALREADY_AWARDED', 'XP was already awarded for this evidence');
        throw error;
      }
    },
  };
}
