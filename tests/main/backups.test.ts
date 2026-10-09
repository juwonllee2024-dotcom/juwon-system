import { afterEach, expect, it } from 'vitest';
import { pruneBackups } from '../../src/main/services/backups';
import { cleanupTempDirectories, createTempDirectory, listBackupNames, seedNamedFiles } from '../helpers/files';

afterEach(cleanupTempDirectories);

it('keeps the seven newest daily backups', async () => {
  const dir = await createTempDirectory();
  await seedNamedFiles(dir, Array.from({ length: 9 }, (_, index) =>
    `system-2026-08-${String(index + 1).padStart(2, '0')}.db`));
  await pruneBackups(dir, 7);
  expect(await listBackupNames(dir)).toEqual([
    'system-2026-08-03.db', 'system-2026-08-04.db', 'system-2026-08-05.db',
    'system-2026-08-06.db', 'system-2026-08-07.db', 'system-2026-08-08.db',
    'system-2026-08-09.db',
  ]);
});
