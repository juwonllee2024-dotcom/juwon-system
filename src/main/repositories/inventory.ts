import { randomUUID } from 'node:crypto';
import type { SystemDatabase } from '../db/database';

export function createInventoryRepository(systemDb: SystemDatabase) {
  const insert = systemDb.db.prepare(`
    INSERT INTO inventory_items(id, project_id, quest_id, kind, name, metadata_json, created_at)
    VALUES(?, ?, ?, 'OUTPUT', ?, '{}', ?)
  `);

  return {
    addQuestOutput(projectId: string, questId: string, name: string, createdAt: number): void {
      insert.run(randomUUID(), projectId, questId, name, createdAt);
    },
  };
}
