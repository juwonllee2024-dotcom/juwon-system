import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase } from '../../src/main/db/database';

describe('core migration', () => {
  let close: (() => void) | undefined;

  afterEach(() => close?.());

  it('creates every approved core table', () => {
    const systemDb = openDatabase(':memory:');
    close = () => systemDb.close();
    const names = systemDb.db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all()
      .map((row) => (row as { name: string }).name);

    expect(names).toEqual(expect.arrayContaining([
      'activity_log', 'ability_progress', 'evidence', 'focus_sessions',
      'inventory_items', 'projects', 'quest_steps', 'quests', 'rank_events',
      'reviews', 'schema_migrations', 'xp_ledger',
    ]));
  });

  it('rolls back a failed transaction', () => {
    const systemDb = openDatabase(':memory:');
    close = () => systemDb.close();
    expect(() => systemDb.withTransaction(() => {
      systemDb.db.prepare("INSERT INTO projects(id,name,state,rank,created_at,updated_at) VALUES(?,?,?,?,?,?)")
        .run('p1', 'Project', 'LOCKED', 'E', 1, 1);
      throw new Error('stop');
    })).toThrow('stop');
    expect(systemDb.db.prepare('SELECT COUNT(*) AS count FROM projects').get()).toEqual({ count: 0 });
  });
});
