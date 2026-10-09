import type { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import type { GoalInput, MissionDto, ProfileDto } from '../domain/contracts.js';
import type { CompletionInput } from '../domain/contracts.js';
import type { MissionProposal } from '../domain/mission.js';
import { levelForXp, type ProgressDto } from '../domain/progression.js';

interface ProfileWrite {
  ageBand: 'TEEN';
  codeName: string;
  termsVersion: string;
}

interface ProfileRow {
  id: string;
  age_band: 'TEEN';
  code_name: string;
  terms_version: string;
  permission_confirmed_at: string;
  created_at: string;
  updated_at: string;
}

export class MissionRepository {
  constructor(private readonly database: DatabaseSync) {}

  upsertProfile(userId: string, input: ProfileWrite): ProfileDto {
    const now = new Date().toISOString();
    this.database.prepare(`
      INSERT INTO users (
        id, age_band, code_name, terms_version, permission_confirmed_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        age_band = excluded.age_band,
        code_name = excluded.code_name,
        terms_version = excluded.terms_version,
        permission_confirmed_at = excluded.permission_confirmed_at,
        updated_at = excluded.updated_at
    `).run(userId, input.ageBand, input.codeName, input.termsVersion, now, now, now);

    const row = this.database.prepare('SELECT * FROM users WHERE id = ?').get(userId) as unknown as ProfileRow;
    return {
      id: row.id,
      ageBand: row.age_band,
      codeName: row.code_name,
      termsVersion: row.terms_version,
      permissionConfirmedAt: row.permission_confirmed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  getProfile(userId: string): ProfileDto | undefined {
    const row = this.database.prepare('SELECT * FROM users WHERE id = ?').get(userId) as unknown as ProfileRow | undefined;
    if (!row) return undefined;
    return {
      id: row.id, ageBand: row.age_band, codeName: row.code_name, termsVersion: row.terms_version,
      permissionConfirmedAt: row.permission_confirmed_at, createdAt: row.created_at, updatedAt: row.updated_at
    };
  }

  findActiveGoal(userId: string): { id: string } | undefined {
    return this.database.prepare("SELECT id FROM goals WHERE user_id = ? AND state = 'ACTIVE'").get(userId) as { id: string } | undefined;
  }

  transaction<T>(operation: () => T): T {
    this.database.exec('BEGIN IMMEDIATE');
    try {
      const result = operation();
      this.database.exec('COMMIT');
      return result;
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }

  insertGoal(userId: string, input: GoalInput): { id: string } {
    const id = randomUUID();
    this.database.prepare(`
      INSERT INTO goals (id, user_id, type, subject, goal_text, deadline, state)
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')
    `).run(id, userId, input.type, input.subject, input.goalText, input.deadline);
    return { id };
  }

  insertMission(goalId: string, proposal: MissionProposal): { id: string } {
    const id = randomUUID();
    this.database.prepare(`
      INSERT INTO missions (
        id, goal_id, title, objective, completion_condition, estimated_minutes, state,
        reward_xp, focus_xp, knowledge_xp, execution_xp
      ) VALUES (?, ?, ?, ?, ?, ?, 'READY', ?, ?, ?, ?)
    `).run(id, goalId, proposal.title, proposal.objective, proposal.completionCondition,
      proposal.estimatedMinutes, proposal.rewardXp, proposal.allocation.focus,
      proposal.allocation.knowledge, proposal.allocation.execution);
    return { id };
  }

  insertMissionSteps(missionId: string, steps: string[]): void {
    const statement = this.database.prepare(
      'INSERT INTO mission_steps (id, mission_id, position, text) VALUES (?, ?, ?, ?)'
    );
    steps.forEach((text, position) => statement.run(randomUUID(), missionId, position, text));
  }

  getMissionDto(userId: string, missionId: string): MissionDto | undefined {
    const row = this.database.prepare(`
      SELECT m.* FROM missions m JOIN goals g ON g.id = m.goal_id
      WHERE m.id = ? AND g.user_id = ?
    `).get(missionId, userId) as Record<string, unknown> | undefined;
    if (!row) return undefined;
    const steps = this.database.prepare(
      'SELECT id, position, text, completed FROM mission_steps WHERE mission_id = ? ORDER BY position'
    ).all(missionId) as Array<{ id: string; position: number; text: string; completed: number }>;
    return {
      id: row.id as string,
      goalId: row.goal_id as string,
      title: row.title as string,
      objective: row.objective as string,
      completionCondition: row.completion_condition as string,
      estimatedMinutes: row.estimated_minutes as number,
      state: row.state as MissionDto['state'],
      rewardXp: row.reward_xp as number,
      allocation: {
        focus: row.focus_xp as number,
        knowledge: row.knowledge_xp as number,
        execution: row.execution_xp as number
      },
      steps: steps.map((step) => ({ ...step, completed: step.completed === 1 }))
    };
  }

  getCurrentMission(userId: string): MissionDto | undefined {
    const row = this.database.prepare(`
      SELECT m.id FROM missions m JOIN goals g ON g.id = m.goal_id
      WHERE g.user_id = ? AND m.state IN ('READY', 'ACTIVE', 'REVISION')
      ORDER BY m.rowid DESC LIMIT 1
    `).get(userId) as { id: string } | undefined;
    return row ? this.getMissionDto(userId, row.id) : undefined;
  }

  updateMissionState(userId: string, missionId: string, state: MissionDto['state']): MissionDto | undefined {
    const owned = this.getMissionDto(userId, missionId);
    if (!owned) return undefined;
    this.database.prepare('UPDATE missions SET state = ? WHERE id = ?').run(state, missionId);
    return this.getMissionDto(userId, missionId);
  }

  findAward(userId: string, missionId: string): { total_xp: number } | undefined {
    return this.database.prepare('SELECT total_xp FROM xp_ledger WHERE user_id = ? AND mission_id = ?')
      .get(userId, missionId) as { total_xp: number } | undefined;
  }

  insertCompletion(missionId: string, evidence: CompletionInput): void {
    this.database.prepare(`
      INSERT INTO completion_records (id, mission_id, summary, verification, decision, created_at)
      VALUES (?, ?, ?, ?, 'COMPLETE', ?)
    `).run(randomUUID(), missionId, evidence.summary, evidence.verification, new Date().toISOString());
  }

  completeMissionAndGoal(missionId: string): void {
    this.database.prepare("UPDATE missions SET state = 'COMPLETED' WHERE id = ?").run(missionId);
    this.database.prepare(`
      UPDATE goals SET state = 'COMPLETED' WHERE id = (SELECT goal_id FROM missions WHERE id = ?)
    `).run(missionId);
  }

  insertAward(userId: string, mission: MissionDto): void {
    this.database.prepare(`
      INSERT INTO xp_ledger (
        id, user_id, mission_id, total_xp, focus_xp, knowledge_xp, execution_xp, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(randomUUID(), userId, mission.id, mission.rewardXp, mission.allocation.focus,
      mission.allocation.knowledge, mission.allocation.execution, new Date().toISOString());
  }

  getProgress(userId: string, lastAwardXp = 0, newAward = false): ProgressDto {
    const totals = this.database.prepare(`
      SELECT COALESCE(SUM(total_xp), 0) AS total,
             COALESCE(SUM(focus_xp), 0) AS focus,
             COALESCE(SUM(knowledge_xp), 0) AS knowledge,
             COALESCE(SUM(execution_xp), 0) AS execution
      FROM xp_ledger WHERE user_id = ?
    `).get(userId) as { total: number; focus: number; knowledge: number; execution: number };
    return {
      totalXp: totals.total,
      playerLevel: levelForXp(totals.total),
      abilities: { focus: totals.focus, knowledge: totals.knowledge, execution: totals.execution },
      lastAwardXp,
      newAward
    };
  }

  exportAccount(userId: string): Record<string, unknown> | undefined {
    const profile = this.getProfile(userId);
    if (!profile) return undefined;
    const goals = this.database.prepare('SELECT id, type, subject, goal_text, deadline, state FROM goals WHERE user_id = ?').all(userId);
    const missions = this.database.prepare(`
      SELECT m.id, m.goal_id, m.title, m.objective, m.completion_condition, m.estimated_minutes, m.state, m.reward_xp
      FROM missions m JOIN goals g ON g.id = m.goal_id WHERE g.user_id = ?
    `).all(userId);
    const completionRecords = this.database.prepare(`
      SELECT c.id, c.mission_id, c.summary, c.verification, c.decision, c.created_at
      FROM completion_records c JOIN missions m ON m.id = c.mission_id JOIN goals g ON g.id = m.goal_id
      WHERE g.user_id = ?
    `).all(userId);
    const xpLedger = this.database.prepare(`
      SELECT id, mission_id, total_xp, focus_xp, knowledge_xp, execution_xp, created_at
      FROM xp_ledger WHERE user_id = ?
    `).all(userId);
    return { profile, goals, missions, completionRecords, xpLedger };
  }

  deleteAccount(userId: string): void {
    this.transaction(() => {
      this.database.prepare('DELETE FROM users WHERE id = ?').run(userId);
    });
  }
}
