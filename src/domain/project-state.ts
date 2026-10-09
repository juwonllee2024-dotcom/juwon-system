import type { DomainResult, ProjectState } from './types';

export interface ProjectStateRecord {
  id: string;
  state: ProjectState;
}

export function assertProjectTransition(
  projects: readonly ProjectStateRecord[],
  projectId: string,
  nextState: ProjectState,
): DomainResult<void> {
  if (!projects.some((project) => project.id === projectId)) {
    return { ok: false, code: 'PROJECT_NOT_FOUND', message: 'Project does not exist' };
  }

  if (nextState === 'ACTIVE' && projects.some((project) => project.id !== projectId && project.state === 'ACTIVE')) {
    return { ok: false, code: 'ACTIVE_PROJECT_EXISTS', message: 'Another active project already exists' };
  }

  if (nextState === 'SHADOW' && projects.some((project) => project.id !== projectId && project.state === 'SHADOW')) {
    return { ok: false, code: 'SHADOW_PROJECT_EXISTS', message: 'Another shadow project already exists' };
  }

  return { ok: true, value: undefined };
}
