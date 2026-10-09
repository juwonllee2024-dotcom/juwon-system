import { describe, expect, it } from 'vitest';
import { openDatabase } from '../../src/main/db/database';
import { createProjectService } from '../../src/main/services/projects';

describe('project service', () => {
  it('keeps exactly one active project and records the transition', () => {
    const db = openDatabase(':memory:');
    const service = createProjectService(db, () => 1000);
    service.create({ id: 'p1', name: 'AI Channel', state: 'ACTIVE', rank: 'E' });
    service.create({ id: 'p2', name: 'LEE RELAY', state: 'LOCKED', rank: 'E' });

    expect(service.transition('p2', 'ACTIVE')).toMatchObject({ ok: false, code: 'ACTIVE_PROJECT_EXISTS' });
    expect(service.transition('p1', 'LOCKED')).toMatchObject({ ok: true });
    expect(service.transition('p2', 'ACTIVE')).toMatchObject({ ok: true });
    expect(db.db.prepare("SELECT COUNT(*) AS count FROM activity_log WHERE command = 'project.transition'").get())
      .toEqual({ count: 2 });
    db.close();
  });
});
