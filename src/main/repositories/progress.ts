import { randomUUID } from 'node:crypto';
import { levelForXp } from '../../domain/progression';
import type { XpAllocation } from '../../domain/types';
import type { SystemDatabase } from '../db/database';

interface ProgressRow {
  youtube_xp: number;
  vibe_coding_xp: number;
  business_xp: number;
}

export function createProgressRepository(systemDb: SystemDatabase) {
  const insertAward = systemDb.db.prepare(`
    INSERT INTO xp_ledger(id, quest_id, evidence_set_hash, youtube_xp, vibe_coding_xp, business_xp, created_at)
    VALUES(?, ?, ?, ?, ?, ?, ?)
  `);
  const getProgress = systemDb.db.prepare(`
    SELECT youtube_xp, vibe_coding_xp, business_xp FROM ability_progress WHERE id = 1
  `);
  const updateProgress = systemDb.db.prepare(`
    UPDATE ability_progress SET youtube_xp = ?, youtube_level = ?, vibe_coding_xp = ?,
      vibe_coding_level = ?, business_xp = ?, business_level = ?, updated_at = ? WHERE id = 1
  `);

  return {
    award(questId: string, evidenceSetHash: string, allocation: XpAllocation, createdAt: number): void {
      insertAward.run(
        randomUUID(), questId, evidenceSetHash,
        allocation.youtube, allocation.vibeCoding, allocation.business, createdAt,
      );
      const current = getProgress.get() as ProgressRow;
      const youtube = current.youtube_xp + allocation.youtube;
      const vibeCoding = current.vibe_coding_xp + allocation.vibeCoding;
      const business = current.business_xp + allocation.business;
      updateProgress.run(
        youtube, levelForXp(youtube),
        vibeCoding, levelForXp(vibeCoding),
        business, levelForXp(business),
        createdAt,
      );
    },
  };
}
