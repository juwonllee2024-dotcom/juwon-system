import Database = require('better-sqlite3');
import { readFileSync } from 'node:fs';
import path from 'node:path';

const migrations = [
  { version: '001-core', filename: '001-core.sql' },
] as const;

export interface SystemDatabase {
  db: Database.Database;
  withTransaction<T>(work: () => T): T;
  close(): void;
}

function migrate(db: Database.Database): void {
  const run = db.transaction(() => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at INTEGER NOT NULL
      )
    `);

    const hasMigration = db.prepare('SELECT 1 FROM schema_migrations WHERE version = ?');
    const recordMigration = db.prepare('INSERT INTO schema_migrations(version, applied_at) VALUES(?, ?)');

    for (const migration of migrations) {
      if (hasMigration.get(migration.version)) continue;
      const filename = path.join(__dirname, 'migrations', migration.filename);
      db.exec(readFileSync(filename, 'utf8'));
      recordMigration.run(migration.version, Date.now());
    }
  });

  run();
}

export function openDatabase(filename: string): SystemDatabase {
  const db = new Database(filename);
  db.pragma('foreign_keys = ON');
  if (filename !== ':memory:') db.pragma('journal_mode = WAL');

  try {
    migrate(db);
  } catch (error) {
    db.close();
    throw error;
  }

  return {
    db,
    withTransaction<T>(work: () => T): T {
      return db.transaction(work)();
    },
    close(): void {
      db.close();
    },
  };
}
