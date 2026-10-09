import { z } from 'zod';

export const CURRENT_TERMS_VERSION = '2026-08-25';

export const ProfileInputSchema = z.object({
  birthYear: z.number().int().min(1900).max(2100),
  isAtLeast13: z.boolean(),
  guardianPermission: z.literal(true),
  codeName: z.string().trim().min(2).max(24),
  termsVersion: z.literal(CURRENT_TERMS_VERSION)
});

export const ProfileDtoSchema = z.object({
  id: z.string(),
  ageBand: z.literal('TEEN'),
  codeName: z.string(),
  termsVersion: z.string(),
  permissionConfirmedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type ProfileInput = z.infer<typeof ProfileInputSchema>;
export type ProfileDto = z.infer<typeof ProfileDtoSchema>;

export const GoalInputSchema = z.object({
  type: z.enum(['ASSIGNMENT', 'PRESENTATION', 'EXAM']),
  subject: z.string().trim().min(1).max(80),
  goalText: z.string().trim().min(3).max(500),
  deadline: z.iso.date()
});

export const MissionProposalSchema = z.object({
  title: z.string().min(1).max(80),
  objective: z.string().min(1).max(300),
  completionCondition: z.string().min(1).max(300),
  steps: z.array(z.string().min(1).max(160)).min(1).max(6),
  estimatedMinutes: z.number().int().min(1).max(30),
  rewardXp: z.number().int().positive().max(100),
  allocation: z.object({
    focus: z.number().int().nonnegative(),
    knowledge: z.number().int().nonnegative(),
    execution: z.number().int().nonnegative()
  })
});

export const MissionDtoSchema = z.object({
  id: z.string(),
  goalId: z.string(),
  title: z.string(),
  objective: z.string(),
  completionCondition: z.string(),
  estimatedMinutes: z.number(),
  state: z.enum(['READY', 'ACTIVE', 'REVISION', 'COMPLETED']),
  rewardXp: z.number(),
  allocation: z.object({ focus: z.number(), knowledge: z.number(), execution: z.number() }),
  steps: z.array(z.object({ id: z.string(), position: z.number(), text: z.string(), completed: z.boolean() }))
});

export type GoalInput = z.infer<typeof GoalInputSchema>;
export type MissionDto = z.infer<typeof MissionDtoSchema>;

export const CoachInputSchema = z.object({
  action: z.enum(['HINT', 'EXPLAIN', 'SPLIT']),
  studentText: z.string().trim().max(1000).optional().default('')
});

export const CompletionInputSchema = z.object({
  summary: z.string().trim().min(10).max(500),
  verification: z.string().trim().min(3).max(300)
});

export const ProgressDtoSchema = z.object({
  totalXp: z.number().int().nonnegative(),
  playerLevel: z.number().int().positive(),
  abilities: z.object({ focus: z.number(), knowledge: z.number(), execution: z.number() }),
  lastAwardXp: z.number().int().nonnegative(),
  newAward: z.boolean()
});

export const BootstrapDtoSchema = z.object({
  profile: ProfileDtoSchema.nullable(),
  mission: MissionDtoSchema.nullable(),
  progress: ProgressDtoSchema
});

export type CompletionInput = z.infer<typeof CompletionInputSchema>;
export type BootstrapDto = z.infer<typeof BootstrapDtoSchema>;
