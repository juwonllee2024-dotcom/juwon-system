import type { Ability, DomainResult, ProjectRank, ProjectState } from '../../domain/types';
import { assertProjectTransition } from '../../domain/project-state';
import type { SystemDatabase } from '../db/database';
import { createActivityRepository } from '../repositories/activity';
import { createProjectRepository, type ProjectRecord } from '../repositories/projects';

export interface CreateProjectInput {
  id: string;
  name: string;
  description?: string;
  state: ProjectState;
  rank: ProjectRank;
  abilityFocus?: Ability | null;
}

function concurrencyError(state: ProjectState): DomainResult<never> {
  return state === 'ACTIVE'
    ? { ok: false, code: 'ACTIVE_PROJECT_EXISTS', message: 'Another active project already exists' }
    : { ok: false, code: 'SHADOW_PROJECT_EXISTS', message: 'Another shadow project already exists' };
}

function isUniqueConstraint(error: unknown): boolean {
  return error instanceof Error && 'code' in error && String(error.code).startsWith('SQLITE_CONSTRAINT_UNIQUE');
}

export function createProjectService(systemDb: SystemDatabase, clock: () => number) {
  const projects = createProjectRepository(systemDb);
  const activity = createActivityRepository(systemDb);

  return {
    list: projects.list,
    get: projects.get,
    create(input: CreateProjectInput): DomainResult<ProjectRecord> {
      const now = clock();
      const record: ProjectRecord = {
        id: input.id,
        name: input.name,
        description: input.description ?? '',
        state: input.state,
        rank: input.rank,
        abilityFocus: input.abilityFocus ?? null,
        createdAt: now,
        updatedAt: now,
      };

      try {
        systemDb.withTransaction(() => projects.insert(record));
        return { ok: true, value: record };
      } catch (error) {
        if (isUniqueConstraint(error) && (input.state === 'ACTIVE' || input.state === 'SHADOW')) {
          return concurrencyError(input.state);
        }
        throw error;
      }
    },
    transition(id: string, nextState: ProjectState): DomainResult<ProjectRecord> {
      const current = projects.get(id);
      if (!current) return { ok: false, code: 'PROJECT_NOT_FOUND', message: 'Project does not exist' };

      const allowed = assertProjectTransition(projects.list(), id, nextState);
      if (!allowed.ok) return allowed;

      try {
        return systemDb.withTransaction(() => {
          const updatedAt = clock();
          projects.transition(id, nextState, updatedAt);
          activity.append({
            actor: 'user',
            command: 'project.transition',
            inputSummary: { projectId: id, from: current.state, to: nextState },
            result: { ok: true },
            createdAt: updatedAt,
          });
          return { ok: true, value: { ...current, state: nextState, updatedAt } };
        });
      } catch (error) {
        if (isUniqueConstraint(error) && (nextState === 'ACTIVE' || nextState === 'SHADOW')) {
          return concurrencyError(nextState);
        }
        throw error;
      }
    },
  };
}
