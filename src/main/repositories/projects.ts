import type { Ability, ProjectRank, ProjectState } from '../../domain/types';
import type { SystemDatabase } from '../db/database';

interface ProjectRow {
  id: string;
  name: string;
  description: string;
  state: ProjectState;
  rank: ProjectRank;
  ability_focus: Ability | null;
  created_at: number;
  updated_at: number;
}

export interface ProjectRecord {
  id: string;
  name: string;
  description: string;
  state: ProjectState;
  rank: ProjectRank;
  abilityFocus: Ability | null;
  createdAt: number;
  updatedAt: number;
}

function mapProject(row: ProjectRow): ProjectRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    state: row.state,
    rank: row.rank,
    abilityFocus: row.ability_focus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createProjectRepository(systemDb: SystemDatabase) {
  const listStatement = systemDb.db.prepare('SELECT * FROM projects ORDER BY created_at, id');
  const getStatement = systemDb.db.prepare('SELECT * FROM projects WHERE id = ?');
  const insertStatement = systemDb.db.prepare(`
    INSERT INTO projects(id, name, description, state, rank, ability_focus, created_at, updated_at)
    VALUES(@id, @name, @description, @state, @rank, @abilityFocus, @createdAt, @updatedAt)
  `);
  const transitionStatement = systemDb.db.prepare('UPDATE projects SET state = ?, updated_at = ? WHERE id = ?');

  return {
    list(): ProjectRecord[] {
      return (listStatement.all() as ProjectRow[]).map(mapProject);
    },
    get(id: string): ProjectRecord | null {
      const row = getStatement.get(id) as ProjectRow | undefined;
      return row ? mapProject(row) : null;
    },
    insert(project: ProjectRecord): void {
      insertStatement.run(project);
    },
    transition(id: string, state: ProjectState, updatedAt: number): void {
      transitionStatement.run(state, updatedAt, id);
    },
  };
}
