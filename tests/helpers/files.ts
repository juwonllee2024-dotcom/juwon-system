import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const tempDirectories = new Set<string>();

export async function createTempDirectory(): Promise<string> {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'juwon-system-test-'));
  tempDirectories.add(directory);
  return directory;
}

export async function seedNamedFiles(directory: string, names: readonly string[]): Promise<void> {
  await Promise.all(names.map((name) => writeFile(path.join(directory, name), name, 'utf8')));
}

export async function listBackupNames(directory: string): Promise<string[]> {
  return (await readdir(directory)).filter((name) => name.endsWith('.db')).sort();
}

export async function cleanupTempDirectories(): Promise<void> {
  const tempRoot = path.resolve(os.tmpdir()) + path.sep;
  for (const directory of tempDirectories) {
    const resolved = path.resolve(directory);
    if (!resolved.startsWith(tempRoot) || !path.basename(resolved).startsWith('juwon-system-test-')) {
      throw new Error(`Refusing to remove unsafe test directory: ${resolved}`);
    }
    await rm(resolved, { recursive: true, force: true });
    tempDirectories.delete(directory);
  }
}
