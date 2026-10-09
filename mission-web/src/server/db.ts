import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function createDatabase(filename: string): DatabaseSync {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const database = new DatabaseSync(filename);
  database.exec('PRAGMA foreign_keys = ON');
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      age_band TEXT NOT NULL CHECK (age_band = 'TEEN'),
      code_name TEXT NOT NULL CHECK (length(code_name) BETWEEN 2 AND 24),
      terms_version TEXT NOT NULL,
      permission_confirmed_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  database.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('ASSIGNMENT', 'PRESENTATION', 'EXAM')),
      subject TEXT NOT NULL,
      goal_text TEXT NOT NULL,
      deadline TEXT NOT NULL,
      state TEXT NOT NULL CHECK (state IN ('ACTIVE', 'COMPLETED'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS one_active_goal_per_user
      ON goals(user_id) WHERE state = 'ACTIVE';

    CREATE TABLE IF NOT EXISTS missions (
      id TEXT PRIMARY KEY,
      goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      objective TEXT NOT NULL,
      completion_condition TEXT NOT NULL,
      estimated_minutes INTEGER NOT NULL CHECK (estimated_minutes BETWEEN 1 AND 30),
      state TEXT NOT NULL CHECK (state IN ('READY', 'ACTIVE', 'REVISION', 'COMPLETED')),
      reward_xp INTEGER NOT NULL CHECK (reward_xp > 0),
      focus_xp INTEGER NOT NULL CHECK (focus_xp >= 0),
      knowledge_xp INTEGER NOT NULL CHECK (knowledge_xp >= 0),
      execution_xp INTEGER NOT NULL CHECK (execution_xp >= 0),
      CHECK (focus_xp + knowledge_xp + execution_xp = reward_xp)
    );
    CREATE UNIQUE INDEX IF NOT EXISTS one_current_mission_per_goal
      ON missions(goal_id) WHERE state IN ('READY', 'ACTIVE', 'REVISION');

    CREATE TABLE IF NOT EXISTS mission_steps (
      id TEXT PRIMARY KEY,
      mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      text TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
      UNIQUE(mission_id, position)
    );

    CREATE TABLE IF NOT EXISTS completion_records (
      id TEXT PRIMARY KEY,
      mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
      summary TEXT NOT NULL CHECK (length(summary) BETWEEN 10 AND 500),
      verification TEXT NOT NULL CHECK (length(verification) BETWEEN 3 AND 300),
      decision TEXT NOT NULL CHECK (decision IN ('COMPLETE', 'REVISION')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS xp_ledger (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mission_id TEXT NOT NULL UNIQUE REFERENCES missions(id) ON DELETE CASCADE,
      total_xp INTEGER NOT NULL,
      focus_xp INTEGER NOT NULL,
      knowledge_xp INTEGER NOT NULL,
      execution_xp INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  return database;
}
