import { randomUUID } from 'node:crypto';
import type { QuestState, XpAllocation } from '../../domain/types';
import type { SystemDatabase } from '../db/database';

interface QuestRow {
  id: string;
  project_id: string;
  title: string;
  objective: string;
  state: QuestState;
  reward_xp: number;
  youtube_xp: number;
  vibe_coding_xp: number;
  business_xp: number;
  deadline: number | null;
  created_at: number;
  updated_at: number;
}

interface StepRow {
  id: string;
  position: number;
  text: string;
  completed_at: number | null;
}

export interface QuestStepRecord {
  id: string;
  position: number;
  text: string;
  completedAt: number | null;
}

export interface QuestRecord {
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
  steps: QuestStepRecord[];
}

function mapQuest(row: QuestRow, steps: StepRow[]): QuestRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    objective: row.objective,
    state: row.state,
    rewardXp: row.reward_xp,
    allocation: { youtube: row.youtube_xp, vibeCoding: row.vibe_coding_xp, business: row.business_xp },
    deadline: row.deadline,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    steps: steps.map((step) => ({
      id: step.id,
      position: step.position,
      text: step.text,
      completedAt: step.completed_at,
    })),
  };
}

export function createQuestRepository(systemDb: SystemDatabase) {
  const getQuest = systemDb.db.prepare('SELECT * FROM quests WHERE id = ?');
  const getSteps = systemDb.db.prepare('SELECT id, position, text, completed_at FROM quest_steps WHERE quest_id = ? ORDER BY position');
  const listQuests = systemDb.db.prepare('SELECT * FROM quests WHERE project_id = ? ORDER BY created_at, id');
  const insertQuest = systemDb.db.prepare(`
    INSERT INTO quests(
      id, project_id, title, objective, state, reward_xp, youtube_xp, vibe_coding_xp,
      business_xp, deadline, created_at, updated_at
    ) VALUES(@id, @projectId, @title, @objective, @state, @rewardXp, @youtubeXp,
      @vibeCodingXp, @businessXp, @deadline, @createdAt, @updatedAt)
  `);
  const insertStep = systemDb.db.prepare(`
    INSERT INTO quest_steps(id, quest_id, position, text, completed_at) VALUES(?, ?, ?, ?, NULL)
  `);
  const updateState = systemDb.db.prepare('UPDATE quests SET state = ?, updated_at = ? WHERE id = ?');

  function get(id: string): QuestRecord | null {
    const row = getQuest.get(id) as QuestRow | undefined;
    if (!row) return null;
    return mapQuest(row, getSteps.all(id) as StepRow[]);
  }

  return {
    get,
    listForProject(projectId: string): QuestRecord[] {
      return (listQuests.all(projectId) as QuestRow[]).map((row) => mapQuest(row, getSteps.all(row.id) as StepRow[]));
    },
    insert(record: Omit<QuestRecord, 'steps'>, steps: readonly string[]): QuestRecord {
      insertQuest.run({
        id: record.id,
        projectId: record.projectId,
        title: record.title,
        objective: record.objective,
        state: record.state,
        rewardXp: record.rewardXp,
        youtubeXp: record.allocation.youtube,
        vibeCodingXp: record.allocation.vibeCoding,
        businessXp: record.allocation.business,
        deadline: record.deadline,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      });
      steps.forEach((text, position) => insertStep.run(randomUUID(), record.id, position, text));
      const created = get(record.id);
      if (!created) throw new Error('Quest insert did not persist');
      return created;
    },
    updateState(id: string, state: QuestState, updatedAt: number): void {
      updateState.run(state, updatedAt, id);
    },
  };
}
