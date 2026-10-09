import { randomUUID } from 'node:crypto';
import type { SystemDatabase } from '../db/database';

export type EvidenceType = 'FILE' | 'URL' | 'GIT_COMMIT' | 'SCREENSHOT' | 'METRIC';

export interface EvidenceRecord {
  id: string;
  questId: string;
  type: EvidenceType;
  normalizedLocator: string;
  contentHash: string;
  metadata: Record<string, string | number | boolean | null>;
  createdAt: number;
}

interface EvidenceRow {
  id: string;
  quest_id: string;
  type: EvidenceType;
  normalized_locator: string;
  content_hash: string;
  metadata_json: string;
  created_at: number;
}

function mapEvidence(row: EvidenceRow): EvidenceRecord {
  return {
    id: row.id,
    questId: row.quest_id,
    type: row.type,
    normalizedLocator: row.normalized_locator,
    contentHash: row.content_hash,
    metadata: JSON.parse(row.metadata_json) as EvidenceRecord['metadata'],
    createdAt: row.created_at,
  };
}

export function createEvidenceRepository(systemDb: SystemDatabase) {
  const insert = systemDb.db.prepare(`
    INSERT INTO evidence(id, quest_id, type, normalized_locator, content_hash, metadata_json, created_at)
    VALUES(@id, @questId, @type, @normalizedLocator, @contentHash, @metadataJson, @createdAt)
  `);
  const list = systemDb.db.prepare('SELECT * FROM evidence WHERE quest_id = ? ORDER BY created_at, id');

  return {
    insert(input: Omit<EvidenceRecord, 'id'>): EvidenceRecord {
      const record = { ...input, id: randomUUID() };
      insert.run({ ...record, metadataJson: JSON.stringify(record.metadata) });
      return record;
    },
    listForQuest(questId: string): EvidenceRecord[] {
      return (list.all(questId) as EvidenceRow[]).map(mapEvidence);
    },
  };
}
