import { randomUUID } from 'node:crypto';
import type { SystemDatabase } from '../db/database';

export interface ActivityInput {
  actor: 'system' | 'codex' | 'user';
  command: string;
  inputSummary: Record<string, unknown>;
  result: Record<string, unknown>;
  createdAt: number;
}

export function createActivityRepository(systemDb: SystemDatabase) {
  const insertStatement = systemDb.db.prepare(`
    INSERT INTO activity_log(id, actor, command, input_summary_json, result_json, created_at)
    VALUES(?, ?, ?, ?, ?, ?)
  `);

  return {
    append(activity: ActivityInput): void {
      insertStatement.run(
        randomUUID(),
        activity.actor,
        activity.command,
        JSON.stringify(activity.inputSummary),
        JSON.stringify(activity.result),
        activity.createdAt,
      );
    },
  };
}
