import { expect, it } from 'vitest';
import { openDatabase } from '../../src/main/db/database';
import { runInitialImport } from '../../src/main/services/initial-import';

it('imports one active Gate, locked backlog, and the first YouTube quest exactly once', () => {
  const db = openDatabase(':memory:');
  runInitialImport(db);
  runInitialImport(db);
  expect(db.db.prepare("SELECT COUNT(*) AS count FROM projects WHERE state = 'ACTIVE'").get()).toEqual({ count: 1 });
  expect(db.db.prepare("SELECT name FROM projects WHERE state = 'ACTIVE'").get()).toEqual({ name: '모두를 위한 AI' });
  expect(db.db.prepare("SELECT COUNT(*) AS count FROM projects WHERE state = 'LOCKED'").get()).toEqual({ count: 17 });
  expect(db.db.prepare('SELECT COUNT(*) AS count FROM quests').get()).toEqual({ count: 1 });
  db.close();
});
