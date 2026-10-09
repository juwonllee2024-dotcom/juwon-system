import { describe, expect, it } from 'vitest';
import { assertProjectTransition } from '../../src/domain/project-state';

const projects = [
  { id: 'ai-channel', state: 'ACTIVE' as const },
  { id: 'lee-relay', state: 'LOCKED' as const },
  { id: 'editor-shadow', state: 'SHADOW' as const },
];

describe('assertProjectTransition', () => {
  it('rejects a second active project', () => {
    expect(assertProjectTransition(projects, 'lee-relay', 'ACTIVE')).toMatchObject({
      ok: false,
      code: 'ACTIVE_PROJECT_EXISTS',
    });
  });

  it('allows locking the current active project', () => {
    expect(assertProjectTransition(projects, 'ai-channel', 'LOCKED')).toMatchObject({ ok: true });
  });

  it('rejects a second shadow project', () => {
    expect(assertProjectTransition(projects, 'lee-relay', 'SHADOW')).toMatchObject({
      ok: false,
      code: 'SHADOW_PROJECT_EXISTS',
    });
  });
});
