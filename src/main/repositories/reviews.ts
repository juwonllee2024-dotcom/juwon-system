import { randomUUID } from 'node:crypto';
import type { SystemDatabase } from '../db/database';

export type ReviewDecision = 'complete' | 'revise' | 'reject';
export type ReviewActor = 'codex' | 'user';

export function createReviewRepository(systemDb: SystemDatabase) {
  const insert = systemDb.db.prepare(`
    INSERT INTO reviews(id, quest_id, evidence_set_hash, decision, reason, actor, created_at)
    VALUES(?, ?, ?, ?, ?, ?, ?)
  `);

  return {
    insert(
      questId: string,
      evidenceSetHash: string,
      decision: ReviewDecision,
      reason: string,
      actor: ReviewActor,
      createdAt: number,
    ): void {
      insert.run(randomUUID(), questId, evidenceSetHash, decision, reason, actor, createdAt);
    },
  };
}
