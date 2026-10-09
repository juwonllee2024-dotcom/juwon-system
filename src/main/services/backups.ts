import Database = require('better-sqlite3');
import { mkdir, readdir, rename, rm, unlink } from 'node:fs/promises';
import path from 'node:path';

const backupPattern = /^system-\d{4}-\d{2}-\d{2}\.db$/;

function localDate(now: Date): string {
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function childPath(directory: string, filename: string): string {
  const root = path.resolve(directory) + path.sep;
  const target = path.resolve(directory, filename);
  if (!target.startsWith(root)) throw new Error('Backup target escaped its directory');
  return target;
}

export async function pruneBackups(backupDirectory: string, keep: number): Promise<void> {
  if (!Number.isInteger(keep) || keep < 1) throw new RangeError('keep must be a positive integer');
  const entries = await readdir(backupDirectory, { withFileTypes: true });
  const backups = entries
    .filter((entry) => entry.isFile() && backupPattern.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  const expired = backups.slice(0, Math.max(0, backups.length - keep));
  await Promise.all(expired.map((name) => unlink(childPath(backupDirectory, name))));
}

export async function createDailyBackup(
  databasePath: string,
  backupDirectory: string,
  now: Date,
): Promise<string> {
  await mkdir(backupDirectory, { recursive: true });
  const destination = childPath(backupDirectory, `system-${localDate(now)}.db`);
  const existing = (await readdir(backupDirectory)).includes(path.basename(destination));
  if (existing) return destination;

  const temporary = childPath(backupDirectory, `.backup-${process.pid}-${Date.now()}.tmp`);
  const source = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    await source.backup(temporary);
  } finally {
    source.close();
  }

  try {
    const candidate = new Database(temporary, { readonly: true, fileMustExist: true });
    try {
      const result = candidate.pragma('integrity_check', { simple: true });
      if (result !== 'ok') throw new Error('Backup integrity check failed');
    } finally {
      candidate.close();
    }
    await rename(temporary, destination);
    await pruneBackups(backupDirectory, 7);
    return destination;
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}
